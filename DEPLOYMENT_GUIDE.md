# Firebase Cloud Functions Deployment Guide

## Quick Start

### For Automatic Account Migration (onUpdate Trigger)

The Cloud Function automatically migrates accounts when their status changes to "approved" in the `accountCreationRequests` collection.

1. **Deploy the Cloud Function:**
   ```bash
   cd functions
   npm install
   npm run deploy
   ```

2. **Test the trigger:**
   - In Firebase Console, navigate to `accountCreationRequests` collection
   - Update any document's `status` field to "approved"
   - The function will automatically:
     - Copy the document to the `users` collection with the same ID
     - Add `movedAt` (server timestamp) and `active: true`
     - Delete the document from `accountCreationRequests`

### Manual Account Migration

To immediately migrate a specific account (e.g., `BbNPtDj37KSag6XH2WJ2`):

1. **Setup Firebase Admin Access:**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save as `serviceAccountKey.json` in project root (NOT in version control)

2. **Add to .gitignore:**
   ```bash
   echo "serviceAccountKey.json" >> .gitignore
   ```

3. **Run the migration script:**
   ```bash
   node migrate-account.js BbNPtDj37KSag6XH2WJ2
   ```

   Output will show:
   ```
   === Starting Account Migration ===
   Document ID: BbNPtDj37KSag6XH2WJ2

   Retrieved account data:
     Fields: email, name, status, createdAt, ...
     Current Status: pending

   Creating user document...
   ✓ User document created with ID: BbNPtDj37KSag6XH2WJ2

   Deleting from accountCreationRequests...
   ✓ Document deleted from accountCreationRequests

   === Migration Completed Successfully ===
   Account BbNPtDj37KSag6XH2WJ2 moved from accountCreationRequests to users collection
   ```

## Function Details

### 1. moveApprovedAccountsToUsers (Firestore Trigger)

**Configuration:**
- Trigger: `onUpdate` on `accountCreationRequests/{docId}`
- Region: `us-central1`
- Runtime: Node.js 18

**Behavior:**
- Monitors all updates to `accountCreationRequests` collection
- When a document's `status` changes to "approved":
  1. Creates a new document in `users` collection with same ID
  2. Copies ALL fields from original document
  3. Adds `movedAt: serverTimestamp()` and `active: true`
  4. Deletes the document from `accountCreationRequests`
- Logs all operations with document ID for tracking

**Logs Example:**
```
[BbNPtDj37KSag6XH2WJ2] Status change: pending -> approved
[BbNPtDj37KSag6XH2WJ2] Detected approval. Starting migration...
[BbNPtDj37KSag6XH2WJ2] Creating user document with fields: email, name, phone, status, ...
[BbNPtDj37KSag6XH2WJ2] User document created successfully
[BbNPtDj37KSag6XH2WJ2] Account creation request deleted successfully
[BbNPtDj37KSag6XH2WJ2] Migration completed: accountCreationRequests -> users
```

### 2. manualMigrateAccount (Callable HTTPS Function)

**Configuration:**
- Type: Callable HTTPS function
- Region: `us-central1`
- Requires: Authentication

**Usage from Frontend:**
```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const migrateAccount = httpsCallable(functions, 'manualMigrateAccount');

try {
  const result = await migrateAccount({ docId: 'BbNPtDj37KSag6XH2WJ2' });
  console.log(result.data);
} catch (error) {
  console.error(error);
}
```

## Data Flow

### Before Migration
```
accountCreationRequests/BbNPtDj37KSag6XH2WJ2
├── email: "investor@example.com"
├── name: "Investor Name"
├── phone: "+1234567890"
├── status: "approved"  ← Change to "approved" triggers migration
├── investmentAmount: 50000
├── createdAt: 2024-11-08T12:00:00Z
├── documentUrl: "gs://bucket/docs/doc.pdf"
└── verificationData: { ... nested object ... }
```

### After Migration
```
users/BbNPtDj37KSag6XH2WJ2
├── email: "investor@example.com"
├── name: "Investor Name"
├── phone: "+1234567890"
├── status: "approved"
├── investmentAmount: 50000
├── createdAt: 2024-11-08T12:00:00Z
├── documentUrl: "gs://bucket/docs/doc.pdf"
├── verificationData: { ... nested object ... }
├── movedAt: 2024-11-08T14:30:45.123Z  ← Added by function
├── active: true                        ← Added by function
└── (accountCreationRequests/BbNPtDj37KSag6XH2WJ2 deleted)
```

## Firestore Security Rules

Configure these rules to secure the collections:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Account creation requests - staff only
    match /accountCreationRequests/{document=**} {
      allow read, write: if request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'staff';
    }

    // Users collection - authenticated users can read/write own data
    match /users/{uid} {
      allow read: if request.auth.uid == uid;
      allow write: if request.auth.uid == uid;
      allow read, write: if request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## Troubleshooting

### Function not deploying
```bash
# Check Firebase CLI is logged in
firebase login

# Ensure correct project is selected
firebase projects:list
firebase use your-project-id

# Deploy with verbose output
firebase deploy --only functions --debug
```

### Function not triggering
1. Verify the document is actually being updated (not just read)
2. Check that `status` field exists and is being modified
3. Review Cloud Function logs:
   ```bash
   firebase functions:log --follow
   ```

### Permission errors in logs
- Add Cloud Datastore User role to Cloud Functions service account
- Or create a custom role with required permissions:
  - firestore.databases.get
  - firestore.documents.create
  - firestore.documents.delete
  - firestore.documents.get
  - firestore.documents.list
  - firestore.documents.update

### Manual migration script fails
1. Ensure `serviceAccountKey.json` exists in project root
2. Verify document ID is correct
3. Check document exists in `accountCreationRequests`
4. Review error message for specific issue

## Environment Configuration

### Firebase Project Setup
1. Create project in [Firebase Console](https://console.firebase.google.com)
2. Enable Firestore Database
3. Create `accountCreationRequests` and `users` collections
4. Enable Cloud Functions

### .env Configuration
No additional .env configuration needed for Cloud Functions. They use Firebase Admin SDK initialized in the function context.

### .firebaserc Configuration
Update project ID:
```json
{
  "projects": {
    "default": "your-firebase-project-id"
  }
}
```

## Monitoring & Observability

### View Real-time Logs
```bash
firebase functions:log --follow
```

### Search for Specific Document
```bash
firebase functions:log | grep "BbNPtDj37KSag6XH2WJ2"
```

### View Function Details in Console
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to Cloud Functions
4. Click on `moveApprovedAccountsToUsers` or `manualMigrateAccount`
5. View execution logs and metrics

## Cost Estimation

For a typical implementation:
- Function invocations: ~$0.0000004 per invocation
- Compute time: ~$0.0000002500 per GB-second
- Firestore operations: ~$0.24 per 1,000 accounts migrated

Estimated monthly cost for 1,000 migrations: < $1

## Next Steps

1. Deploy Cloud Functions to production
2. Test with a non-critical account first
3. Monitor logs during initial rollout
4. Set up alerting for function errors
5. Document your approval workflow for staff
