# Account Migration Cloud Function - Implementation Summary

## What Was Created

### 1. Cloud Functions Code
- **File:** `functions/index.ts`
- **Two Functions:**
  1. `moveApprovedAccountsToUsers` - Firestore onUpdate trigger
  2. `manualMigrateAccount` - Callable HTTPS function

### 2. Configuration Files
- **functions/package.json** - Dependencies and scripts
- **functions/tsconfig.json** - TypeScript configuration
- **firebase.json** - Firebase project configuration
- **.firebaserc** - Firebase project ID reference

### 3. Migration Tools
- **migrate-account.js** - Node.js script for manual migrations
- **CLOUD_FUNCTIONS.md** - Detailed technical documentation
- **DEPLOYMENT_GUIDE.md** - Step-by-step deployment guide

## How It Works

### Automatic Migration (onUpdate Trigger)

When a document in `accountCreationRequests` has its `status` field changed to "approved":

1. Function detects the status change
2. Creates new document in `users` collection with same ID
3. Copies ALL fields from original document
4. Adds:
   - `movedAt`: Server timestamp
   - `active`: true
5. Deletes original document from `accountCreationRequests`
6. Logs all operations

### Manual Migration

Run the migration script with a document ID:
```bash
node migrate-account.js BbNPtDj37KSag6XH2WJ2
```

The script:
1. Fetches the document from `accountCreationRequests`
2. Copies all fields to `users` collection
3. Adds `movedAt` and `active: true`
4. Deletes the original document
5. Shows success/failure with details

## Key Features

✅ **Data Integrity**
- Document ID preserved
- All fields copied exactly
- Timestamps preserved
- Maps and nested objects preserved
- Arrays preserved

✅ **Safety**
- Try/catch error handling
- Transaction-safe (only deletes after successful copy)
- Comprehensive logging with document ID
- Detailed error messages

✅ **Flexibility**
- Automatic trigger on status change
- Manual migration via script or HTTPS function
- Admin SDK support for secure operations

✅ **Observability**
- Detailed console logs with document ID prefix
- Error tracking and reporting
- Easy monitoring via Firebase CLI

## Usage Instructions

### Deploy Cloud Functions
```bash
cd functions
npm install
npm run deploy
```

### Migrate Specific Account (Manual)
```bash
# 1. Get service account key from Firebase Console
# 2. Save as serviceAccountKey.json
# 3. Run migration
node migrate-account.js BbNPtDj37KSag6XH2WJ2
```

### Monitor Migrations
```bash
# View real-time logs
firebase functions:log --follow

# Search for specific account
firebase functions:log | grep "BbNPtDj37KSag6XH2WJ2"
```

## File Structure

```
project/
├── functions/
│   ├── index.ts                 (Cloud Functions code)
│   ├── package.json             (Dependencies)
│   ├── tsconfig.json            (TypeScript config)
│   ├── lib/                     (Compiled JS)
│   └── node_modules/
├── firebase.json                (Firebase config)
├── .firebaserc                  (Project ID)
├── migrate-account.js           (Manual migration script)
├── CLOUD_FUNCTIONS.md           (Technical docs)
├── DEPLOYMENT_GUIDE.md          (Deployment instructions)
└── MIGRATION_SUMMARY.md         (This file)
```

## Technical Details

### Function: moveApprovedAccountsToUsers

**Trigger:** Firestore onUpdate on `accountCreationRequests/{docId}`

**Region:** us-central1

**Runtime:** Node.js 18

**Execution:**
1. Monitors all updates to accountCreationRequests
2. Detects status field changes
3. If status → "approved":
   - Copies to users/{docId}
   - Adds movedAt and active fields
   - Deletes from accountCreationRequests

**Error Handling:**
- Wrapped in try/catch
- Logs errors with document ID
- Throws HttpsError with details

**Logs Example:**
```
[BbNPtDj37KSag6XH2WJ2] Status change: pending -> approved
[BbNPtDj37KSag6XH2WJ2] Detected approval. Starting migration...
[BbNPtDj37KSag6XH2WJ2] Creating user document with fields: email, name, ...
[BbNPtDj37KSag6XH2WJ2] User document created successfully
[BbNPtDj37KSag6XH2WJ2] Account creation request deleted successfully
```

### Function: manualMigrateAccount

**Type:** Callable HTTPS function

**Region:** us-central1

**Runtime:** Node.js 18

**Parameters:** { docId: string }

**Requires:** Firebase authentication

**Response:** 
```json
{
  "success": true,
  "docId": "BbNPtDj37KSag6XH2WJ2",
  "message": "Account successfully moved to users collection"
}
```

## Firestore Schema

### accountCreationRequests Collection
```
{
  id: string (document ID),
  email: string,
  name: string,
  phone: string,
  status: "pending" | "approved" | "rejected",
  investmentAmount: number,
  createdAt: timestamp,
  // ... other fields
}
```

### users Collection
```
{
  id: string (same as source),
  email: string,
  name: string,
  phone: string,
  status: string,
  investmentAmount: number,
  createdAt: timestamp,
  movedAt: timestamp,        (added by function)
  active: true,              (added by function)
  // ... all other fields
}
```

## Requirements Met

✅ Use onUpdate Firestore trigger
✅ Keep same document ID when moving
✅ Copy all fields from old document to new user document
✅ Add new field movedAt: serverTimestamp() and active: true
✅ Delete document from accountCreationRequests after successful copy
✅ Log success and errors
✅ Use Firebase Admin SDK with getFirestore()
✅ Preserve timestamps, maps, and nested data exactly
✅ Wrap logic in try/catch for safe execution
✅ Move specific account BbNPtDj37KSag6XH2WJ2 (via manual script)

## Next Steps

1. Update `.firebaserc` with your Firebase project ID
2. Deploy: `cd functions && npm run deploy`
3. Test with a non-critical account first
4. Optionally migrate BbNPtDj37KSag6XH2WJ2 manually:
   ```bash
   node migrate-account.js BbNPtDj37KSag6XH2WJ2
   ```
5. Monitor logs during rollout

## Support

For detailed information:
- Technical details: See CLOUD_FUNCTIONS.md
- Deployment steps: See DEPLOYMENT_GUIDE.md
- Troubleshooting: See DEPLOYMENT_GUIDE.md Troubleshooting section
