import { useState, useEffect } from "react";
import { auth } from "@/config/firebase";
import { totpAuthService } from "@/services/totpAuth";
import { Shield, QrCode, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, User } from "firebase/auth";

export default function TOTPSetup() {
  const [user, setUser] = useState<User | null>(null);
  const [step, setStep] = useState<"start" | "qr" | "verify">("start");
  const [totpSecret, setTotpSecret] = useState<string>("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [totpCode, setTotpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Check if TOTP is already enrolled
        if (totpAuthService.hasTOTPEnrolled(currentUser)) {
          setSuccess(true);
        }
      } else {
        navigate("/signin");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleStartEnrollment = async () => {
    if (!user) {
      setError("You must be signed in to set up TOTP");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await totpAuthService.enrollTOTP(user, "FraudDetectPro TOTP");
      
      if (result.success && result.secret && result.qrCodeUrl) {
        setTotpSecret(result.secret);
        setQrCodeUrl(result.qrCodeUrl);
        setStep("qr");
      } else {
        setError(result.error || "Failed to start TOTP enrollment");
      }
    } catch (err: any) {
      console.error("TOTP enrollment error:", err);
      setError(err.message || "Failed to start TOTP enrollment");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndComplete = async () => {
    if (!user || !totpSecret || !totpCode || totpCode.length !== 6) {
      setError("Please enter the 6-digit code from your authenticator app");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await totpAuthService.completeTOTPEnrollment(
        user,
        totpCode,
        totpSecret,
        "FraudDetectPro TOTP"
      );
      
      if (result.success) {
        setSuccess(true);
        setStep("verify");
      } else {
        setError(result.error || "Invalid code. Please try again.");
      }
    } catch (err: any) {
      console.error("TOTP verification error:", err);
      setError(err.message || "Failed to verify TOTP code");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">TOTP Enabled!</h2>
              <p className="text-muted-foreground mt-2">
                Multi-factor authentication is now active for your account.
              </p>
            </div>
            <Button onClick={() => navigate("/dashboard")} className="w-full" size="lg">
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-2/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/20 to-accent/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        
        <div className="relative z-10 flex flex-col justify-between p-12 text-foreground">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold">FraudDetect<span className="text-primary">Pro</span></span>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold leading-tight">
                Enable Multi-Factor<br />
                Authentication
              </h1>
              <p className="text-lg text-muted-foreground">
                Add an extra layer of security with TOTP
              </p>
            </div>

            <div className="space-y-4 pt-8">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <QrCode className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Time-Based Codes</p>
                  <p className="text-xs text-muted-foreground">6-digit codes that change every 30 seconds</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Enhanced security for your account
          </div>
        </div>
      </div>

      {/* Right Panel - TOTP Setup Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Set Up TOTP</h2>
            <p className="text-muted-foreground">
              {step === "start" && "Get started with multi-factor authentication"}
              {step === "qr" && "Scan the QR code with your authenticator app"}
              {step === "verify" && "Verify your authenticator app"}
            </p>
          </div>

          {step === "start" && (
            <div className="space-y-6">
              <div className="p-6 rounded-lg border border-border bg-card">
                <h3 className="font-semibold mb-2">What is TOTP?</h3>
                <p className="text-sm text-muted-foreground">
                  Time-based One-Time Password (TOTP) adds an extra layer of security. 
                  You'll use an authenticator app (like Google Authenticator or Authy) 
                  to generate 6-digit codes that change every 30 seconds.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}

              <Button 
                type="button" 
                size="lg" 
                className="w-full" 
                variant="hero"
                onClick={handleStartEnrollment}
                disabled={loading}
              >
                {loading ? "Starting..." : "Start Setup"}
              </Button>

              <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/dashboard")}
              >
                Skip for Now
              </Button>
            </div>
          )}

          {step === "qr" && (
            <div className="space-y-6">
              <div className="p-6 rounded-lg border border-border bg-card space-y-4">
                <div className="flex justify-center">
                  {qrCodeUrl ? (
                    <div className="space-y-2">
                      {/* Use QR code API service to generate QR code image */}
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qrCodeUrl)}`}
                        alt="TOTP QR Code" 
                        className="w-64 h-64 border rounded-lg mx-auto"
                        onError={(e) => {
                          console.error('QR code image failed to load');
                          // Fallback: show the otpauth URL for manual entry
                        }}
                      />
                      <p className="text-xs text-muted-foreground text-center">
                        Scan with your authenticator app
                      </p>
                    </div>
                  ) : (
                    <div className="w-64 h-64 border rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">Loading QR code...</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-center">Steps:</p>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Open your authenticator app (Google Authenticator, Authy, etc.)</li>
                    <li>Scan this QR code with your app</li>
                    <li>Enter the 6-digit code shown in your app below</li>
                  </ol>
                </div>

                {totpSecret && (
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground mb-1">Manual Entry Key:</p>
                    <p className="text-xs font-mono break-all">{totpSecret}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="totp">Enter 6-Digit Code</Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={totpCode}
                    onChange={(value) => setTotpCode(value)}
                    disabled={loading}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <Button 
                  type="button" 
                  size="lg" 
                  className="w-full" 
                  variant="hero"
                  onClick={handleVerifyAndComplete}
                  disabled={loading || totpCode.length !== 6}
                >
                  {loading ? "Verifying..." : "Verify & Enable TOTP"}
                </Button>

                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setStep("start")}
                  disabled={loading}
                >
                  Back
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

