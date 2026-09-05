import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isBrowser = typeof window !== "undefined";

export const firebaseApp: FirebaseApp = isBrowser
  ? (getApps()[0] ?? initializeApp(firebaseConfig))
  : (undefined as unknown as FirebaseApp);

export const firebaseAuth: Auth = isBrowser
  ? getAuth(firebaseApp)
  : (undefined as unknown as Auth);

export const firebaseDb: Firestore = isBrowser
  ? getFirestore(firebaseApp)
  : (undefined as unknown as Firestore);

export const firebaseStorage: FirebaseStorage = isBrowser
  ? getStorage(firebaseApp)
  : (undefined as unknown as FirebaseStorage);
