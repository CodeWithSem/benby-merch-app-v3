import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  // apiKey: "AIzaSyA31lbrqg5Ikmp6IfJbMM1y_19c8sWQSmo",
  // authDomain: "mobile-app-demo-b4b29.firebaseapp.com",
  // databaseURL: "https://mobile-app-demo-b4b29-default-rtdb.asia-southeast1.firebasedatabase.app",
  // projectId: "mobile-app-demo-b4b29",
  // storageBucket: "mobile-app-demo-b4b29.appspot.com",
  // messagingSenderId: "624955633290",
  // appId: "1:624955633290:web:aff9c27f6d51286f924773",
  // measurementId: "G-RBC5TXR6WY"

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
