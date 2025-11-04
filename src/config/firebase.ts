import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyD2og-Zlqhkc15vqphHaVLW8E3k_wpfwJU",
  authDomain: "fluxx-fe69f.firebaseapp.com",
  projectId: "fluxx-fe69f",
  storageBucket: "fluxx-fe69f.firebasestorage.app",
  messagingSenderId: "150360579647",
  appId: "1:150360579647:android:a8ba67f24fbab786dc628a"
};

const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);          // ← Changed from 'firestore' to 'db'
export const firestore = getFirestore(app);   // ← Keep this for backward compatibility
export const storage = getStorage(app);

export default app;