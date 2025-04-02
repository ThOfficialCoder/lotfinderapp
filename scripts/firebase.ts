// firebase.ts
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase config
const firebaseConfig = {
  apiKey: 'AIzaSyAlg66aJny7lA8YdKZolNPzlrhO6XH3QtM',
  authDomain: 'lotfinder-5ca34.firebaseapp.com',
  projectId: 'lotfinder-5ca34',
  storageBucket: 'lotfinder-5ca34.appspot.com',
  messagingSenderId: '799550401428',
  appId: '1:799550401428:web:d9b11fa1ce06a1bfc7bd81',
  measurementId: 'G-RDD0LTDMSX',
};

// Initialize
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, analytics, db, auth };
