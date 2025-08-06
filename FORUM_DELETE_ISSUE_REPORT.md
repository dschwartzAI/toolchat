# Forum Post Delete Functionality - Issue Report

## Goal
Implement delete functionality for forum posts with an inline "X" button that allows admins and post authors to delete posts.

## Current Status
The delete functionality is **NOT WORKING** - returns 500 Internal Server Error when attempting to delete posts.

## Primary Error
```
ForumPost validation failed: category: Cast to ObjectId failed for value "general" (type string) at path "category" because of "BSONError"
```

## Root Cause Analysis
The issue stems from a schema mismatch in the ForumPost model. The `category` field is defined as a String but was initially configured with `ref: 'ForumCategory'`, which tells Mongoose to expect an ObjectId. When the soft delete method calls `save()`, Mongoose validates the document and fails because "general" is a string, not an ObjectId.

## Attempted Solutions

### 1. Fixed Data Response Structure
- **Issue**: API returning 500 errors, data mismatches between API and frontend
- **Solution**: Fixed ForumService import by adding custom models to db/models.js
- **Result**: ✅ Posts now display correctly

### 2. Added Delete UI
- **Issue**: No delete button visible for admins
- **Solution**: Added X button in PostPreview.tsx with proper authorization checks
- **Result**: ✅ Delete button appears for admins/authors

### 3. Fixed Request/Response Handling
- **Issue**: Request utility already extracts .data from axios responses
- **Solution**: Updated all mutations to use `response` instead of `response.data`
- **Result**: ✅ Proper data flow established

### 4. Fixed Authentication Issues
- **Issue**: Uncertainty about req.user.id vs req.user._id
- **Solution**: Standardized to use `req.user.id` throughout ForumController
- **Result**: ✅ User authentication working correctly

### 5. Fixed Model Schema (ATTEMPTED)
- **Issue**: ForumPost model has `category: { type: String, ref: 'ForumCategory' }`
- **Solution**: Removed `ref: 'ForumCategory'` from the schema
- **Result**: ❌ **STILL FAILING** - Even after server restart, same validation error persists

## Current Code State

### ForumPost Model (`/api/models/ForumPost.js`)
```javascript
category: {
  type: String,
  index: true,
},
```
(Note: `ref: 'ForumCategory'` has been removed)

### ForumController Delete Method
- Properly checks user authentication
- Verifies admin role or post ownership
- Calls `post.softDelete(userId)`
- Has comprehensive error logging

### Frontend Delete Flow
- Delete button triggers mutation
- Mutation calls `/api/lms/forum/posts/${postId}` DELETE endpoint
- Error handling and logging in place

## Persistent Issues

1. **Mongoose Model Caching**: Despite removing the `ref` field and restarting the server multiple times, Mongoose continues to validate the category field as if it expects an ObjectId.

2. **Category Field Type Mismatch**: The database stores category as string values like "general", but something in the validation pipeline still expects ObjectId.

3. **Soft Delete Save Validation**: The error occurs specifically when `softDelete()` calls `save()` on the document, triggering Mongoose validation.

## Next Steps to Investigate

1. **Check if ForumCategory model exists**: The ref might be causing issues even without the model being properly defined.

2. **Direct MongoDB Update**: Consider bypassing Mongoose validation by using `findByIdAndUpdate` instead of `save()` in the softDelete method.

3. **Schema Plugin Conflicts**: Check if any Mongoose plugins or pre-save hooks are interfering with the validation.

4. **Database Migration**: The existing documents in the database might have a schema version that conflicts with the current model definition.

5. **Complete Model Registry Clear**: There might be a need to completely clear the Mongoose model registry, not just restart the server.

## Environment Details
- **Framework**: LibreChat v0.7.9-rc1 (heavily customized fork)
- **Backend**: Express + MongoDB + Mongoose
- **Frontend**: React + TypeScript + React Query
- **Database**: MongoDB Atlas (shared between local and production)
- **Issue Location**: `/api/server/controllers/lms/ForumController.js` - deletePost method

## Error Logs
```
2025-08-06T01:08:48.873Z error: [ForumController] Error deleting post: ForumPost validation failed: category: Cast to ObjectId failed for value "general" (type string) at path "category" because of "BSONError"
```

## Recommendation
The issue appears to be deeply embedded in how Mongoose is handling the schema validation. Consider either:
1. Changing the approach to use `findByIdAndUpdate` with `$set: { deletedAt, deletedBy }` to bypass validation
2. Migrating existing documents to use ObjectId references for categories
3. Investigating if there's a cached schema definition somewhere that's overriding the model changes