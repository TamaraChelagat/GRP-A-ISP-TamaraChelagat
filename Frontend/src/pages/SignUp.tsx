import { useState } from "react";
import { auth, googleProvider, githubProvider } from "@/config/firebase";
import { createUserWithEmailAndPassword, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { Eye, EyeOff, Shield, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";

export default function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;
      // Save extra details to Firestore
      try {
        const db = getFirestore();
        await setDoc(doc(db, "users", user.uid), {
          name,
          email,
          organization,
          createdAt: new Date().toISOString(),
        });
      } catch (firestoreError) {
        console.error("Firestore error:", firestoreError);
        // Continue even if Firestore fails
      }
      
      // Navigate immediately (user is already authenticated from createUserWithEmailAndPassword)
      navigate("/dashboard", { replace: true });
      
      // Also set up a listener as backup in case navigation didn't work
      const unsubscribe = onAuthStateChanged(auth, (authUser) => {
        if (authUser && window.location.pathname !== "/dashboard") {
          unsubscribe(); // Stop listening
          // Force navigation if we're still not on dashboard
          setTimeout(() => {
            if (window.location.pathname !== "/dashboard") {
              window.location.href = "/dashboard";
            }
          }, 100);
        }
      });
      
      // Cleanup listener after 2 seconds
      setTimeout(() => unsubscribe(), 2000);
    } catch (error: any) {
      console.error("Sign up error:", error);
      alert(`Sign up failed: ${error.message || 'Please check your details.'}`);
    }
  };

  const getPasswordStrength = (pwd: string) => {
    if (pwd.length === 0) return { strength: 0, label: "" };
    if (pwd.length < 6) return { strength: 25, label: "Weak" };
    if (pwd.length < 10) return { strength: 50, label: "Fair" };
    if (pwd.length < 14) return { strength: 75, label: "Good" };
    return { strength: 100, label: "Strong" };
  };

  const passwordStrength = getPasswordStrength(password);

  const getStrengthColor = (strength: number) => {
    if (strength <= 25) return "bg-destructive";
    if (strength <= 50) return "bg-warning";
    if (strength <= 75) return "bg-accent";
    return "bg-success";
  };

  const handleGoogleSignUp = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        try {
          // Save user to Firestore (use merge to avoid overwriting existing data)
          const db = getFirestore();
          await setDoc(doc(db, "users", result.user.uid), {
            name: result.user.displayName || '',
            email: result.user.email || '',
            organization: '',
            createdAt: new Date().toISOString(),
            provider: 'google'
          }, { merge: true });
        } catch (firestoreError: any) {
          console.error("Firestore error:", firestoreError);
          // Continue even if Firestore fails - user is authenticated
        }
        
        // Navigate immediately (user is already authenticated from signInWithPopup)
        navigate("/dashboard", { replace: true });
        
        // Also set up a listener as backup in case navigation didn't work
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user && window.location.pathname !== "/dashboard") {
            unsubscribe(); // Stop listening
            // Force navigation if we're still not on dashboard
            setTimeout(() => {
              if (window.location.pathname !== "/dashboard") {
                window.location.href = "/dashboard";
              }
            }, 100);
          }
        });
        
        // Cleanup listener after 2 seconds
        setTimeout(() => unsubscribe(), 2000);
      }
    } catch (error: any) {
      console.error("Google sign-up error:", error);
      if (error.code === 'auth/popup-closed-by-user') {
        // Don't show alert if user closed popup intentionally
        return;
      } else if (error.code === 'auth/popup-blocked') {
        alert("Popup was blocked. Please allow popups for this site and try again.");
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        alert("An account already exists with this email. Please sign in instead.");
      } else {
        alert(`Google sign-up failed: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleGithubSignUp = async () => {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      if (result.user) {
        try {
          // Save user to Firestore (use merge to avoid overwriting existing data)
          const db = getFirestore();
          await setDoc(doc(db, "users", result.user.uid), {
            name: result.user.displayName || '',
            email: result.user.email || '',
            organization: '',
            createdAt: new Date().toISOString(),
            provider: 'github'
          }, { merge: true });
        } catch (firestoreError: any) {
          console.error("Firestore error:", firestoreError);
          // Continue even if Firestore fails - user is authenticated
        }
        
        // Navigate immediately (user is already authenticated from signInWithPopup)
        navigate("/dashboard", { replace: true });
        
        // Also set up a listener as backup in case navigation didn't work
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user && window.location.pathname !== "/dashboard") {
            unsubscribe(); // Stop listening
            // Force navigation if we're still not on dashboard
            setTimeout(() => {
              if (window.location.pathname !== "/dashboard") {
                window.location.href = "/dashboard";
              }
            }, 100);
          }
        });
        
        // Cleanup listener after 2 seconds
        setTimeout(() => unsubscribe(), 2000);
      }
    } catch (error: any) {
      console.error("GitHub sign-up error:", error);
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
        alert("An account already exists with this email. Please sign in instead.");
      } else if (error.code === 'auth/operation-not-allowed') {
        alert("GitHub sign-in is not enabled. Please enable it in Firebase Console → Authentication → Sign-in method.");
      } else if (error.code === 'auth/unauthorized-domain') {
        alert("This domain is not authorized. Please add it to Firebase authorized domains.");
      } else {
        alert(`GitHub sign-up failed: ${error.message || error.code || 'Unknown error'}\n\nCheck browser console (F12) for details.`);
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
                Join the Future of<br />
                Fraud Prevention
              </h1>
              <p className="text-lg text-muted-foreground">
                Trusted by 2,500+ financial institutions worldwide
              </p>
            </div>

            <div className="space-y-3">
              {[
                "Real-time fraud detection",
                "Explainable AI for every prediction",
                "Seamless integration with existing systems",
                "24/7 monitoring and instant alerts",
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                    <Check className="h-4 w-4 text-success" />
                  </div>
                  <p className="text-sm text-muted-foreground">{feature}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            © 2024 FraudDetectPro. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Panel - Sign Up Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background overflow-y-auto">
        <div className="w-full max-w-md space-y-8 py-8">
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Create your account</h2>
            <p className="text-muted-foreground">Get started with FraudDetectPro today</p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  required
                  className="h-12"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

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
                <Label htmlFor="organization">Organization (optional)</Label>
                <Input
                  id="organization"
                  type="text"
                  placeholder="Your financial institution"
                  className="h-12"
                  value={organization}
                  onChange={e => setOrganization(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password && (
                  <div className="space-y-1">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getStrengthColor(passwordStrength.strength)}`}
                        style={{ width: `${passwordStrength.strength}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Password strength: <span className="font-medium">{passwordStrength.label}</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-start space-x-2 pt-2">
                <Checkbox id="terms" required />
                <Label htmlFor="terms" className="text-sm font-normal leading-relaxed cursor-pointer">
                  I agree to the{" "}
                  <button type="button" className="text-primary hover:underline">
                    Terms of Service
                  </button>{" "}
                  and{" "}
                  <button type="button" className="text-primary hover:underline">
                    Privacy Policy
                  </button>
                </Label>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full" variant="hero">
              Create Account
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button type="button" variant="outline" size="lg" onClick={handleGoogleSignUp}>
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
              <Button type="button" variant="outline" size="lg" onClick={handleGithubSignUp}>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </Button>
            </div>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/signin")}
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
