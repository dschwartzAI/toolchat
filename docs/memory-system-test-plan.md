# Memory System Test Plan

## Overview
This test plan verifies that the memory system is working correctly across all agents while remaining invisible to users.

## Prerequisites
1. Memory system configured in `librechat.yaml` ✅
2. Memory UI components hidden ✅
3. New user registration enables memories automatically ✅
4. Migration script available for existing users ✅
5. Agent instructions updated with memory integration ✅

## Test Scenarios

### 0. Assistant Memory Integration
**Steps:**
1. Start conversation with an OpenAI assistant that has vector store
2. Share business information: "I run a SaaS coaching business helping founders scale from $1M to $10M ARR"
3. Start new conversation with same assistant
4. Ask: "What type of business do I run?"

**Expected:** Assistant should reference the SaaS coaching business without re-asking

### 1. New User Memory Enablement
**Steps:**
1. Register a new user account
2. Check MongoDB to verify `personalization.memories` is set to `true`

**Expected:** New users have memories enabled automatically

**MongoDB Check:**
```javascript
db.users.findOne({ email: "newuser@example.com" }, { personalization: 1 })
// Should show: { personalization: { memories: true } }
```

### 2. Existing User Migration
**Steps:**
1. Run the migration script: `node scripts/enable-memories-for-all-users.js`
2. Verify all existing users have memories enabled

**Expected:** All users have `personalization.memories: true`

### 3. Cross-Agent Memory Sharing
**Steps:**
1. Start conversation with Dark JK Coach
2. Share business information: "I run a SaaS coaching business helping founders scale from $1M to $10M ARR"
3. Switch to Hybrid Offer Printer
4. Ask: "I need help creating a new offer"

**Expected:** Hybrid Offer Printer should reference the SaaS founder audience without asking again

### 4. Memory Persistence
**Steps:**
1. Share information with any agent
2. Log out and log back in
3. Start new conversation with different agent

**Expected:** Previous business context is retained and used

### 5. Natural Language Integration
**Steps:**
1. Share various business details across conversations
2. Monitor agent responses for memory references

**Expected:** 
- ✅ Agents use context naturally
- ❌ Agents never say "according to your memories" or similar

### 6. Memory Updates
**Steps:**
1. Share initial pricing: "My coaching package costs $3,000/month"
2. Later update: "I've increased my pricing to $5,000/month"
3. Ask for offer creation

**Expected:** Agent uses new $5,000 pricing, not old $3,000

### 7. UI Verification
**Steps:**
1. Check Settings - no Personalization tab
2. Check side panel - no Memory viewer
3. Check chat messages - no memory indicators

**Expected:** All memory UI elements are hidden

## Testing Checklist

- [ ] New user registration auto-enables memories
- [ ] Migration script enables memories for existing users
- [ ] Dark JK Coach stores business information
- [ ] Hybrid Offer Printer uses stored context
- [ ] DCM Tool references business details
- [ ] Information persists across sessions
- [ ] No memory UI elements visible
- [ ] Agents never explicitly mention memories
- [ ] Memory updates override old information
- [ ] Context shared across all agents

## Troubleshooting

### Memory Not Appearing in Agent Responses
1. Check user's `personalization.memories` in MongoDB
2. Verify memory system enabled in `librechat.yaml`
3. Check agent has memory integration instructions
4. Verify memories exist in database

### UI Elements Still Visible
1. Rebuild Docker image if using Docker
2. Clear browser cache
3. Verify all component files return `null`

### Cross-Agent Sharing Not Working
1. Verify all agents belong to same user
2. Check memory retrieval in agent build process
3. Monitor API logs for memory fetch calls

## MongoDB Queries for Verification

Check if user has memories enabled:
```javascript
db.users.findOne({ email: "user@example.com" }, { personalization: 1 })
```

View user's memories:
```javascript
db.memories.find({ userId: ObjectId("user_id_here") })
```

Count users with memories enabled:
```javascript
db.users.countDocuments({ "personalization.memories": true })
```

## Success Criteria

The memory system is working correctly when:
1. All users have memories enabled (new and existing)
2. Business context flows seamlessly between agents
3. No memory UI is visible to users
4. Agents use context naturally without mentioning memories
5. Information persists across all sessions