import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider, PhoneAuthProvider, TotpMultiFactorGenerator } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Get these values from Firebase Console
// Firebase Console → Project Settings → General → Your apps → Web app
const firebaseConfig = {
  apiKey: "AIzaSyAN-EmbPM6sE1ApnAsAm3hYggjziY_M2HI",
  authDomain: "frauddetectpro.firebaseapp.com",
  projectId: "frauddetectpro",
  storageBucket: "frauddetectpro.firebasestorage.app",
  messagingSenderId: "585994092943",
  appId: "1:585994092943:web:93ad282b1455475d7a8bfa",
  measurementId: "G-9B9L30JXZN"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize auth providers
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

// Configure Google provider with additional scopes
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
// Add scopes for user profile and email
googleProvider.addScope('profile');
googleProvider.addScope('email');

// Configure GitHub provider with scopes
githubProvider.setCustomParameters({
  prompt: 'select_account'
});
// Add scopes for user profile and email
githubProvider.addScope('user:email');
githubProvider.addScope('read:user');

// Initialize phone auth provider
export const phoneProvider = new PhoneAuthProvider(auth);

// Export TOTP generator for multi-factor authentication
export { TotpMultiFactorGenerator };

export default app;

