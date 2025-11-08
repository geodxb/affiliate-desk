# Firebase Cloud Functions Setup

This project includes Firebase Cloud Functions for automated account migration from `accountCreationRequests` to `users` collection.

## Functions

### 1. moveApprovedAccountsToUsers (Automatic Trigger)
- **Type:** Firestore onUpdate trigger
- **Collection:** `accountCreationRequests`
- **Trigger:** When a document's `status` field changes to `"approved"`
- **Action:**
  - Copies the document to `users` collection with same ID
  - Adds `movedAt` (server timestamp) and `active: true` fields
  - Preserves all original fields and nested data
  - Deletes the document from `accountCreationRequests`
  - Logs all operations

### 2. manualMigrateAccount (Manual Trigger)
- **Type:** HTTPS callable function
- **Purpose:** Manual migration of a specific account
- **Requires:** Authentication
- **Usage:** Can be called from Firebase Admin SDK or REST API

## Setup Instructions

### Prerequisites
- Node.js 18+
- Firebase CLI installed (`npm install -g firebase-tools`)
- Firebase project created and configured
- Service account key (for admin scripts)

### Installation

1. **Navigate to functions directory:**
   ```bash
   cd functions
   npm install
   ```

2. **Build TypeScript:**
   ```bash
   npm run build
   ```

### Deployment

Deploy all Cloud Functions:
```bash
npm run deploy
```

Or deploy from project root:
```bash
firebase deploy --only functions
```

### Manual Account Migration

To manually migrate a specific account from `accountCreationRequests` to `users`:

1. **Place service account key:**
   - Obtain your Firebase service account key from Firebase Console
   - Save it as `serviceAccountKey.json` in project root

2. **Run migration script:**
   ```bash
   node migrate-account.js BbNPtDj37KSag6XH2WJ2
   ```

   The script will:
   - Fetch the document from `accountCreationRequests`
   - Copy all fields to `users` collection with same ID
   - Add `movedAt` timestamp and `active: true`
   - Delete the original document
   - Display success/error messages

## Implementation Details

### Document Structure
When an account is moved, the following happens:

**Before (accountCreationRequests):**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "status": "approved",
  "createdAt": "2024-01-01T12:00:00Z",
  ...other fields
}
```

**After (users):**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "status": "approved",
  "createdAt": "2024-01-01T12:00:00Z",
  "movedAt": <server-timestamp>,
  "active": true,
  ...other fields preserved
}
```

### Data Preservation
- ✅ Document ID preserved
- ✅ All fields copied exactly
- ✅ Timestamps preserved
- ✅ Maps and nested objects preserved
- ✅ Arrays preserved
- ✅ Null values preserved

### Error Handling
- Try/catch wrapper for safe execution
- Comprehensive logging with document ID
- Detailed error messages
- HTTP error responses for HTTPS functions
- Transaction-safe (data is only deleted after successful copy)

### Logging
All operations are logged with the document ID prefix:
```
[BbNPtDj37KSag6XH2WJ2] Status change: pending -> approved
[BbNPtDj37KSag6XH2WJ2] Detected approval. Starting migration...
[BbNPtDj37KSag6XH2WJ2] Creating user document...
[BbNPtDj37KSag6XH2WJ2] User document created successfully
[BbNPtDj37KSag6XH2WJ2] Account creation request deleted successfully
[BbNPtDj37KSag6XH2WJ2] Migration completed: accountCreationRequests -> users
```

## Firestore Rules

Ensure your Firestore security rules include proper access to both collections:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /accountCreationRequests/{document=**} {
      allow read, write: if request.auth != null;
    }

    match /users/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Monitoring

View function logs:
```bash
firebase functions:log
```

View real-time logs:
```bash
firebase functions:log --follow
```

## Troubleshooting

### Function not triggering
- Verify the `status` field exists and is being updated
- Check that the update actually changes the status value
- Review Cloud Function logs for errors

### Permission denied errors
- Ensure the Cloud Functions service account has Firestore read/write permissions
- Check IAM roles: "Cloud Datastore User" and "Cloud Functions Developer"

### Document not found
- Verify the document exists in `accountCreationRequests`
- Check document ID spelling and format

## Environment Variables

No environment variables are required for these functions. They use the Firebase Admin SDK initialized within the function context.

## Pricing

Cloud Functions pricing:
- Invocations: $0.40 per 1 million
- Compute: $0.0000002500 per GB-second
- Networking: Standard egress pricing

Firestore pricing:
- Read operations: $0.06 per 100k
- Write operations: $0.18 per 100k
- Delete operations: $0.02 per 100k
