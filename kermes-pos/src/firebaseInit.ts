import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyDAAm-0IYvRfBivW1qYSWo5m_Gcdg_CWVw",
  authDomain: "kermesprogram.firebaseapp.com",
  projectId: "kermesprogram",
  storageBucket: "kermesprogram.firebasestorage.app",
  messagingSenderId: "828348520479",
  appId: "1:828348520479:web:1fc8e6f74f8eaab395dd2a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
