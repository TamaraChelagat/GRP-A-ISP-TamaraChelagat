# 🚀 FraudDetectPro Deployment Guide

Complete guide for deploying FraudDetectPro to production.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Firebase Cloud Storage Setup](#firebase-cloud-storage-setup)
6. [Database/Storage Options](#databasestorage-options)
7. [Production Checklist](#production-checklist)

---

## Prerequisites

### Required Software
- **Python 3.10+** (for backend)
- **Node.js 18+** and **npm/yarn** (for frontend)
- **Docker** (optional, for containerized deployment)
- **Firebase Account** with project created

### Required Files
- `firebase.json` - Firebase Admin SDK credentials (download from Firebase Console)
- `models/` - Trained model files (nn_feature_extractor.h5, rf_model.pkl, xgb_model.pkl, lr_model.pkl, model_metadata.pkl)
- `data/processed/scaler.pkl` - Feature scaler
- `data/raw/creditcard.csv` - Dataset (for data generator, optional)

---

## Environment Variables

### Backend (.env)

Create `.env` file in project root:

```env
# FastAPI Configuration
FASTAPI_URL=http://localhost:8000
PORT=8000

# Firebase Admin SDK
# Path to firebase.json (or set GOOGLE_APPLICATION_CREDENTIALS)
GOOGLE_APPLICATION_CREDENTIALS=./firebase.json

# Optional: Database connection (if using external database)
# DATABASE_URL=postgresql://user:password@localhost:5432/frauddetectpro
# MONGODB_URI=mongodb://localhost:27017/frauddetectpro
```

### Frontend (.env)

Create `Frontend/.env` file:

```env
# API Configuration
VITE_API_URL=http://localhost:8000

# Firebase Configuration (already in firebase.ts, but can override)
# VITE_FIREBASE_API_KEY=your_api_key
# VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
# etc.
```

---

## Backend Deployment

### Option 1: Docker Deployment (Recommended)

#### Step 1: Build Docker Image

```bash
docker build -t frauddetectpro-backend .
```

#### Step 2: Run Container

```bash
docker run -d \
  --name frauddetectpro-backend \
  -p 8000:8000 \
  -v $(pwd)/firebase.json:/app/firebase.json \
  -e FASTAPI_URL=http://localhost:8000 \
  frauddetectpro-backend
```

#### Step 3: Using Docker Compose

```bash
docker-compose up -d
```

#### Step 4: Verify Deployment

```bash
curl http://localhost:8000/health
```

### Option 2: Manual Deployment (Without Docker)

#### Step 1: Install Dependencies

```bash
pip install -r requirements.txt
```

#### Step 2: Set Environment Variables

```bash
export FASTAPI_URL=http://localhost:8000
export GOOGLE_APPLICATION_CREDENTIALS=./firebase.json
```

#### Step 3: Run Application

```bash
cd app
uvicorn main:app --host 0.0.0.0 --port 8000
```

#### Step 4: Run with Process Manager (Production)

Using **systemd** (Linux):

Create `/etc/systemd/system/frauddetectpro.service`:

```ini
[Unit]
Description=FraudDetectPro API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/your/project
Environment="PATH=/path/to/venv/bin"
ExecStart=/path/to/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable frauddetectpro
sudo systemctl start frauddetectpro
```

### Option 3: Cloud Platform Deployment

#### AWS (Elastic Beanstalk / ECS)

1. **Elastic Beanstalk:**
   ```bash
   # Install EB CLI
   pip install awsebcli
   
   # Initialize
   eb init -p python-3.10 frauddetectpro
   
   # Create environment
   eb create frauddetectpro-env
   
   # Deploy
   eb deploy
   ```

2. **ECS (Docker):**
   - Push Docker image to ECR
   - Create ECS task definition
   - Deploy to ECS cluster

#### Google Cloud Platform (Cloud Run)

```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/PROJECT_ID/frauddetectpro

# Deploy to Cloud Run
gcloud run deploy frauddetectpro \
  --image gcr.io/PROJECT_ID/frauddetectpro \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

#### Heroku

```bash
# Install Heroku CLI
heroku login

# Create app
heroku create frauddetectpro-api

# Set environment variables
heroku config:set FASTAPI_URL=https://frauddetectpro-api.herokuapp.com

# Deploy
git push heroku main
```

#### Railway

1. Connect GitHub repository
2. Railway auto-detects Dockerfile
3. Set environment variables in Railway dashboard
4. Deploy automatically on push

#### Render

1. Create new Web Service
2. Connect GitHub repository
3. Set build command: `pip install -r requirements.txt && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables
6. Deploy

---

## Frontend Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   cd Frontend
   vercel
   ```

3. **Set Environment Variables:**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add `VITE_API_URL` with your backend URL

4. **Automatic Deployments:**
   - Connect GitHub repository
   - Vercel auto-deploys on push to main branch

### Option 2: Netlify

1. **Install Netlify CLI:**
   ```bash
   npm i -g netlify-cli
   ```

2. **Deploy:**
   ```bash
   cd Frontend
   netlify deploy --prod
   ```

3. **Set Environment Variables:**
   - Netlify Dashboard → Site Settings → Environment Variables
   - Add `VITE_API_URL`

### Option 3: Manual Build & Deploy

1. **Build:**
   ```bash
   cd Frontend
   npm install
   npm run build
   ```

2. **Deploy `dist/` folder:**
   - Upload to any static hosting (AWS S3, GitHub Pages, etc.)
   - Or serve with nginx/Apache

### Option 4: Docker (Frontend)

Create `Frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## Firebase Cloud Storage Setup

### Step 1: Enable Cloud Storage

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **frauddetectpro**
3. Navigate to **Storage** in left sidebar
4. Click **Get Started**
5. Choose **Start in test mode** (for development) or **Start in production mode**
6. Select a location for your storage bucket

### Step 2: Configure Storage Rules

Go to **Storage** → **Rules**:

**Development (Test Mode):**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Production (Secure):**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // User-specific files
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Transaction data (read-only for users, write for backend)
    match /transactions/{transactionId} {
      allow read: if request.auth != null;
      allow write: if false; // Only backend can write
    }
    
    // Public assets (read-only)
    match /public/{allPaths=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

### Step 3: Use Cloud Storage in Code (Optional)

If you want to store transaction data in Cloud Storage:

**Backend (Python):**
```python
from firebase_admin import storage

bucket = storage.bucket()
blob = bucket.blob(f"transactions/{transaction_id}.json")
blob.upload_from_string(json.dumps(transaction_data))
```

**Frontend (TypeScript):**
```typescript
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const storage = getStorage();
const storageRef = ref(storage, `transactions/${transactionId}.json`);
await uploadBytes(storageRef, data);
```

### Step 4: Configure CORS (if needed)

If accessing from web:

```bash
gsutil cors set cors.json gs://your-bucket-name
```

`cors.json`:
```json
[
  {
    "origin": ["https://yourdomain.com"],
    "method": ["GET", "POST", "PUT"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
```

---

## Database/Storage Options

### Option 1: Firestore (Recommended)

**Pros:**
- Already integrated with Firebase Auth
- No additional setup needed
- Real-time updates
- Free tier available

**Setup:**
1. Firebase Console → Firestore Database
2. Create database (Start in test mode or production mode)
3. Update Firestore rules (similar to Storage rules)

**Backend Integration:**
```python
from firebase_admin import firestore

db = firestore.client()
doc_ref = db.collection('transactions').document(transaction_id)
doc_ref.set({
    'amount': amount,
    'timestamp': datetime.now().isoformat(),
    'risk_score': probability,
    'status': status
})
```

### Option 2: PostgreSQL

**Setup:**
1. Install PostgreSQL
2. Create database: `CREATE DATABASE frauddetectpro;`
3. Install driver: `pip install psycopg2-binary sqlalchemy`

**Backend Integration:**
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
```

### Option 3: MongoDB

**Setup:**
1. Install MongoDB or use MongoDB Atlas (cloud)
2. Install driver: `pip install pymongo`

**Backend Integration:**
```python
from pymongo import MongoClient

client = MongoClient(os.getenv("MONGODB_URI"))
db = client.frauddetectpro
transactions = db.transactions
transactions.insert_one(transaction_data)
```

### Option 4: In-Memory (Current Implementation)

**Pros:**
- Simple, no setup
- Fast for development

**Cons:**
- Data lost on restart
- Not suitable for production

**For Production:** Switch to Firestore, PostgreSQL, or MongoDB

---

## Production Checklist

### Security

- [ ] **Firebase Authentication:**
  - Enable required sign-in methods (Email/Password, Google, GitHub, Phone, TOTP)
  - Configure authorized domains
  - Set up OAuth redirect URIs

- [ ] **API Security:**
  - Change `optional_auth` to `verify_firebase_token` in `app/main.py`
  - Enable CORS only for your frontend domain
  - Use HTTPS/SSL certificates
  - Set secure environment variables

- [ ] **Firebase Rules:**
  - Update Firestore rules for production
  - Update Storage rules for production
  - Test rules with Firebase Emulator

- [ ] **Environment Variables:**
  - Never commit `.env` files
  - Use secure secret management (AWS Secrets Manager, HashiCorp Vault, etc.)
  - Rotate API keys regularly

### Performance

- [ ] **Caching:**
  - Implement Redis for session caching
  - Cache model predictions if needed
  - Use CDN for frontend assets

- [ ] **Monitoring:**
  - Set up logging (CloudWatch, Datadog, etc.)
  - Monitor API response times
  - Set up alerts for errors

- [ ] **Scaling:**
  - Use load balancer for multiple backend instances
  - Enable auto-scaling based on traffic
  - Use database connection pooling

### Configuration

- [ ] **CORS:**
  ```python
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["https://yourdomain.com"],  # Replace with actual domain
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```

- [ ] **Environment Variables:**
  - Set `FASTAPI_URL` to production URL
  - Set `VITE_API_URL` in frontend to production backend URL
  - Configure Firebase project for production

- [ ] **Database:**
  - Migrate from in-memory to persistent database
  - Set up database backups
  - Configure connection pooling

### Testing

- [ ] **Health Checks:**
  - Verify `/health` endpoint works
  - Set up monitoring to check health endpoint

- [ ] **API Testing:**
  - Test all endpoints with authentication
  - Verify predictions work correctly
  - Test error handling

- [ ] **Frontend Testing:**
  - Test all pages load correctly
  - Verify authentication flows
  - Test on multiple browsers

### Documentation

- [ ] **API Documentation:**
  - Access Swagger UI at `/docs`
  - Document all endpoints
  - Provide example requests/responses

- [ ] **User Documentation:**
  - Update README with deployment instructions
  - Document environment variables
  - Provide troubleshooting guide

---

## Quick Start Commands

### Local Development

**Backend:**
```bash
cd app
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd Frontend
npm install
npm run dev
```

**Data Generator:**
```bash
python app/data_generator.py
```

### Production Deployment

**Docker:**
```bash
docker-compose up -d
```

**Manual:**
```bash
# Backend
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Frontend
cd Frontend
npm run build
# Deploy dist/ folder
```

---

## Troubleshooting

### Backend Issues

**Problem:** Models not loading
- **Solution:** Verify `models/` directory exists and contains all required files
- Check file paths in `app/main.py`

**Problem:** Firebase authentication failing
- **Solution:** Verify `firebase.json` exists and is valid
- Check Firebase project ID matches

**Problem:** CORS errors
- **Solution:** Update CORS middleware to allow your frontend domain
- Check browser console for specific CORS error

### Frontend Issues

**Problem:** API calls failing
- **Solution:** Verify `VITE_API_URL` is set correctly
- Check backend is running and accessible
- Verify Firebase authentication token is being sent

**Problem:** Build errors
- **Solution:** Run `npm install` to ensure all dependencies are installed
- Check Node.js version (requires 18+)

### Deployment Issues

**Problem:** Docker build fails
- **Solution:** Check Dockerfile syntax
- Verify all required files are in context
- Check `.dockerignore` isn't excluding needed files

**Problem:** Container crashes on start
- **Solution:** Check container logs: `docker logs frauddetectpro-backend`
- Verify environment variables are set
- Check file permissions for `firebase.json`

---

## Support

For issues or questions:
- Check logs: `docker logs frauddetectpro-backend` (if using Docker)
- Review Firebase Console for authentication errors
- Check browser console (F12) for frontend errors
- Review backend logs for API errors

---

**Last Updated:** 2024
**Version:** 2.2

