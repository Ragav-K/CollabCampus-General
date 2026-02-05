// Import Firebase functions
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase configuration for CollabCampus
const firebaseConfig = {
  apiKey: "AIzaSyBY7Efl9AvNiqGOLuhQ7LUcFuvnTYaEruE",
  authDomain: "collabcampus-zen.firebaseapp.com",
  projectId: "collabcampus-zen",
  storageBucket: "collabcampus-zen.firebasestorage.app",
  messagingSenderId: "961855114197",
  appId: "1:961855114197:web:5c6078a1e84b7451874b5c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
