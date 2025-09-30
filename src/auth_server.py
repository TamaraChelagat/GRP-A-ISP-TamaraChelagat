from fastapi import FastAPI, Form, HTTPException
from fastapi.responses import HTMLResponse
import pyotp

app = FastAPI()

# Dummy user (in real system, pull from DB)
USER = {"username": "fraud_analyst", "password": "secure123"}

# Generate a secret for OTP
totp = pyotp.TOTP(pyotp.random_base32())

@app.get("/", response_class=HTMLResponse)
async def home():
    return """
    <h2>FraudDetectPro Login</h2>
    <form action="/login" method="post">
        Username: <input name="username"/><br>
        Password: <input type="password" name="password"/><br>
        <button type="submit">Login</button>
    </form>
    """

@app.post("/login")
async def login(username: str = Form(...), password: str = Form(...)):
    if username == USER["username"] and password == USER["password"]:
        return {"msg": "Login successful. Enter OTP", "otp_secret": totp.secret}
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/verify-otp")
async def verify_otp(code: str = Form(...)):
    if totp.verify(code):
        return {"msg": "OTP verified. Access granted ✅"}
    else:
        raise HTTPException(status_code=401, detail="Invalid OTP ❌")
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("auth_server:app", host="127.0.0.1", port=8000, reload=True)
