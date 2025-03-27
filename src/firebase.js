// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
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
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);