/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfigReal from '../../firebase-applet-config.json';

const getSafeConfig = () => {
  const c = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigReal.apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigReal.authDomain,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigReal.projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigReal.storageBucket,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigReal.messagingSenderId,
    appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigReal.appId,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfigReal.measurementId || undefined
  };
  
  const missing = [];
  if (!c.apiKey) missing.push("VITE_FIREBASE_API_KEY");
  if (!c.projectId) missing.push("VITE_FIREBASE_PROJECT_ID");
  if (!c.appId) missing.push("VITE_FIREBASE_APP_ID");
  
  return { config: c, missing };
};

const { config, missing } = getSafeConfig();
export const firebaseConfigError = missing.length > 0 ? missing : null;

// Only initialize if we have the bare minimums to avoid crashing the whole app
const app = firebaseConfigError ? null : initializeApp(config);

// Using the project ID and database ID from the config
const dbId = import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigReal.firestoreDatabaseId || undefined;

export const db = app ? getFirestore(app, dbId) : null;
export const auth = app ? getAuth(app) : null;
export const googleProvider = new GoogleAuthProvider();

// Connection check as required
async function testConnection() {
  if (!db || !auth) return;
  try {
    // Only test if we have a user, otherwise it will fail due to rules
    if (auth.currentUser) {
      await getDocFromServer(doc(db, 'test', 'connection'));
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

testConnection();

// Initializing sign in helper
export const signIn = () => {
  if (!auth) throw new Error("Firebase Auth not initialized");
  return signInWithPopup(auth, googleProvider);
};
export const logOut = () => {
  if (!auth) throw new Error("Firebase Auth not initialized");
  return signOut(auth);
};
