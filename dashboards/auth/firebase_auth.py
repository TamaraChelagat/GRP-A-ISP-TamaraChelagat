"""
FastAPI Backend for FraudDetectPro
Integrated with Firebase Authentication
"""

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
import firebase_admin
from firebase_admin import credentials, auth
import numpy as np
from datetime import datetime
import logging

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Firebase Admin
if not firebase_admin._apps:
    cred = credentials.Certificate('firebase.json')
    firebase_admin.initialize_app(cred)

# Initialize FastAPI
app = FastAPI(
    title="FraudDetectPro API",
    description="Machine Learning API for Credit Card Fraud Detection",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic Models
class TransactionInput(BaseModel):
    Amount: float
    Time: float
    V1: Optional[float] = 0.0
    V2: Optional[float] = 0.0
    V3: Optional[float] = 0.0
    V4: Optional[float] = 0.0
    V5: Optional[float] = 0.0
    # Add remaining V features as needed


class PredictionResponse(BaseModel):
    transaction_id: str
    is_fraud: bool
    fraud_probability: float
    risk_score: float
    timestamp: str
    explanation: Optional[Dict] = None


class StatsResponse(BaseModel):
    total_transactions: int
    fraud_cases: int
    fraud_ratio: float
    model_accuracy: float
    new_today: int
    fraud_today: int
    ratio_change: float
    accuracy_improvement: float


class TransactionResponse(BaseModel):
    id: str
    amount: float
    time: str
    risk_score: float
    status: str
    features: Dict


# Authentication Dependency
async def verify_firebase_token(authorization: Optional[str] = Header(None)):
    """Verify Firebase ID token from Authorization header"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    try:
        # Extract token from "Bearer <token>"
        token = authorization.split("Bearer ")[-1]
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        logger.error(f"Token verification failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# Mock ML Model (Replace with actual trained model)
class FraudDetectionModel:
    def __init__(self):
        self.accuracy = 0.992
        logger.info("Fraud Detection Model initialized")
    
    def predict(self, features: Dict) -> Dict:
        """Mock prediction - replace with actual model inference"""
        # Simulate fraud detection
        amount = features.get('Amount', 0)
        
        # Simple heuristic for demo (replace with actual model)
        fraud_prob = min(amount / 5000, 0.95) if amount > 1000 else np.random.uniform(0.01, 0.3)
        
        is_fraud = fraud_prob > 0.7
        risk_score = fraud_prob * 100
        
        return {
            'is_fraud': bool(is_fraud),
            'fraud_probability': float(fraud_prob),
            'risk_score': float(risk_score),
            'confidence': float(np.random.uniform(0.85, 0.99))
        }
    
    def explain(self, features: Dict, prediction: Dict) -> Dict:
        """Generate SHAP-like explanation"""
        # Mock explanation - replace with actual SHAP values
        explanation = {
            'top_features': [
                {'feature': 'Amount', 'contribution': 0.35, 'value': features.get('Amount', 0)},
                {'feature': 'V1', 'contribution': -0.15, 'value': features.get('V1', 0)},
                {'feature': 'V2', 'contribution': 0.22, 'value': features.get('V2', 0)},
                {'feature': 'Time', 'contribution': 0.08, 'value': features.get('Time', 0)}
            ],
            'baseline_score': 0.002,
            'prediction_score': prediction['fraud_probability']
        }
        return explanation


# Initialize model
fraud_model = FraudDetectionModel()

# Mock database (replace with actual database)
transactions_db = []
stats_db = {
    'total_transactions': 284807,
    'fraud_cases': 492,
    'new_today': 1234,
    'fraud_today': 15
}


# API Endpoints

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "FraudDetectPro API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "model_loaded": True
    }


@app.get("/api/stats", response_model=StatsResponse)
async def get_stats(user: dict = Depends(verify_firebase_token)):
    """Get dashboard statistics"""
    logger.info(f"Stats requested by user: {user.get('email')}")
    
    fraud_ratio = (stats_db['fraud_cases'] / stats_db['total_transactions']) * 100
    
    return StatsResponse(
        total_transactions=stats_db['total_transactions'],
        fraud_cases=stats_db['fraud_cases'],
        fraud_ratio=fraud_ratio,
        model_accuracy=fraud_model.accuracy * 100,
        new_today=stats_db['new_today'],
        fraud_today=stats_db['fraud_today'],
        ratio_change=0.002,
        accuracy_improvement=0.3
    )


@app.get("/api/transactions", response_model=List[TransactionResponse])
async def get_transactions(
    limit: int = 100,
    user: dict = Depends(verify_firebase_token)
):
    """Get recent transactions"""
    logger.info(f"Transactions requested by user: {user.get('email')}, limit: {limit}")
    
    # Generate mock transactions (replace with database query)
    transactions = []
    for i in range(min(limit, 50)):
        amount = float(np.random.uniform(10, 5000))
        risk = float(np.random.uniform(0, 100))
        
        transaction = TransactionResponse(
            id=f"TXN{datetime.now().timestamp():.0f}{i:03d}",
            amount=round(amount, 2),
            time=datetime.now().isoformat(),
            risk_score=round(risk, 1),
            status="Flagged" if risk > 70 else "Safe",
            features={
                'Amount': amount,
                'V1': float(np.random.randn()),
                'V2': float(np.random.randn())
            }
        )
        transactions.append(transaction)
    
    return transactions


@app.post("/api/predict", response_model=PredictionResponse)
async def predict_fraud(
    transaction: TransactionInput,
    user: dict = Depends(verify_firebase_token)
):
    """Predict fraud for a transaction"""
    logger.info(f"Prediction requested by user: {user.get('email')}")
    
    try:
        # Convert transaction to dict
        features = transaction.dict()
        
        # Get prediction
        prediction = fraud_model.predict(features)
        
        # Generate explanation
        explanation = fraud_model.explain(features, prediction)
        
        # Generate transaction ID
        transaction_id = f"TXN{datetime.now().timestamp():.0f}"
        
        # Store in mock database
        transaction_record = {
            'id': transaction_id,
            'features': features,
            'prediction': prediction,
            'timestamp': datetime.now().isoformat(),
            'user_email': user.get('email')
        }
        transactions_db.append(transaction_record)
        
        # Update stats
        stats_db['total_transactions'] += 1
        stats_db['new_today'] += 1
        if prediction['is_fraud']:
            stats_db['fraud_cases'] += 1
            stats_db['fraud_today'] += 1
        
        response = PredictionResponse(
            transaction_id=transaction_id,
            is_fraud=prediction['is_fraud'],
            fraud_probability=prediction['fraud_probability'],
            risk_score=prediction['risk_score'],
            timestamp=datetime.now().isoformat(),
            explanation=explanation
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.get("/api/explain/{transaction_id}")
async def get_explanation(
    transaction_id: str,
    user: dict = Depends(verify_firebase_token)
):
    """Get SHAP explanation for a specific transaction"""
    logger.info(f"Explanation requested for {transaction_id} by user: {user.get('email')}")
    
    # Find transaction in mock database
    transaction = next((t for t in transactions_db if t['id'] == transaction_id), None)
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Generate fresh explanation
    explanation = fraud_model.explain(
        transaction['features'],
        transaction['prediction']
    )
    
    return {
        'transaction_id': transaction_id,
        'explanation': explanation,
        'prediction': transaction['prediction'],
        'timestamp': transaction['timestamp']
    }


@app.post("/api/feedback")
async def submit_feedback(
    transaction_id: str,
    is_correct: bool,
    user: dict = Depends(verify_firebase_token)
):
    """Submit analyst feedback for model improvement"""
    logger.info(f"Feedback submitted for {transaction_id} by {user.get('email')}")
    
    # Store feedback (implement actual feedback storage)
    feedback_record = {
        'transaction_id': transaction_id,
        'is_correct': is_correct,
        'user_email': user.get('email'),
        'timestamp': datetime.now().isoformat()
    }
    
    return {
        'status': 'success',
        'message': 'Feedback recorded',
        'feedback': feedback_record
    }


@app.get("/api/user/profile")
async def get_user_profile(user: dict = Depends(verify_firebase_token)):
    """Get current user profile"""
    return {
        'uid': user.get('uid'),
        'email': user.get('email'),
        'email_verified': user.get('email_verified', False),
        'provider': user.get('firebase', {}).get('sign_in_provider', 'unknown')
    }


@app.post("/api/model/retrain")
async def trigger_model_retrain(user: dict = Depends(verify_firebase_token)):
    """Trigger model retraining (admin only)"""
    # In production, implement role-based access control
    logger.info(f"Model retrain triggered by {user.get('email')}")
    
    return {
        'status': 'success',
        'message': 'Model retraining initiated',
        'estimated_time': '15 minutes'
    }


# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    logger.error(f"HTTP Exception: {exc.detail}")
    return {
        "error": exc.detail,
        "status_code": exc.status_code
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)