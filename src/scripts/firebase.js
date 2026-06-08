// Import the functions you need from the SDKs you need
import firebase from 'firebase/compat/app';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAiK_MPMsx0EXVMXC1p7gJh_evbvTRcc0E",
  authDomain: "john-shin-impact.firebaseapp.com",
  projectId: "john-shin-impact",
  storageBucket: "john-shin-impact.firebasestorage.app",
  messagingSenderId: "206423969583",
  appId: "1:206423969583:web:7b41887fa5700b1185dbda",
  measurementId: "G-R14B07WGGW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = firebase.firestore();

export default db;