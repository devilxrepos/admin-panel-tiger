// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyD4LsjVeocuVcZ3qZUi6j7tzz-1DKNtmtM",
  authDomain: "mujahid-tiger.firebaseapp.com",
  databaseURL: "https://mujahid-tiger-default-rtdb.firebaseio.com",
  projectId: "mujahid-tiger",
  storageBucket: "mujahid-tiger.firebasestorage.app",
  messagingSenderId: "609986313885",
  appId: "1:609986313885:web:d7a22ddaec17a040211e74"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

console.log('Firebase initialized');
