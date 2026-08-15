import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  // Keep Firebase's generated auth domain here. Google registers this
  // redirect URI automatically; replacing it with a Vercel host requires a
  // separate Google OAuth redirect-URI registration and causes "Access
  // blocked" / redirect_uri_mismatch errors otherwise.
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let cachedFirestore: Firestore | null = null;

export function getFirestoreDB(): Firestore | null {
  if (typeof window === "undefined") return null;
  if (!firebaseConfig.apiKey) return null;
  if (!cachedApp) {
    cachedApp = getApps()[0] ?? initializeApp(firebaseConfig);
  }
  if (!cachedFirestore) {
    cachedFirestore = getFirestore(cachedApp);
  }
  return cachedFirestore;
}

function getFirebaseAuth(): Auth | null {
  if (typeof window === "undefined") return null;
  if (!firebaseConfig.apiKey) {
    console.warn(
      "Firebase API key is not configured. Set NEXT_PUBLIC_FIREBASE_* in your .env.local.",
    );
    return null;
  }
  if (!cachedApp) {
    cachedApp = getApps()[0] ?? initializeApp(firebaseConfig);
  }
  if (!cachedAuth) {
    cachedAuth = getAuth(cachedApp);
  }
  return cachedAuth;
};

export const auth: Auth | null = getFirebaseAuth();
