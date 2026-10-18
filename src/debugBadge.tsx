// src/debugBadge.ts
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

async function debugBadgeWrite() {
  const auth = getAuth();
  const db = getFirestore();

  const user = auth.currentUser;
  console.log('current user (debugBadgeWrite):', user?.uid);

  if (!user) {
    console.error('No user signed in — sign in first then run debugBadgeWrite();');
    return;
  }

  const badgeRef = doc(db, 'userDexProfiles', user.uid, 'badges', 'debug-badge');

  try {
    await setDoc(badgeRef, {
      badgeId: 'debug-badge',
      ownerId: user.uid,
      progress: 10,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    console.log('TEST WRITE SUCCEEDED at', badgeRef.path);
  } catch (err) {
    console.error('TEST WRITE FAILED at', badgeRef.path, err);
  }
}

// Expose to window so you can call it from the browser console:
(window as any).debugBadgeWrite = debugBadgeWrite;
console.log('debugBadgeWrite() attached to window — call window.debugBadgeWrite() after signing in.');