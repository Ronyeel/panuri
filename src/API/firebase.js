import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getFunctions } from "firebase/functions"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "e-panisuri.firebaseapp.com",
  projectId: "e-panisuri",
  storageBucket: "e-panisuri.firebasestorage.app",
  messagingSenderId: "600562255166",
  appId: "1:600562255166:web:1ef5638cc85bf58eaf986f",
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const functions = getFunctions(app)