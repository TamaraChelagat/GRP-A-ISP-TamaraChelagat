"""
Firebase Authentication Module for FraudDetectPro
Handles user authentication with Firebase (Gmail, GitHub, Phone)
"""

import streamlit as st
import firebase_admin
from firebase_admin import credentials, auth
import requests
import json
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
load_dotenv()

class FirebaseAuth:
    def __init__(self):
        """Initialize Firebase Admin SDK"""
        if not firebase_admin._apps:
            # Load Firebase credentials
            cred = credentials.Certificate('firebase.json')
            firebase_admin.initialize_app(cred)
        
        # Firebase Web API Key (get from Firebase Console -> Project Settings)
        self.api_key = os.getenv('FIREBASE_API_KEY', 'YOUR_WEB_API_KEY')
        self.rest_api_url = f"https://identitytoolkit.googleapis.com/v1/accounts"
    
    def sign_in_with_email_password(self, email: str, password: str):
        """Sign in with email and password"""
        try:
            url = f"{self.rest_api_url}:signInWithPassword?key={self.api_key}"
            payload = {
                "email": email,
                "password": password,
                "returnSecureToken": True
            }
            response = requests.post(url, json=payload)
            
            if response.status_code == 200:
                user_data = response.json()
                return {
                    'success': True,
                    'idToken': user_data['idToken'],
                    'email': user_data['email'],
                    'userId': user_data['localId'],
                    'refreshToken': user_data['refreshToken']
                }
            else:
                error = response.json().get('error', {}).get('message', 'Unknown error')
                return {'success': False, 'error': error}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def create_user_with_email_password(self, email: str, password: str):
        """Create new user with email and password"""
        try:
            url = f"{self.rest_api_url}:signUp?key={self.api_key}"
            payload = {
                "email": email,
                "password": password,
                "returnSecureToken": True
            }
            response = requests.post(url, json=payload)
            
            if response.status_code == 200:
                user_data = response.json()
                return {
                    'success': True,
                    'idToken': user_data['idToken'],
                    'email': user_data['email'],
                    'userId': user_data['localId']
                }
            else:
                error = response.json().get('error', {}).get('message', 'Unknown error')
                return {'success': False, 'error': error}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def verify_token(self, id_token: str):
        """Verify Firebase ID token"""
        try:
            decoded_token = auth.verify_id_token(id_token)
            return {'success': True, 'uid': decoded_token['uid'], 'email': decoded_token.get('email')}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def refresh_token(self, refresh_token: str):
        """Refresh expired ID token"""
        try:
            url = f"https://securetoken.googleapis.com/v1/token?key={self.api_key}"
            payload = {
                "grant_type": "refresh_token",
                "refresh_token": refresh_token
            }
            response = requests.post(url, json=payload)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'success': True,
                    'idToken': data['id_token'],
                    'refreshToken': data['refresh_token']
                }
            else:
                return {'success': False, 'error': 'Failed to refresh token'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def sign_out(self):
        """Sign out user"""
        if 'user' in st.session_state:
            del st.session_state.user
        if 'id_token' in st.session_state:
            del st.session_state.id_token
        st.success("Signed out successfully")
        st.rerun()


def init_session_state():
    """Initialize session state variables"""
    if 'user' not in st.session_state:
        st.session_state.user = None
    if 'id_token' not in st.session_state:
        st.session_state.id_token = None
    if 'refresh_token' not in st.session_state:
        st.session_state.refresh_token = None


def login_page():
    """Render login page"""
    st.title("🔐 FraudDetectPro Login")
    
    auth_handler = FirebaseAuth()
    
    tab1, tab2 = st.tabs(["Sign In", "Sign Up"])
    
    with tab1:
        st.subheader("Sign in to your account")
        
        email = st.text_input("Email", key="signin_email")
        password = st.text_input("Password", type="password", key="signin_password")
        
        col1, col2 = st.columns(2)
        
        with col1:
            if st.button("Sign In with Email", use_container_width=True):
                if email and password:
                    with st.spinner("Signing in..."):
                        result = auth_handler.sign_in_with_email_password(email, password)
                        
                        if result['success']:
                            st.session_state.user = {
                                'email': result['email'],
                                'userId': result['userId']
                            }
                            st.session_state.id_token = result['idToken']
                            st.session_state.refresh_token = result['refreshToken']
                            st.success("Signed in successfully!")
                            st.rerun()
                        else:
                            st.error(f"Sign in failed: {result['error']}")
                else:
                    st.warning("Please enter email and password")
        
        with col2:
            st.info("Use your registered email and password")
        
        st.markdown("---")
        st.subheader("Or sign in with:")
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            if st.button("🔵 Google", use_container_width=True):
                st.info("Google Sign-In requires frontend implementation with Firebase SDK")
                st.code("""
// Add to your HTML
<script src="https://www.gstatic.com/firebasejs/9.x/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.x/firebase-auth.js"></script>
                """)
        
        with col2:
            if st.button("⚫ GitHub", use_container_width=True):
                st.info("GitHub Sign-In requires frontend implementation with Firebase SDK")
        
        with col3:
            if st.button("📱 Phone", use_container_width=True):
                st.info("Phone Sign-In requires frontend implementation with Firebase SDK")
    
    with tab2:
        st.subheader("Create a new account")
        
        new_email = st.text_input("Email", key="signup_email")
        new_password = st.text_input("Password", type="password", key="signup_password")
        confirm_password = st.text_input("Confirm Password", type="password", key="confirm_password")
        
        if st.button("Create Account", use_container_width=True):
            if new_email and new_password and confirm_password:
                if new_password != confirm_password:
                    st.error("Passwords do not match")
                elif len(new_password) < 6:
                    st.error("Password must be at least 6 characters")
                else:
                    with st.spinner("Creating account..."):
                        result = auth_handler.create_user_with_email_password(new_email, new_password)
                        
                        if result['success']:
                            st.success("Account created! You can now sign in.")
                        else:
                            st.error(f"Account creation failed: {result['error']}")
            else:
                st.warning("Please fill in all fields")


def check_authentication():
    """Check if user is authenticated"""
    init_session_state()
    
    if st.session_state.user is None:
        login_page()
        return False
    return True


def get_auth_header():
    """Get authorization header for API requests"""
    if st.session_state.id_token:
        return {"Authorization": f"Bearer {st.session_state.id_token}"}
    return {}