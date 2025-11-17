// Firebase SDK setup for Loveable Frontend
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider, PhoneAuthProvider, TotpMultiFactorGenerator } from "firebase/auth";

// Replace with your public Firebase client config from Firebase Console (NOT service account)
const firebaseConfig = {
  apiKey: "AIzaSyAN-EmbPM6sE1ApnAsAm3hYggjziY_M2HI",
  authDomain: "frauddetectpro.firebaseapp.com",
  projectId: "frauddetectpro",
  storageBucket: "frauddetectpro.firebasestorage.app",
  messagingSenderId: "585994092943",
  appId: "1:585994092943:web:93ad282b1455475d7a8bfa",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Providers for different auth methods
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();
const phoneProvider = new PhoneAuthProvider(auth);

export { app, auth, googleProvider, githubProvider, phoneProvider, TotpMultiFactorGenerator };
