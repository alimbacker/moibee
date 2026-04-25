// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCF59-oQXXYfkvxrnMWCqVo6Ew3yQ65jbY",
  authDomain: "moibee.firebaseapp.com",
  projectId: "moibee",
  storageBucket: "moibee.firebasestorage.app",
  messagingSenderId: "438297243875",
  appId: "1:438297243875:web:f1ccf05df4afd6f27f95d6",
  measurementId: "G-V393KGLGW4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
