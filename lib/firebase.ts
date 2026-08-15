import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const configuredAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const firebaseAuthDomain =
  configuredAuthDomain?.endsWith(".firebaseapp.com")
    ? configuredAuthDomain
    : firebaseProjectId
      ? `${firebaseProjectId}.firebaseapp.com`
      : configuredAuthDomain;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  // The client switches this to the current HTTPS origin below so Firebase's
  // redirect helper and its storage live on the same site as the app.
  authDomain: firebaseAuthDomain,
  projectId: firebaseProjectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

function getClientFirebaseConfig() {
  if (typeof window === "undefined") return firebaseConfig;

  return {
    ...firebaseConfig,
    // The /__/auth route is proxied by Next.js to the Firebase Hosting helper.
    // Keep plain HTTP localhost on the standard Firebase domain because the
    // helper itself requires HTTPS.
    authDomain:
      window.location.protocol === "https:"
        ? window.location.host
        : firebaseConfig.authDomain,
  };
}

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let cachedFirestore: Firestore | null = null;

export function getFirestoreDB(): Firestore | null {
  if (typeof window === "undefined") return null;
  if (!firebaseConfig.apiKey) return null;
  if (!cachedApp) {
    cachedApp = getApps()[0] ?? initializeApp(getClientFirebaseConfig());
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
    cachedApp = getApps()[0] ?? initializeApp(getClientFirebaseConfig());
  }
  if (!cachedAuth) {
    cachedAuth = getAuth(cachedApp);
  }
  return cachedAuth;
};

export const auth: Auth | null = getFirebaseAuth();
