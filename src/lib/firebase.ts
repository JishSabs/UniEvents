import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCVi6zMcR_GsVGauZHO7pLcT-ghlcY8NF4",
  authDomain: "unievents-ea563.firebaseapp.com",
  projectId: "unievents-ea563",
  storageBucket: "unievents-ea563.firebasestorage.app",
  messagingSenderId: "795627505777",
  appId: "1:795627505777:web:8dbe8ad2c03dd71210b3d0",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;