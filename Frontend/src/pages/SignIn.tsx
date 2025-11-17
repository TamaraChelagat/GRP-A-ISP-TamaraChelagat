import { useState, useEffect } from "react";
import { auth, googleProvider, githubProvider } from "@/config/firebase";
import { signInWithPopup, signInWithEmailAndPassword, signOut, fetchSignInMethodsForEmail } from "firebase/auth";
import { Eye, EyeOff, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom"; 


export default function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // Redirect to dashboard if already signed in
  // But wait a moment to allow sign-out to complete if it just happened
  useEffect(() => {
    const timer = setTimeout(() => {
      if (auth.currentUser) {
        navigate("/dashboard", { replace: true });
      }
    }, 500); // Wait 500ms to allow sign-out to complete
    
    return () => clearTimeout(timer);
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      if (result.user) {
        navigate("/dashboard");
      } else {
        alert("Email authentication failed.");
      }
    } catch (error) {
      alert("Email sign-in failed. Please check your credentials.");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        // Wait a moment for auth state to propagate, then navigate
        setTimeout(() => {
          navigate("/dashboard");
        }, 300);
      }
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      // Handle specific error codes
      if (error.code === 'auth/popup-closed-by-user') {
        // Don't show alert if user closed popup intentionally
        return;
      } else if (error.code === 'auth/popup-blocked') {
        alert("Popup was blocked. Please allow popups for this site and try again.");
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        // Try to find which sign-in method was used originally
        const email = error.customData?.email;
        if (email) {
          try {
            const methods = await fetchSignInMethodsForEmail(auth, email);
            let methodMessage = "email/password";
            if (methods.includes('google.com')) {
              methodMessage = "Google";
            } else if (methods.includes('github.com')) {
              methodMessage = "GitHub";
            } else if (methods.includes('password')) {
              methodMessage = "email/password";
            }
            alert(`An account already exists with this email (${email}).\n\nPlease sign in using: ${methodMessage}\n\nIf you used email/password, use the email form above.`);
          } catch (fetchError) {
            alert(`An account already exists with this email.\n\nPlease sign in with your original method (email/password or GitHub).`);
          }
        } else {
          alert("An account already exists with this email. Please sign in with your original method (email/password or GitHub).");
        }
      } else {
        alert(`Google sign-in failed: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleGithubSignIn = async () => {
    try {
      // signInWithPopup will open a popup window for GitHub authentication
      console.log("Opening GitHub sign-in popup...");
      const result = await signInWithPopup(auth, githubProvider);
      console.log("GitHub sign-in successful:", result.user?.email);
      if (result.user) {
        // Wait a moment for auth state to propagate, then navigate
        setTimeout(() => {
          navigate("/dashboard");
        }, 300);
      }
    } catch (error: any) {
      console.error("GitHub sign-in error:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      
      if (error.code === 'auth/popup-closed-by-user') {
        // Don't show alert if user closed popup intentionally
        return;
      } else if (error.code === 'auth/cancelled-popup-request') {
        // User cancelled or another popup is already open - don't show error
        console.log("GitHub sign-in was cancelled or another popup is open");
        return;
      } else if (error.code === 'auth/popup-blocked') {
        alert("Popup was blocked. Please allow popups for this site and try again.");
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        // Try to find which sign-in method was used originally
        const email = error.customData?.email;
        if (email) {
          try {
            const methods = await fetchSignInMethodsForEmail(auth, email);
            let methodMessage = "email/password";
            if (methods.includes('google.com')) {
              methodMessage = "Google";
            } else if (methods.includes('github.com')) {
              methodMessage = "GitHub";
            } else if (methods.includes('password')) {
              methodMessage = "email/password";
            }
            alert(`An account already exists with this email (${email}).\n\nPlease sign in using: ${methodMessage}\n\nIf you used email/password, use the email form above.`);
          } catch (fetchError) {
            alert(`An account already exists with this email.\n\nPlease sign in with your original method (email/password or Google).`);
          }
        } else {
          alert("An account already exists with this email. Please sign in with your original method (email/password or Google).");
        }
      } else if (error.code === 'auth/operation-not-allowed') {
        alert("GitHub sign-in is not enabled. Please enable it in Firebase Console → Authentication → Sign-in method.");
      } else if (error.code === 'auth/unauthorized-domain') {
        alert("This domain is not authorized. Please add it to Firebase authorized domains.");
      } else if (error.code === 'auth/internal-error') {
        alert(`GitHub sign-in failed due to a network or configuration issue.\n\nPossible causes:\n- Network/firewall blocking Google APIs\n- GitHub OAuth not properly configured\n- Check browser console (F12) for details\n\nTry:\n- Check your internet connection\n- Disable VPN/proxy if using one\n- Try a different network\n- Verify GitHub OAuth is enabled in Firebase Console`);
      } else {
        alert(`GitHub sign-in failed: ${error.message || error.code || 'Unknown error'}\n\nCheck browser console (F12) for details.`);
      }
    }
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
                AI-Powered Security,<br />
                Human-Centered Trust
              </h1>
              <p className="text-lg text-muted-foreground">
                Protecting financial institutions with explainable machine learning
              </p>
            </div>

            <div className="space-y-4 pt-8">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border">
                <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-success">$38.5B</span>
                </div>
                <div>
                  <p className="text-sm font-semibold">Fraud Prevented Globally</p>
                  <p className="text-xs text-muted-foreground">Across 2,500+ institutions</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">99.2%</span>
                </div>
                <div>
                  <p className="text-sm font-semibold">Detection Accuracy</p>
                  <p className="text-xs text-muted-foreground">Real-time ML predictions</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Trusted by leading financial institutions worldwide
          </div>
        </div>
      </div>

      {/* Right Panel - Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground">Sign in to your FraudDetectPro account</p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="analyst@institution.com"
                  required
                  className="h-12"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    required
                    className="h-12 pr-10"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" />
                  <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                    Remember me
                  </Label>
                </div>
                <button type="button" className="text-sm text-primary hover:underline">
                  Forgot password?
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full" variant="hero">
              Sign In Securely
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Button type="button" variant="outline" size="lg" onClick={handleGoogleSignIn}>
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
              <Button type="button" variant="outline" size="lg" onClick={handleGithubSignIn}>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </Button>
              <Button type="button" variant="outline" size="lg" onClick={() => navigate("/otp-signin")}>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                OTP
              </Button>
            </div>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            New to FraudDetectPro?{" "}
            <button
              onClick={() => navigate("/signup")}
              className="text-primary hover:underline font-medium"
            >
              Create an account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
