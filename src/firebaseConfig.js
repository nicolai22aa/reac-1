import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCvwd_7vRJPMg-pE-v3r28SKnyZVmXZNIU",
  authDomain: "react-1-f720e.firebaseapp.com",
  projectId: "react-1-f720e",
  storageBucket: "react-1-f720e.appspot.com",
  messagingSenderId: "171551267640",
  appId: "1:171551267640:web:e66d468b7322dbf2d53fcd",
  measurementId: "G-7NRM5LSYCR"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // 🔥 Firestore

export { db };
