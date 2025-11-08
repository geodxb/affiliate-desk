import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

export const moveApprovedAccountsToUsers = functions
  .region('us-central1')
  .firestore
  .document('accountCreationRequests/{docId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const docId = context.params.docId;

    try {
      const statusBefore = before?.status;
      const statusAfter = after?.status;

      console.log(`[${docId}] Status change: ${statusBefore} -> ${statusAfter}`);

      if (statusBefore !== statusAfter && statusAfter === 'approved') {
        console.log(`[${docId}] Detected approval. Starting migration...`);

        const newUserData = {
          ...after,
          movedAt: admin.firestore.FieldValue.serverTimestamp(),
          active: true,
        };

        console.log(`[${docId}] Creating user document with fields:`, Object.keys(newUserData));

        await db.collection('users').doc(docId).set(newUserData);

        console.log(`[${docId}] User document created successfully`);

        await db.collection('accountCreationRequests').doc(docId).delete();

        console.log(`[${docId}] Account creation request deleted successfully`);
        console.log(`[${docId}] Migration completed: accountCreationRequests -> users`);

        return {
          success: true,
          docId,
          message: 'Account successfully moved to users collection',
        };
      }

      console.log(`[${docId}] No action taken (status did not change to approved)`);
      return { success: false, reason: 'Status not approved' };
    } catch (error) {
      console.error(`[${docId}] Error during migration:`, error);
      console.error(`[${docId}] Error type:`, error instanceof Error ? error.name : typeof error);
      console.error(`[${docId}] Error message:`, error instanceof Error ? error.message : String(error));

      throw new functions.https.HttpsError(
        'internal',
        `Failed to move account ${docId} to users collection`,
        { originalError: error instanceof Error ? error.message : String(error) }
      );
    }
  });

export const manualMigrateAccount = functions
  .region('us-central1')
  .https
  .onCall(async (data: { docId: string }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'This function requires authentication'
      );
    }

    const { docId } = data;

    if (!docId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'docId is required'
      );
    }

    try {
      console.log(`[Manual Migration] Starting for docId: ${docId}`);

      const docRef = db.collection('accountCreationRequests').doc(docId);
      const docSnapshot = await docRef.get();

      if (!docSnapshot.exists) {
        throw new Error(`Document ${docId} not found in accountCreationRequests`);
      }

      const accountData = docSnapshot.data();
      console.log(`[Manual Migration] Retrieved account data:`, Object.keys(accountData || {}));

      const newUserData = {
        ...accountData,
        movedAt: admin.firestore.FieldValue.serverTimestamp(),
        active: true,
      };

      await db.collection('users').doc(docId).set(newUserData);
      console.log(`[Manual Migration] User document created successfully`);

      await docRef.delete();
      console.log(`[Manual Migration] Account creation request deleted successfully`);

      return {
        success: true,
        docId,
        message: `Account ${docId} successfully moved to users collection`,
      };
    } catch (error) {
      console.error(`[Manual Migration] Error:`, error);
      console.error(`[Manual Migration] Error message:`, error instanceof Error ? error.message : String(error));

      throw new functions.https.HttpsError(
        'internal',
        `Failed to manually migrate account ${docId}`,
        { originalError: error instanceof Error ? error.message : String(error) }
      );
    }
  });
