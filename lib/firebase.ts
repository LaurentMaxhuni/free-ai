import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  // The Firebase redirect helper must share the app's origin. The server-side
  // proxy at /__/auth forwards these requests to the project's Firebase
  // Hosting domain, avoiding browser third-party-storage restrictions.
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

function getClientFirebaseConfig() {
  if (typeof window === "undefined") return firebaseConfig;
  return {
    ...firebaseConfig,
    // Firebase constructs the helper URL with HTTPS. Keep the project
    // domain for the plain-HTTP local dev server; production deployments use
    // the same-origin proxy and therefore need the app host here.
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
