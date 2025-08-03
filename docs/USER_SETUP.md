# AI Business Tools Platform - User Setup

## Access the Platform

Your platform is running at: **http://localhost:3081**

## Creating User Accounts

### Option 1: Use the Registration Page (Recommended)

1. Go to http://localhost:3081
2. Click "Sign up" or "Create an account"
3. Register with these details:

**Admin Account:**
- Email: admin@jkai.com
- Username: admin
- Password: (your choice)

**Regular User Account:**
- Email: john@example.com
- Username: john
- Password: (your choice)

### Option 2: Manual Database Update

Since we're using MongoDB Atlas, you can manually set user tiers:

1. Log into MongoDB Atlas: https://cloud.mongodb.com
2. Navigate to your cluster (SovereignAI)
3. Browse Collections → LibreChat → users
4. Find the user by email
5. Add/update the `tier` field:
   - For admin: `"tier": "admin"`
   - For premium user: `"tier": "premium"`
   - For free user: `"tier": "free"`

## Default Access Levels

After registration, users start with "free" tier by default. To upgrade:

1. **Admin privileges**: Update the user's tier to "admin" in MongoDB
2. **Premium access**: Update the user's tier to "premium" in MongoDB

## Features by Tier

| Tier | Dark JK Coach | Hybrid Offer Creator | User Management |
|------|---------------|---------------------|-----------------|
| Free | ❌ | ✅ (limited) | ❌ |
| Premium | ✅ | ✅ (full) | ❌ |
| Admin | ✅ | ✅ (full) | ✅ |

## Quick MongoDB Update

In MongoDB Atlas, after finding your user:
```javascript
// Click "Edit" on the user document
// Add or modify:
{
  "tier": "admin",  // or "premium" or "free"
  "company": "JKAI",
  "role": "Administrator"
}
```

## Testing the Setup

1. Register two accounts as described above
2. Update their tiers in MongoDB Atlas
3. Log in and verify:
   - Admin can access all tools and see admin features
   - Premium user can access both business tools
   - Free user can only access Hybrid Offer Creator

## Notes

- The custom tier system is implemented in `/api/middleware/tierAccess.js`
- User model extensions are in `/api/models/User.js`
- These files are mounted into the container via docker-compose