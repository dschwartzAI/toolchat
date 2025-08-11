const { logger } = require('@librechat/data-schemas');
const { webSearchKeys, extractWebSearchEnvVars } = require('@librechat/api');
const {
  getFiles,
  updateUser,
  deleteFiles,
  deleteConvos,
  deletePresets,
  deleteMessages,
  deleteUserById,
  deleteAllUserSessions,
} = require('~/models');
const { updateUserPluginAuth, deleteUserPluginAuth } = require('~/server/services/PluginService');
const { updateUserPluginsService, deleteUserKey } = require('~/server/services/UserService');
const { verifyEmail, resendVerificationEmail } = require('~/server/services/AuthService');
const { needsRefresh, getNewS3URL } = require('~/server/services/Files/S3/crud');
const { Tools, Constants, FileSources } = require('librechat-data-provider');
const { processDeleteRequest } = require('~/server/services/Files/process');
const { Transaction, Balance } = require('~/db/models');
const User = require('~/models/User');
const { deleteToolCalls } = require('~/models/ToolCall');
const { deleteAllSharedLinks } = require('~/models');
const { getMCPManager } = require('~/config');

const getUserController = async (req, res) => {
  try {
    // Always fetch fresh user data from database to ensure custom fields are included
    const freshUser = await User.findById(req.user.id).select('-password -totpSecret -__v').lean();
    
    if (!freshUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // VERIFICATION: Direct MongoDB query to check actual database content
    const mongoose = require('mongoose');
    const directUser = await mongoose.connection.db
      .collection('users')
      .findOne({ _id: new mongoose.Types.ObjectId(req.user.id) });
    
    // Log both Mongoose and direct MongoDB results
    logger.info(`[getUserController] Mongoose query - User ${req.user.id} custom fields:`, {
      bio: freshUser.bio,
      location: freshUser.location,
      jobTitle: freshUser.jobTitle,
      company: freshUser.company
    });
    
    logger.info(`[getUserController] Direct MongoDB - User ${req.user.id} custom fields:`, {
      bio: directUser?.bio,
      location: directUser?.location,
      jobTitle: directUser?.jobTitle,
      company: directUser?.company
    });
    
    /** @type {MongoUser} */
    const userData = { ...freshUser, id: freshUser._id.toString() };
    
    if (req.app.locals.fileStrategy === FileSources.s3 && userData.avatar) {
      const avatarNeedsRefresh = needsRefresh(userData.avatar, 3600);
      if (!avatarNeedsRefresh) {
        return res.status(200).send(userData);
      }
      const originalAvatar = userData.avatar;
      try {
        userData.avatar = await getNewS3URL(userData.avatar);
        await updateUser(userData.id, { avatar: userData.avatar });
      } catch (error) {
        userData.avatar = originalAvatar;
        logger.error('Error getting new S3 URL for avatar:', error);
      }
    }
    res.status(200).send(userData);
  } catch (error) {
    logger.error('[getUserController] Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user data' });
  }
};

const getTermsStatusController = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ termsAccepted: !!user.termsAccepted });
  } catch (error) {
    logger.error('Error fetching terms acceptance status:', error);
    res.status(500).json({ message: 'Error fetching terms acceptance status' });
  }
};

const acceptTermsController = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, { termsAccepted: true }, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'Terms accepted successfully' });
  } catch (error) {
    logger.error('Error accepting terms:', error);
    res.status(500).json({ message: 'Error accepting terms' });
  }
};

const deleteUserFiles = async (req) => {
  try {
    const userFiles = await getFiles({ user: req.user.id });
    await processDeleteRequest({
      req,
      files: userFiles,
    });
  } catch (error) {
    logger.error('[deleteUserFiles]', error);
  }
};

