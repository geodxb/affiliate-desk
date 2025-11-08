#!/usr/bin/env node

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function migrateAccount(docId) {
  try {
    console.log(`\n=== Starting Account Migration ===`);
    console.log(`Document ID: ${docId}\n`);

    const docRef = db.collection('accountCreationRequests').doc(docId);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      console.error(`Error: Document ${docId} not found in accountCreationRequests`);
      process.exit(1);
    }

    const accountData = docSnapshot.data();
    console.log(`Retrieved account data:`);
    console.log(`  Fields: ${Object.keys(accountData).join(', ')}`);
    console.log(`  Current Status: ${accountData.status}`);

    const newUserData = {
      ...accountData,
      movedAt: admin.firestore.FieldValue.serverTimestamp(),
      active: true,
    };

    console.log(`\nCreating user document...`);
    await db.collection('users').doc(docId).set(newUserData);
    console.log(`✓ User document created with ID: ${docId}`);

    console.log(`\nDeleting from accountCreationRequests...`);
    await docRef.delete();
    console.log(`✓ Document deleted from accountCreationRequests`);

    console.log(`\n=== Migration Completed Successfully ===`);
    console.log(`Account ${docId} moved from accountCreationRequests to users collection`);
    console.log(`Fields preserved: ${Object.keys(accountData).join(', ')}`);
    console.log(`New fields added: movedAt (serverTimestamp), active (true)\n`);

    process.exit(0);
  } catch (error) {
    console.error(`\n=== Migration Failed ===`);
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}\n`);
    process.exit(1);
  }
}

const docId = process.argv[2];
if (!docId) {
  console.error('Usage: node migrate-account.js <documentId>');
  console.error('Example: node migrate-account.js BbNPtDj37KSag6XH2WJ2');
  process.exit(1);
}

migrateAccount(docId);
