// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAlg66aJny7lA8YdKZolNPzlrhO6XH3QtM",
  authDomain: "lotfinder-5ca34.firebaseapp.com",
  projectId: "lotfinder-5ca34",
  storageBucket: "lotfinder-5ca34.firebasestorage.app",
  messagingSenderId: "799550401428",
  appId: "1:799550401428:web:d9b11fa1ce06a1bfc7bd81",
  measurementId: "G-RDD0LTDMSX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);