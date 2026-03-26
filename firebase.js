// Firebase v10 (modular)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

// AUTH
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// FIRESTORE
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,   // 🔥 добавили
  deleteDoc     // 🔥 добавили
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyBaMMUFTobk6_18Ah3Zxt6zgNJuUdONZME",
  authDomain: "diplom-318d6.firebaseapp.com",
  projectId: "diplom-318d6",
  storageBucket: "diplom-318d6.firebasestorage.app",
  messagingSenderId: "130852231774",
  appId: "1:130852231774:web:d98943c8f7d2057ff0f2cf",
  measurementId: "G-EFWBE5KTGX"
};

// INIT
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// EXPORT
export {
  auth,
  db,

  // auth
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,

  // firestore
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,  // 🔥 экспорт
  deleteDoc    // 🔥 экспорт
};