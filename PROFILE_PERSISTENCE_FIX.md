# LibreChat Profile Persistence Fix - Complete Solution

## Problem Summary
Custom user profile fields (bio, location, jobTitle, company) appear to save successfully but don't persist after page refresh due to multiple User model definitions competing in the Mongoose registry.

## Root Cause
The base User model from `packages/data-schemas/src/models/user.ts` registers first without custom fields. Later attempts to register extended schemas fail because Mongoose reuses the already-registered model, causing unknown fields to be ignored under strict mode.

## Solution Overview
Extend the existing User model's schema instead of re-registering it, ensuring all code paths use the single, unified model with custom fields.

## Implementation Steps

### 1. Create Schema Extension File
**File**: `api/server/bootstrap/extend-user.js`

```javascript
// api/server/bootstrap/extend-user.js
const mongoose = require('mongoose');

// Ensure the base User model is already registered
const User = mongoose.models.User;
if (!User) {
  throw new Error('[extend-user] User model not registered yet. Ensure data-schemas registers it before this file runs.');
}

// Add custom fields to the existing schema
User.schema.add({
  company: { 
    type: String,
    trim: true
  },
  jobTitle: { 
    type: String,
    trim: true
  },
  industry: { 
    type: String,
    trim: true
  },
  location: { 
    type: String,
    trim: true
  },
  bio: { 
    type: String,
    trim: true,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  }
});

// Ensure indexes for new fields
User.schema.index({ company: 1 });
User.schema.index({ jobTitle: 1 });
User.schema.index({ location: 1 });

module.exports = User;
```

### 2. Wire Extension at Server Startup
**File**: `api/server/index.js`

Add this line immediately after MongoDB connection is established:

```javascript
// After mongoose.connect() and before routes
require('~/server/bootstrap/extend-user');
```

### 3. Update User Model Import
**File**: `api/models/User.js`

Replace the entire file with:

```javascript
// api/models/User.js
const mongoose = require('mongoose');

// Ensure extension is applied
require('~/server/bootstrap/extend-user');

// Export the unified model
module.exports = mongoose.models.User;
```

### 4. Update User Controller
**File**: `api/server/controllers/UserController.js`

Update the import and simplify the update logic:

```javascript
// api/server/controllers/UserController.js
const mongoose = require('mongoose');
const User = mongoose.models.User;

const updateProfileController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, bio, location, jobTitle, company } = req.body;
    
    // Build update object
    const updateData = {};
    if (bio !== undefined) updateData.bio = bio.trim().substring(0, 500);
    if (location !== undefined) updateData.location = location.trim();
    if (jobTitle !== undefined) updateData.jobTitle = jobTitle.trim();
    if (company !== undefined) updateData.company = company.trim();
    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email.trim();
    
    // Use findByIdAndUpdate with the unified model
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -totpSecret');
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(updatedUser);
  } catch (error) {
    logger.error('[updateProfileController]', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

module.exports = {
  updateProfileController
};
```

### 5. Frontend Cache Strategy
**File**: `/client/src/data-provider/Auth/mutations.ts`

Keep the current optimistic update strategy:

```typescript
export const useUpdateProfileMutation = (
  options?: t.MutationOptions<t.TUser, Partial<t.TUser>, unknown, unknown>,
): UseMutationResult<t.TUser, unknown, Partial<t.TUser>, unknown> => {
  const queryClient = useQueryClient();
  return useMutation(
    (payload: Partial<t.TUser>) => {
      return dataService.updateProfile(payload);
    },
    {
      onSuccess: (data, variables, ...args) => {
        // Immediately update cache for instant UI feedback
        queryClient.setQueryData([QueryKeys.user], data);
        
        // Invalidate after a short delay to ensure consistency
        setTimeout(() => {
          queryClient.invalidateQueries([QueryKeys.user]);
        }, 300);
        
        options?.onSuccess?.(data, variables, ...args);
      },
    },
  );
};
```

### 6. Verification Script
**File**: `scripts/verify-persistence.js`

```javascript
// scripts/verify-persistence.js
const mongoose = require('mongoose');
const config = require('~/config/loader');

async function verifyPersistence() {
  try {
    await mongoose.connect(config.mongo.uri);
    
    const User = mongoose.models.User;
    
    // Check schema fields
    console.log('User schema fields:', Object.keys(User.schema.paths));
    
    // Test update
    const testUser = await User.findOne({ email: 'test@example.com' });
    if (testUser) {
      await User.findByIdAndUpdate(testUser._id, {
        $set: { bio: 'Test persistence', location: 'Test City' }
      });
      
      const updated = await User.findById(testUser._id);
      console.log('Updated user:', {
        bio: updated.bio,
        location: updated.location,
        company: updated.company
      });
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Verification failed:', error);
  }
}

verifyPersistence();
```

### 7. Testing Checklist

1. **Start servers**: `./scripts/restart-servers.sh`
2. **Navigate**: http://localhost:3090
3. **Test**: Settings > Account > Profile
4. **Verify**: 
   - Enter data in custom fields
   - Click Save Profile
   - See success notification
   - Hard refresh page (Cmd+Shift+R)
   - Confirm fields persist
   - Check MongoDB Atlas directly

### 8. Debug Commands

```bash
# Check current model registration
node -e "const mongoose = require('mongoose'); console.log(Object.keys(mongoose.models))"

# Verify schema extension
node -e "const mongoose = require('mongoose'); require('./api/server/bootstrap/extend-user'); console.log(Object.keys(mongoose.models.User.schema.paths))"

# Test direct update
node scripts/verify-persistence.js
```

### 9. Common Issues & Solutions

**Issue**: "OverwriteModelError"
**Solution**: Ensure extension runs only once, after base model registration

**Issue**: Fields still undefined after refresh
**Solution**: Check MongoDB Atlas directly - if fields exist there, it's a frontend cache issue

**Issue**: Duplicate index warnings
**Solution**: These should disappear once you stop re-registering the model

### 10. Production Deployment

1. **Environment variables**: Ensure MONGO_URI points to production Atlas
2. **Database**: Verify custom fields exist in production documents
3. **Monitoring**: Add logging to track successful updates
4. **Rollback**: Keep old model file as backup: `api/models/User.js.backup`

## Success Criteria

- [ ] Custom fields save successfully
- [ ] Data persists after hard refresh
- [ ] No duplicate model warnings
- [ ] All existing functionality preserved
- [ ] Production environment verified

## Support

If issues persist:
1. Check MongoDB Atlas directly for field existence
2. Verify model registration order in startup logs
3. Test with a fresh user document
4. Check for any remaining duplicate model registrations
