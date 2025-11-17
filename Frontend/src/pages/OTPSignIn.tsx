import { useState, useEffect, useRef } from "react";
import { auth } from "@/config/firebase";
import { otpAuthService } from "@/services/otpAuth";
import { Shield, Phone, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useNavigate } from "react-router-dom";
import { ConfirmationResult } from "firebase/auth";

export default function OTPSignIn() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Cleanup reCAPTCHA on unmount
    return () => {
      if (recaptchaContainerRef.current) {
        recaptchaContainerRef.current.innerHTML = '';
      }
    };
  }, []);

  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      setError("Please enter a phone number");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Format phone number
      const formattedPhone = otpAuthService.formatPhoneNumber(phoneNumber);
      console.log('📞 Formatted phone number:', formattedPhone);
      
      // Create container for reCAPTCHA if it doesn't exist
      if (!recaptchaContainerRef.current) {
        const container = document.createElement('div');
        container.id = 'recaptcha-container';
        container.style.marginTop = '10px';
        document.body.appendChild(container);
        recaptchaContainerRef.current = container;
      } else {
        // Clear existing reCAPTCHA
        recaptchaContainerRef.current.innerHTML = '';
      }

      // Send OTP (use visible reCAPTCHA for better reliability)
      const result = await otpAuthService.sendOTP(formattedPhone, 'recaptcha-container', true);
      
      if (result.success && result.confirmationResult) {
        setConfirmationResult(result.confirmationResult);
        setStep("otp");
        setError(null);
        console.log('✅ OTP sent successfully, waiting for SMS...');
      } else {
        setError(result.error || "Failed to send OTP");
        console.error('❌ Failed to send OTP:', result.error);
      }
    } catch (err: any) {
      console.error("Send OTP error:", err);
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setError("Please enter the 6-digit OTP code");
      return;
    }

    if (!confirmationResult) {
      setError("No OTP confirmation. Please request OTP again.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await otpAuthService.verifyOTP(confirmationResult, otpCode);
      
      if (result.success && result.user) {
        // Successfully signed in
        navigate("/dashboard", { replace: true });
      } else {
        setError(result.error || "Invalid OTP code. Please try again.");
      }
    } catch (err: any) {
      console.error("Verify OTP error:", err);
      setError(err.message || "Failed to verify OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep("phone");
    setOtpCode("");
    setConfirmationResult(null);
    setError(null);
  };

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
                Secure Phone<br />
                Authentication
              </h1>
              <p className="text-lg text-muted-foreground">
                Sign in with your phone number using OTP verification
              </p>
            </div>

            <div className="space-y-4 pt-8">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Quick & Secure</p>
                  <p className="text-xs text-muted-foreground">No password needed</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Trusted by leading financial institutions worldwide
          </div>
        </div>
      </div>

      {/* Right Panel - OTP Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              {step === "phone" ? "Enter Phone Number" : "Enter OTP Code"}
            </h2>
            <p className="text-muted-foreground">
              {step === "phone" 
                ? "We'll send you a verification code" 
                : "Enter the 6-digit code sent to your phone"}
            </p>
          </div>

          {step === "phone" ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 234 567 8900"
                  className="h-12"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Include country code (e.g., +1 for US)
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
                onClick={handleSendOTP}
                disabled={loading || !phoneNumber.trim()}
              >
                {loading ? "Sending..." : "Send OTP"}
              </Button>

              {/* reCAPTCHA container - will show when OTP is sent */}
              <div className="flex justify-center">
                <div id="recaptcha-container" ref={recaptchaContainerRef}></div>
              </div>
              
              {loading && (
                <p className="text-xs text-muted-foreground text-center">
                  Completing reCAPTCHA and sending OTP...
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otpCode}
                    onChange={(value) => setOtpCode(value)}
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
                <p className="text-xs text-muted-foreground text-center">
                  Enter the 6-digit code sent to {phoneNumber}
                </p>
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
                  onClick={handleVerifyOTP}
                  disabled={loading || otpCode.length !== 6}
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </Button>

                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={handleBack}
                  disabled={loading}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Change Phone Number
                </Button>
              </div>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground">
            <button
              onClick={() => navigate("/signin")}
              className="text-primary hover:underline font-medium"
            >
              Back to Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

