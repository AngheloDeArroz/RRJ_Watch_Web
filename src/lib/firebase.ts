import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { initializeFirestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app;
let db;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  db = initializeFirestore(app, { cacheSizeBytes: CACHE_SIZE_UNLIMITED });
} else {
  app = getApp();
  db = initializeFirestore(app, { cacheSizeBytes: CACHE_SIZE_UNLIMITED });
}

if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db)
    .then(() => {
      console.log("Firestore offline persistence enabled successfully.");
    })
    .catch((err) => {
      if (err.code === "failed-precondition") {
        console.warn("Firestore offline persistence failed: Multiple tabs open or other precondition not met.");
      } else if (err.code === "unimplemented") {
        console.warn("Firestore offline persistence failed: Browser does not support required features.");
      } else {
        console.error("Firestore offline persistence failed with error: ", err);
      }
    });
}

const auth = getAuth(app);

export { app, db, auth };
