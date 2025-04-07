// Import Firebase SDK
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import Constants from "expo-constants";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBFQdbdxv66KC6Ja3y7nhi_r4gXKi5ut2Q",
  authDomain: "vermimometer.firebaseapp.com",
  projectId: "vermimometer",
  storageBucket: "vermimometer.firebasestorage.app",
  messagingSenderId: "785100256027",
  appId: "1:785100256027:web:25970bdf8aa5ee67f859be",
  measurementId: "G-2NM4V5CDNN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase Services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;
