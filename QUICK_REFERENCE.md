# Cloud Function - Quick Reference

## What It Does

Automatically moves accounts from `accountCreationRequests` to `users` collection when status changes to "approved".

## Deploy

```bash
cd functions
npm install
npm run deploy
```

## How It Triggers

When you update an `accountCreationRequests` document and set:
```json
{
  "status": "approved"
}
```

The function automatically:
1. ✓ Copies to `users` collection (same ID)
2. ✓ Adds `movedAt` timestamp and `active: true`
3. ✓ Deletes from `accountCreationRequests`
4. ✓ Logs everything

## Manual Migrate Specific Account

```bash
# 1. Get Firebase service account key
#    Firebase Console → Settings → Service Accounts → Generate New Private Key
#    Save as: serviceAccountKey.json (in project root, NOT in git)

# 2. Run migration
node migrate-account.js BbNPtDj37KSag6XH2WJ2
```

## View Logs

```bash
# Real-time logs
firebase functions:log --follow

# Find specific account
firebase functions:log | grep "BbNPtDj37KSag6XH2WJ2"
```

## Files Created

| File | Purpose |
|------|---------|
| `functions/index.ts` | Cloud Functions source code |
| `functions/package.json` | Dependencies |
| `functions/tsconfig.json` | TypeScript config |
| `firebase.json` | Firebase project config |
| `.firebaserc` | Project ID reference |
| `migrate-account.js` | Manual migration script |
| `CLOUD_FUNCTIONS.md` | Full technical documentation |
| `DEPLOYMENT_GUIDE.md` | Step-by-step deployment |
| `MIGRATION_SUMMARY.md` | Complete implementation summary |

## Troubleshooting

### Function won't deploy
```bash
firebase login
firebase use your-project-id
firebase deploy --only functions --debug
```

### Function won't trigger
- Make sure you're updating the `status` field (not just reading)
- The status must actually change to "approved"
- Check logs: `firebase functions:log --follow`

### Manual script fails
- Verify `serviceAccountKey.json` exists in project root
- Check document ID is correct
- Verify document exists in `accountCreationRequests` collection

## Data Preservation

All fields are preserved exactly:
- ✓ Document ID
- ✓ All fields
- ✓ Timestamps
- ✓ Nested objects
- ✓ Arrays
- ✓ Data types

Plus these are added by the function:
- `movedAt`: Server timestamp
- `active`: true

## Example: Before & After

**Before (accountCreationRequests):**
```json
{
  "id": "BbNPtDj37KSag6XH2WJ2",
  "email": "investor@example.com",
  "name": "John Investor",
  "phone": "+1234567890",
  "status": "approved",
  "investmentAmount": 50000,
  "createdAt": "2024-11-08T12:00:00Z"
}
```

**After (users):**
```json
{
  "id": "BbNPtDj37KSag6XH2WJ2",
  "email": "investor@example.com",
  "name": "John Investor",
  "phone": "+1234567890",
  "status": "approved",
  "investmentAmount": 50000,
  "createdAt": "2024-11-08T12:00:00Z",
  "movedAt": "2024-11-08T14:30:45.123Z",
  "active": true
}
```

Document automatically deleted from `accountCreationRequests`.

## For More Information

- **Deployment steps:** `DEPLOYMENT_GUIDE.md`
- **Technical details:** `CLOUD_FUNCTIONS.md`
- **Full implementation:** `MIGRATION_SUMMARY.md`
