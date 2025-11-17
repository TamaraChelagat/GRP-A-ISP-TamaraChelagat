from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from collections import deque
from datetime import datetime
import uuid
import numpy as np
import joblib
import tensorflow as tf
import os
import firebase_admin
from firebase_admin import credentials, auth
import logging

# =====================================================
# FraudDetectPro - FastAPI Backend with Firebase Auth
# =====================================================

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="FraudDetectPro API", version="2.2")

# CORS middleware for Streamlit
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your Streamlit URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("🔹 Starting FraudDetectPro API...")

# =====================================================
# Initialize Firebase Admin
# =====================================================
try:
    if not firebase_admin._apps:
        # Look for firebase.json in project root
        firebase_cred_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)), 
            "firebase.json"
        )
        if os.path.exists(firebase_cred_path):
            cred = credentials.Certificate(firebase_cred_path)
            firebase_admin.initialize_app(cred)
            logger.info("✅ Firebase Admin initialized")
        else:
            logger.warning("⚠️ firebase.json not found - authentication will fail")
except Exception as e:
    logger.error(f"❌ Firebase initialization failed: {e}")

# =====================================================
# Paths
# =====================================================
BASE_DIR = os.path.dirname(os.path.dirname(__file__))  # project root
MODELS_DIR = os.path.join(BASE_DIR, "models")
DATA_DIR = os.path.join(BASE_DIR, "data", "processed")

# =====================================================
# Load core models & metadata
# =====================================================
print("🔹 Loading models and metadata...")
nn_model = tf.keras.models.load_model(os.path.join(MODELS_DIR, "nn_feature_extractor.h5"))
rf_model = joblib.load(os.path.join(MODELS_DIR, "rf_model.pkl"))
xgb_model = joblib.load(os.path.join(MODELS_DIR, "xgb_model.pkl"))
lr_model = joblib.load(os.path.join(MODELS_DIR, "lr_model.pkl"))
metadata = joblib.load(os.path.join(MODELS_DIR, "model_metadata.pkl"))

optimal_threshold = metadata.get("optimal_threshold", 0.5)
expected_input_features = int(metadata.get("input_features", 30))
expected_hybrid_features = int(metadata.get("hybrid_features", expected_input_features))

print(f"🔹 Metadata: input_features={expected_input_features}, hybrid_features={expected_hybrid_features}, threshold={optimal_threshold}")

# =====================================================
# Load scaler (from data/processed)
# =====================================================
scaler_path = os.path.join(DATA_DIR, "scaler.pkl")
if os.path.exists(scaler_path):
    try:
        scaler = joblib.load(scaler_path)
        print(f"✅ Scaler loaded from: {scaler_path}")
    except Exception as e:
        scaler = None
        print(f"⚠️ Failed to load scaler ({scaler_path}): {e} — proceeding without scaler")
else:
    scaler = None
    print(f"⚠️ Scaler not found at {scaler_path} — proceeding without scaler")

# =====================================================
# Ensure NN model graph is initialized (safe)
# =====================================================
try:
    dummy = np.zeros((1, expected_input_features), dtype=float)
    _ = nn_model(dummy)
    print("✅ Neural network graph initialized via dummy call.")
except Exception:
    print("ℹ️ Neural network dummy call: model may already be initialized or call failed harmlessly.")

# =====================================================
# Locate the feature extraction layer (same as training)
# =====================================================
feature_extractor = None
try:
    feature_layer = nn_model.get_layer("feature_layer")
    feature_extractor = tf.keras.Model(inputs=nn_model.input, outputs=feature_layer.output)
    print("✅ Using named layer 'feature_layer' for extraction.")
