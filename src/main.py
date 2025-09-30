from fastapi import FastAPI, Depends
from fastapi.openapi.utils import get_openapi
from src import auth
from src.auth import get_current_user

app = FastAPI()

# Include authentication routes
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Protected dashboard route
@app.get("/dashboard")
def dashboard(user: dict = Depends(get_current_user)):
    return {
        "message": f"Welcome to the Fraud Detection Dashboard, {user['username']}!",
        "role": user["role"]
    }

# ✅ Custom OpenAPI schema to show "Authorize with Bearer <token>"
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="FraudDetectPro API",
        version="1.0.0",
        description="API for Fraud Detection Dashboard with JWT Authentication",
        routes=app.routes,
    )
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }
    for path in openapi_schema["paths"].values():
        for method in path.values():
            method["security"] = [{"BearerAuth": []}]
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi
