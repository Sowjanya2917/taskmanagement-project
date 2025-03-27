// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCVdHc70oN20j2DvuKb-w4feUUwRn05TU8",
  authDomain: "taskmanagementapp-b98ad.firebaseapp.com",
  projectId: "taskmanagementapp-b98ad",
  storageBucket: "taskmanagementapp-b98ad.firebasestorage.app",
  messagingSenderId: "503500199638",
  appId: "1:503500199638:web:2768492c84d362675b1b77",
  measurementId: "G-G6RTLP96JT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);