except Exception:
    dense_layers = [layer for layer in nn_model.layers if isinstance(layer, tf.keras.layers.Dense)]
    if len(dense_layers) >= 2:
        feature_layer = dense_layers[-2]
        feature_extractor = tf.keras.Model(inputs=nn_model.input, outputs=feature_layer.output)
        print(f"⚠️ 'feature_layer' not found — using fallback layer '{feature_layer.name}' for extraction.")
    else:
        feature_extractor = nn_model
        print("⚠️ No suitable dense layer found — using full model as feature extractor.")

# Attempt a warm-up extraction
try:
    feat_sample = feature_extractor.predict(np.zeros((1, expected_input_features)), verbose=0)
    print(f"✅ Feature extractor output shape (sample): {feat_sample.shape}")
except Exception as e:
    print(f"⚠️ Feature extractor warm-up failed: {e}")

# =====================================================
# Authentication Dependency
# =====================================================
async def verify_firebase_token(authorization: Optional[str] = Header(None)):
    """Verify Firebase ID token from Authorization header"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    try:
        # Extract token from "Bearer <token>"
        token = authorization.split("Bearer ")[-1] if "Bearer " in authorization else authorization
        decoded_token = auth.verify_id_token(token)
        logger.info(f"✅ Authenticated user: {decoded_token.get('email')}")
        return decoded_token
    except Exception as e:
        logger.error(f"❌ Token verification failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# Optional: Make authentication optional for testing
async def optional_auth(authorization: Optional[str] = Header(None)):
    """Optional authentication - use during development"""
    if not authorization:
        return {"uid": "anonymous", "email": "test@example.com"}
    return await verify_firebase_token(authorization)

# =====================================================
# Request/Response schemas
# =====================================================
class Transaction(BaseModel):
    features: list  # [Time, V1..V28, Amount] total expected_input_features items

class PredictionResponse(BaseModel):
    prediction: str
    probability: float
    threshold_used: float
    hybrid_feature_count: int
    user_email: Optional[str] = None

class StatsResponse(BaseModel):
    total_predictions: int
    fraud_detected: int
    fraud_ratio: float
    model_accuracy: float

class TransactionResponse(BaseModel):
    transaction_id: str
    amount: float
    timestamp: str
    risk_score: float
    status: str
    prediction: str

# =====================================================
# In-memory stats (replace with database in production)
# =====================================================
stats = {
    "total_predictions": 0,
    "fraud_detected": 0
}

# =====================================================
# In-memory transaction storage (replace with database in production)
# =====================================================
# Store last 100 transactions
transactions_store = deque(maxlen=100)

# =====================================================
# Endpoints
# =====================================================

@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "FraudDetectPro API is running 🚀",
        "version": "2.2",
        "authentication": "Firebase Auth enabled"
    }

@app.get("/health")
def health_check():
    """Health check endpoint - no authentication required"""
    return {
        "status": "healthy",
        "models_loaded": True,
        "scaler_loaded": scaler is not None,
        "firebase_initialized": len(firebase_admin._apps) > 0
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict(
    transaction: Transaction,
    user: dict = Depends(optional_auth)  # Use optional_auth for local/testing; switch to verify_firebase_token for prod
):
    """
    Predict fraud for a transaction
    Requires Firebase authentication
    """
    logger.info(f"Prediction request from user: {user.get('email')}")
    
    # Convert and validate input
    try:
        X = np.array(transaction.features, dtype=float)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not convert features to numeric array: {e}")

    if X.ndim == 1:
        X = X.reshape(1, -1)

    # Validate feature count
    if X.shape[1] != expected_input_features:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid input shape: expected {expected_input_features} features, but got {X.shape[1]}"
        )

    # Apply scaler if available
    if scaler is not None:
        try:
            X_scaled = scaler.transform(X)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Scaling failed: {e}")
    else:
        X_scaled = X

    # Stage 1: Extract NN features
    try:
        nn_features = feature_extractor.predict(X_scaled, verbose=0)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Neural network feature extraction failed: {e}")

    if nn_features.ndim == 1:
        nn_features = nn_features.reshape(1, -1)

    # Stage 2: Combine and predict
    try:
        X_hybrid = np.hstack((X_scaled, nn_features))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to form hybrid input - shapes: {X_scaled.shape}, {nn_features.shape}"
        )

    if X_hybrid.shape[1] != expected_hybrid_features:
        raise HTTPException(
            status_code=500,
            detail=f"Hybrid feature length mismatch: got {X_hybrid.shape[1]}, expected {expected_hybrid_features}"
        )

    try:
        # Ensemble prediction (soft voting)
        probs = np.mean([
            rf_model.predict_proba(X_hybrid)[:, 1],
            xgb_model.predict_proba(X_hybrid)[:, 1],
            lr_model.predict_proba(X_hybrid)[:, 1]
        ], axis=0)

        prediction = int(probs >= optimal_threshold)
        label = "Fraudulent" if prediction == 1 else "Legitimate"
        probability = float(probs[0])

        # Update stats
        stats["total_predictions"] += 1
        if prediction == 1:
            stats["fraud_detected"] += 1

        # Extract amount from features (last feature)
        amount = float(X[0, -1]) if X.shape[0] > 0 else 0.0

        # Store transaction
        transaction_id = f"TXN_{uuid.uuid4().hex[:12].upper()}"
        transaction_data = {
            "transaction_id": transaction_id,
            "amount": amount,
            "timestamp": datetime.now().isoformat(),
            "risk_score": probability * 100,  # Convert to percentage
            "status": "Flagged" if probability >= optimal_threshold else ("Under Review" if probability >= 0.5 else "Clear"),
            "prediction": label
        }
        transactions_store.append(transaction_data)

        return PredictionResponse(
            prediction=label,
            probability=probability,
            threshold_used=float(optimal_threshold),
            hybrid_feature_count=int(X_hybrid.shape[1]),
            user_email=user.get('email')
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model ensemble prediction failed: {e}")

@app.get("/api/stats", response_model=StatsResponse)
async def get_stats(user: dict = Depends(optional_auth)):
    """Get prediction statistics"""
    logger.info(f"Stats requested by: {user.get('email')}")
    
    fraud_ratio = (stats["fraud_detected"] / stats["total_predictions"] * 100) if stats["total_predictions"] > 0 else 0
    
    return StatsResponse(
        total_predictions=stats["total_predictions"],
        fraud_detected=stats["fraud_detected"],
        fraud_ratio=fraud_ratio,
        model_accuracy=95.3  # Replace with actual model accuracy from metadata
    )

@app.get("/api/user/profile")
async def get_user_profile(user: dict = Depends(verify_firebase_token)):
    """Get current user profile"""
    return {
        "uid": user.get("uid"),
        "email": user.get("email"),
        "email_verified": user.get("email_verified", False)
    }

@app.get("/api/transactions", response_model=list[TransactionResponse])
async def get_transactions(user: dict = Depends(optional_auth)):
    """Get recent transactions"""
    logger.info(f"Transactions requested by: {user.get('email')}")
    
    # Convert deque to list and reverse to show most recent first
    transactions_list = list(transactions_store)
    transactions_list.reverse()
    
    return transactions_list

@app.get("/debug-model-info")
def debug_model_info():
    """Debug endpoint - no authentication required"""
    return {
        "nn_model_layers": [layer.name for layer in nn_model.layers],
        "feature_extractor_output_shape": getattr(feature_extractor, "output_shape", "unknown"),
        "expected_input_features": expected_input_features,
        "expected_hybrid_features": expected_hybrid_features,
        "optimal_threshold": float(optimal_threshold),
        "scaler_loaded": bool(scaler is not None),
        "firebase_initialized": len(firebase_admin._apps) > 0
    }

# =====================================================
# Exception handlers
# =====================================================
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    logger.error(f"HTTP Exception: {exc.detail}")
    return JSONResponse(status_code=exc.status_code, content={
        "error": exc.detail,
        "status_code": exc.status_code
    })