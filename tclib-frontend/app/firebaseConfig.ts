// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";


// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC4XUwQS4llwJXm83DQwDMWeZ_4S0uMprM",
  authDomain: "t-c-lib.firebaseapp.com",
  databaseURL: "https://t-c-lib-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "t-c-lib",
  storageBucket: "t-c-lib.firebasestorage.app",
  messagingSenderId: "1427380509",
  appId: "1:1427380509:web:20a332cec87901e78fe9f4",
  measurementId: "G-K44Z5CTG42"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
