import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// Replace with your project's config object from Firebase console
const firebaseConfig = {
  apiKey: "AIzaSyCUYw6T-xIj9zYvoWpZqEuIZDrTCi3fDbY",
  authDomain: "snake-872b5.firebaseapp.com",
  projectId: "snake-872b5",
  storageBucket: "snake-872b5.firebasestorage.app",
  messagingSenderId: "565634688507",
  appId: "1:565634688507:web:c762fb58a19c9f18a4d75e"
};


let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const db = getFirestore(app);
