import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD2og-Zlqhkc15vqphHaVLW8E3k_wpfwJU",
  authDomain: "fluxx-fe69f.firebaseapp.com",
  projectId: "fluxx-fe69f",
  storageBucket: "fluxx-fe69f.appspot.com",
  messagingSenderId: "150360579647",
  appId: "1:150360579647:android:a8ba67f24fbab786dc628a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export { signInAnonymously };