const updateUserPluginsController = async (req, res) => {
  const { user } = req;
  const { pluginKey, action, auth, isEntityTool } = req.body;
  try {
    if (!isEntityTool) {
      const userPluginsService = await updateUserPluginsService(user, pluginKey, action);

      if (userPluginsService instanceof Error) {
        logger.error('[userPluginsService]', userPluginsService);
        const { status, message } = userPluginsService;
        res.status(status).send({ message });
      }
    }

    if (auth == null) {
      return res.status(200).send();
    }

    let keys = Object.keys(auth);
    const values = Object.values(auth); // Used in 'install' block

    const isMCPTool = pluginKey.startsWith('mcp_') || pluginKey.includes(Constants.mcp_delimiter);

    // Early exit condition:
    // If keys are empty (meaning auth: {} was likely sent for uninstall, or auth was empty for install)
    // AND it's not web_search (which has special key handling to populate `keys` for uninstall)
    // AND it's NOT (an uninstall action FOR an MCP tool - we need to proceed for this case to clear all its auth)
    // THEN return.
    if (
      keys.length === 0 &&
      pluginKey !== Tools.web_search &&
      !(action === 'uninstall' && isMCPTool)
    ) {
      return res.status(200).send();
    }

    /** @type {number} */
    let status = 200;
    /** @type {string} */
    let message;
    /** @type {IPluginAuth | Error} */
    let authService;

    if (pluginKey === Tools.web_search) {
      /** @type  {TCustomConfig['webSearch']} */
      const webSearchConfig = req.app.locals?.webSearch;
      keys = extractWebSearchEnvVars({
        keys: action === 'install' ? keys : webSearchKeys,
        config: webSearchConfig,
      });
    }

    if (action === 'install') {
      for (let i = 0; i < keys.length; i++) {
        authService = await updateUserPluginAuth(user.id, keys[i], pluginKey, values[i]);
        if (authService instanceof Error) {
          logger.error('[authService]', authService);
          ({ status, message } = authService);
        }
      }
    } else if (action === 'uninstall') {
      // const isMCPTool was defined earlier
      if (isMCPTool && keys.length === 0) {
        // This handles the case where auth: {} is sent for an MCP tool uninstall.
        // It means "delete all credentials associated with this MCP pluginKey".
        authService = await deleteUserPluginAuth(user.id, null, true, pluginKey);
        if (authService instanceof Error) {
          logger.error(
            `[authService] Error deleting all auth for MCP tool ${pluginKey}:`,
            authService,
          );
          ({ status, message } = authService);
        }
      } else {
        // This handles:
        // 1. Web_search uninstall (keys will be populated with all webSearchKeys if auth was {}).
        // 2. Other tools uninstall (if keys were provided).
        // 3. MCP tool uninstall if specific keys were provided in `auth` (not current frontend behavior).
        // If keys is empty for non-MCP tools (and not web_search), this loop won't run, and nothing is deleted.
        for (let i = 0; i < keys.length; i++) {
          authService = await deleteUserPluginAuth(user.id, keys[i]); // Deletes by authField name
          if (authService instanceof Error) {
            logger.error('[authService] Error deleting specific auth key:', authService);
            ({ status, message } = authService);
          }
        }
      }
    }

    if (status === 200) {
      // If auth was updated successfully, disconnect MCP sessions as they might use these credentials
      if (pluginKey.startsWith(Constants.mcp_prefix)) {
        try {
          const mcpManager = getMCPManager(user.id);
          if (mcpManager) {
            // Extract server name from pluginKey (format: "mcp_<serverName>")
            const serverName = pluginKey.replace(Constants.mcp_prefix, '');
            logger.info(
              `[updateUserPluginsController] Disconnecting MCP server ${serverName} for user ${user.id} after plugin auth update for ${pluginKey}.`,
            );
            await mcpManager.disconnectUserConnection(user.id, serverName);
          }
        } catch (disconnectError) {
          logger.error(
            `[updateUserPluginsController] Error disconnecting MCP connection for user ${user.id} after plugin auth update:`,
            disconnectError,
          );
          // Do not fail the request for this, but log it.
        }
      }
      return res.status(status).send();
    }

    res.status(status).send({ message });
  } catch (err) {
    logger.error('[updateUserPluginsController]', err);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

const updateProfileController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, bio, location, jobTitle, company } = req.body;
    
    logger.info(`[updateProfileController] Starting profile update for user ${userId}`);
    logger.debug(`[updateProfileController] Request body:`, { name, email, bio, location, jobTitle, company });
    
    // Verify User model is available
    if (!User) {
      logger.error('[updateProfileController] User model is not available');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    // Build update object with only provided fields
    const updateData = {};
    
    if (name !== undefined && name !== null) {
      updateData.name = String(name).trim();
    }
    
    if (email !== undefined && email !== null) {
      // Validate email format
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(email)) {
        logger.warn(`[updateProfileController] Invalid email format: ${email}`);
        return res.status(400).json({ message: 'Invalid email format' });
      }
      
      // Check if email is already taken by another user
      try {
        const existingUser = await User.findOne({ 
          email: email.toLowerCase(), 
          _id: { $ne: userId } 
        });
        
        if (existingUser) {
          logger.warn(`[updateProfileController] Email already in use: ${email}`);
          return res.status(400).json({ message: 'Email is already in use' });
        }
      } catch (emailCheckError) {
        logger.error('[updateProfileController] Error checking email uniqueness:', emailCheckError);
        return res.status(500).json({ message: 'Error validating email' });
      }
      
      updateData.email = email.toLowerCase();
    }
    
    if (bio !== undefined && bio !== null) {
      // Sanitize and truncate bio to 500 chars
      updateData.bio = String(bio).trim().substring(0, 500);
    }
    
    if (location !== undefined && location !== null) {
      updateData.location = String(location).trim();
    }
    
    // Note: We use 'jobTitle' for the user's job title to avoid conflict with system 'role'
    if (jobTitle !== undefined && jobTitle !== null) {
      updateData.jobTitle = String(jobTitle).trim();
    }
    
    if (company !== undefined && company !== null) {
      updateData.company = String(company).trim();
    }
    
    logger.info(`[updateProfileController] Prepared update data:`, updateData);
    
    // Find the user document
    let user;
    try {
      user = await User.findById(userId);
      if (!user) {
        logger.error(`[updateProfileController] User not found: ${userId}`);
        return res.status(404).json({ message: 'User not found' });
      }
      logger.debug(`[updateProfileController] Found user document for ID: ${userId}`);
    } catch (findError) {
      logger.error('[updateProfileController] Error finding user:', findError);
      return res.status(500).json({ message: 'Error accessing user data' });
    }
    
    // Update fields on the document
    Object.keys(updateData).forEach(key => {
      user[key] = updateData[key];
      logger.debug(`[updateProfileController] Set user.${key} = ${updateData[key]}`);
    });
    
    // Mark modified paths explicitly for custom fields
    if ('bio' in updateData) user.markModified('bio');
    if ('location' in updateData) user.markModified('location');
    if ('jobTitle' in updateData) user.markModified('jobTitle');
    if ('company' in updateData) user.markModified('company');
    
    // Save the document - Try Mongoose first
    try {
      await user.save();
      logger.info(`[updateProfileController] Mongoose save completed`);
    } catch (saveError) {
      logger.error('[updateProfileController] Error saving user document:', saveError);
      return res.status(500).json({ message: 'Error saving profile changes' });
    }
    
    // WORKAROUND: Since Mongoose isn't persisting custom fields, update directly in MongoDB
    try {
      const mongoose = require('mongoose');
      const directUpdateResult = await mongoose.connection.db
        .collection('users')
        .updateOne(
          { _id: new mongoose.Types.ObjectId(userId) },
          { 
            $set: {
              ...updateData,
              updatedAt: new Date() // Ensure updatedAt is updated
            }
          }
        );
      
      logger.info(`[updateProfileController] Direct MongoDB update result:`, {
        matched: directUpdateResult.matchedCount,
        modified: directUpdateResult.modifiedCount,
        acknowledged: directUpdateResult.acknowledged
      });
      
      if (!directUpdateResult.acknowledged || directUpdateResult.matchedCount === 0) {
        logger.error('[updateProfileController] Direct MongoDB update failed');
        return res.status(500).json({ message: 'Failed to update profile' });
      }
    } catch (directUpdateError) {
      logger.error('[updateProfileController] Direct MongoDB update error:', directUpdateError);
      // Don't fail the request, but log the error
    }
    
    // VERIFICATION STEP 1: Check via Mongoose
    const updatedUser = await User.findById(userId).select('-password -totpSecret').lean();
    logger.info(`[updateProfileController] Mongoose query - Updated user data:`, {
      bio: updatedUser.bio,
      location: updatedUser.location,
      jobTitle: updatedUser.jobTitle,
      company: updatedUser.company
    });
    
    // VERIFICATION STEP 2: Direct MongoDB query to bypass Mongoose
    const mongoose = require('mongoose');
    const directResult = await mongoose.connection.db
      .collection('users')
      .findOne({ _id: new mongoose.Types.ObjectId(userId) });
    
    logger.info(`[updateProfileController] Direct MongoDB query - User data:`, {
      bio: directResult?.bio,
      location: directResult?.location,
      jobTitle: directResult?.jobTitle,
      company: directResult?.company
    });
    
    // VERIFICATION STEP 3: Check if fields exist in document
    const fieldCheck = {
      hasBio: 'bio' in directResult,
      hasLocation: 'location' in directResult,
      hasJobTitle: 'jobTitle' in directResult,
      hasCompany: 'company' in directResult
    };
    logger.info(`[updateProfileController] Field existence check:`, fieldCheck);
    
    logger.info(`User profile updated: ${userId}`);
    res.status(200).json(updatedUser);
  } catch (error) {
    logger.error('[updateProfileController]', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

const deleteUserController = async (req, res) => {
  const { user } = req;

  try {
    await deleteMessages({ user: user.id }); // delete user messages
    await deleteAllUserSessions({ userId: user.id }); // delete user sessions
    await Transaction.deleteMany({ user: user.id }); // delete user transactions
    await deleteUserKey({ userId: user.id, all: true }); // delete user keys
    await Balance.deleteMany({ user: user._id }); // delete user balances
    await deletePresets(user.id); // delete user presets
    /* TODO: Delete Assistant Threads */
    try {
      await deleteConvos(user.id); // delete user convos
    } catch (error) {
      logger.error('[deleteUserController] Error deleting user convos, likely no convos', error);
    }
    await deleteUserPluginAuth(user.id, null, true); // delete user plugin auth
    await deleteUserById(user.id); // delete user
    await deleteAllSharedLinks(user.id); // delete user shared links
    await deleteUserFiles(req); // delete user files
    await deleteFiles(null, user.id); // delete database files in case of orphaned files from previous steps
    await deleteToolCalls(user.id); // delete user tool calls
    /* TODO: queue job for cleaning actions and assistants of non-existant users */
    logger.info(`User deleted account. Email: ${user.email} ID: ${user.id}`);
    res.status(200).send({ message: 'User deleted' });
  } catch (err) {
    logger.error('[deleteUserController]', err);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

const verifyEmailController = async (req, res) => {
  try {
    const verifyEmailService = await verifyEmail(req);
    if (verifyEmailService instanceof Error) {
      return res.status(400).json(verifyEmailService);
    } else {
      return res.status(200).json(verifyEmailService);
    }
  } catch (e) {
    logger.error('[verifyEmailController]', e);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

const resendVerificationController = async (req, res) => {
  try {
    const result = await resendVerificationEmail(req);
    if (result instanceof Error) {
      return res.status(400).json(result);
    } else {
      return res.status(200).json(result);
    }
  } catch (e) {
    logger.error('[verifyEmailController]', e);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

module.exports = {
  getUserController,
  getTermsStatusController,
  acceptTermsController,
  updateProfileController,
  deleteUserController,
  verifyEmailController,
  updateUserPluginsController,
  resendVerificationController,
};
