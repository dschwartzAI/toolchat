# LibreChat Profile Persistence Issue - Debug Summary

## Problem Statement
User profile fields (bio, location, jobTitle, company) appear to save successfully with success notifications, but the data does not persist after page refresh. We're stuck in an infinite loop between two issues:
1. **WITH cache invalidation**: Form fields snap back to previous values immediately after save
2. **WITHOUT cache invalidation**: Data doesn't persist after page refresh

## Environment
- **Framework**: LibreChat v0.7.9-rc1 (heavily customized fork)
- **Backend**: Express + MongoDB (Mongoose)
- **Frontend**: React + TypeScript + React Query (TanStack Query)
- **Database**: MongoDB Atlas (shared between local and production)
- **Development Ports**: Backend on 3080, Frontend on 3090 (proxies to backend)

## Key Files Involved

### 1. User Model Schema
**Path**: `/api/models/User.js`
```javascript
// Lines 56-74 - Custom fields added to schema
company: {
  type: String
},
role: {
  type: String  // System role (ADMIN, USER, etc.)
},
jobTitle: {
  type: String  // User's job title/position
},
industry: {
  type: String
},
location: {
  type: String  // City, State/Country format
},
bio: {
  type: String,
  maxlength: [500, 'Bio cannot exceed 500 characters']
}
```

### 2. Backend Controller
**Path**: `/api/server/controllers/UserController.js`

**Current Implementation** (after multiple attempts):
```javascript
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
    
    // Latest attempt - using document save method
    const user = await User.findById(userId);
    Object.keys(updateData).forEach(key => {
      user[key] = updateData[key];
    });
    
    // Mark modified paths explicitly
    if (updateData.bio !== undefined) user.markModified('bio');
    if (updateData.location !== undefined) user.markModified('location');
    if (updateData.jobTitle !== undefined) user.markModified('jobTitle');
    if (updateData.company !== undefined) user.markModified('company');
    
    await user.save();
    
    const updatedUser = await User.findById(userId).select('-password -totpSecret').lean();
    res.status(200).json(updatedUser);
  } catch (error) {
    logger.error('[updateProfileController]', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};
```

### 3. Frontend Mutation Hook
**Path**: `/client/src/data-provider/Auth/mutations.ts`
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
        
        // Delayed invalidation to prevent snapback
        setTimeout(() => {
          queryClient.invalidateQueries([QueryKeys.user]);
        }, 500);
        
        options?.onSuccess?.(data, variables, ...args);
      },
    },
  );
};
```

### 4. Frontend Component
**Path**: `/client/src/components/Nav/SettingsTabs/Account/ProfileEditor.tsx`
```typescript
const ProfileEditor: React.FC = () => {
  const { user } = useAuthContext();
  const hasInitialized = useRef(false);
  const isSaving = useRef(false);
  
  const [formData, setFormData] = useState({
    name: '', email: '', bio: '', location: '', jobTitle: '', company: '',
  });

  const profileMutation = useUpdateProfileMutation({
    onMutate: () => {
      isSaving.current = true;
    },
    onSuccess: (data) => {
      showToast({ message: 'Profile updated successfully!' });
      setTimeout(() => {
        isSaving.current = false;
      }, 1000);
    },
  });

  useEffect(() => {
    if (user && !hasInitialized.current) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        location: user.location || '',
        jobTitle: user.jobTitle || '',
        company: user.company || '',
      });
      hasInitialized.current = true;
    }
  }, [user]);
};
```

## Attempted Solutions That Failed

1. **Using findByIdAndUpdate with $set**:
   ```javascript
   await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true })
   ```
   Result: Data doesn't persist

2. **Using findByIdAndUpdate without $set**:
   ```javascript
   await User.findByIdAndUpdate(userId, updateData, { new: true, strict: false })
   ```
   Result: Data doesn't persist

3. **Using document.save() with markModified**:
   ```javascript
   const user = await User.findById(userId);
   user.bio = updateData.bio;
   user.markModified('bio');
   await user.save();
   ```
   Result: Data still doesn't persist

4. **Cache invalidation strategies**:
   - Immediate invalidation: Causes form snapback
   - No invalidation: Data doesn't refresh after save
   - Delayed invalidation (500ms): Prevents snapback but data still doesn't persist

## Console Logs Showing the Issue

```javascript
// Frontend sends correct data
[useUpdateProfileMutation] Sending profile update: {
  bio: "Test bio",
  location: "San Francisco, CA",
  jobTitle: "Developer",
  company: "Tech Co"
}

// Backend receives and processes correctly
[updateProfileController] Updating profile for user 65abc123 {
  bio: "Test bio",
  location: "San Francisco, CA",
  jobTitle: "Developer", 
  company: "Tech Co"
}

// Backend claims successful save
[updateProfileController] Updated user data after save: {
  bio: "Test bio",
  location: "San Francisco, CA",
  jobTitle: "Developer",
  company: "Tech Co"
}

// But after refresh, getUserController shows empty fields
[getUserController] User 65abc123 custom fields: {
  bio: undefined,
  location: undefined,
  jobTitle: undefined,
  company: undefined
}
```

## Mongoose Warnings on Startup
```
[MONGOOSE] Warning: Duplicate schema index on {"email":1} found
[MONGOOSE] Warning: Duplicate schema index on {"username":1} found
[MONGOOSE] Warning: Duplicate schema index on {"tier":1} found
```

## Potential Root Causes to Investigate

1. **Multiple User Model Definitions**: The User model is imported in multiple places:
   - `/api/models/User.js` (main definition)
   - `/packages/data-schemas/src/models/user.ts` (LibreChat's base model)
   - Various controllers using `require('~/models/User')`

2. **Schema Registration Issues**: Line 307 in User.js uses:
   ```javascript
   const User = mongoose.models.User || mongoose.model('User', userSchema);
   ```
   This could be creating different model instances.

3. **LibreChat's updateUser Function**: In `/packages/data-schemas/src/methods/user.ts`:
   ```javascript
   async function updateUser(userId: string, updateData: Partial<IUser>): Promise<IUser | null> {
     const User = mongoose.models.User;
     const updateOperation = {
       $set: updateData,
       $unset: { expiresAt: '' }, // This might interfere
     };
     return await User.findByIdAndUpdate(userId, updateOperation, { new: true });
   }
   ```
   We're NOT using this function, but it might indicate a pattern LibreChat expects.

4. **MongoDB Connection**: The connection appears stable, but the data isn't actually being written to MongoDB Atlas despite successful responses.

## Current State
- Frontend correctly sends data to backend ✅
- Backend receives data correctly ✅
- Backend returns success response ✅
- Frontend shows success notification ✅
- Data appears in UI temporarily ✅
- Data does NOT persist in MongoDB ❌
- After refresh, fields are empty ❌

## What We Need Help With
1. Why isn't MongoDB actually persisting these fields despite successful save operations?
2. Is there a schema mismatch or multiple model registration issue?
3. Is there something in LibreChat's architecture preventing custom field persistence?
4. How can we verify if the data is actually being written to MongoDB Atlas?

## Testing Instructions
1. Start servers: `./scripts/restart-servers.sh`
2. Navigate to http://localhost:3090
3. Go to Settings > Account
4. Enter data in bio, location, job title, company fields
5. Click Save Profile
6. See success notification
7. Refresh page
8. Observe fields are empty again

## Additional Context
- This is a customized LibreChat fork for business tools
- MongoDB Atlas is shared between local and production environments
- The same User model successfully saves other fields (name, email, tier, etc.)
- Standard LibreChat fields persist correctly, only our custom fields don't persist