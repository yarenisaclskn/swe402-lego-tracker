import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCNHXKI7-AkMT_NuDu5h3gMAGdowWwaOJ0",
  authDomain: "legotracker-fa8f3.firebaseapp.com",
  projectId: "legotracker-fa8f3",
  storageBucket: "legotracker-fa8f3.firebasestorage.app",
  messagingSenderId: "250986167357",
  appId: "1:250986167357:web:b65590f1eca76b3405be54",
  measurementId: "G-B014NSZ97C"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
