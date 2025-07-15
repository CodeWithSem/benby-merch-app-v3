import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBgL7NSc2osefREaSVQwcUQHvmhokE49Ts",
  authDomain: "benby-merch-app.firebaseapp.com",
  databaseURL:
    "https://benby-merch-app-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "benby-merch-app",
  storageBucket: "benby-merch-app.appspot.com",
  messagingSenderId: "99890373813",
  appId: "1:99890373813:web:1d6d7451a7658e2d3f4afc",
  measurementId: "G-RBC5TXR6WY",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const db_firestore = getFirestore(app);
