import { useState, useEffect } from "react";
import { auth } from "@/config/firebase";
import { totpAuthService } from "@/services/totpAuth";
import { Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, User } from "firebase/auth";

export function TOTPStatusCard() {
  const [user, setUser] = useState<User | null>(null);
  const [hasTOTP, setHasTOTP] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const enrolled = totpAuthService.hasTOTPEnrolled(currentUser);
        setHasTOTP(enrolled);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading || !user) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasTOTP ? (
              <ShieldCheck className="h-5 w-5 text-success" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-warning" />
            )}
            <CardTitle>Multi-Factor Authentication</CardTitle>
          </div>
        </div>
        <CardDescription>
          {hasTOTP 
            ? "TOTP is enabled for your account" 
            : "Add an extra layer of security with TOTP"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Status</p>
              <p className="text-xs text-muted-foreground">
                {hasTOTP ? "Enabled" : "Not enabled"}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              hasTOTP 
                ? "bg-success/20 text-success" 
                : "bg-warning/20 text-warning"
            }`}>
              {hasTOTP ? "Active" : "Inactive"}
            </div>
          </div>
          
          <Button
            variant={hasTOTP ? "outline" : "default"}
            className="w-full"
            onClick={() => navigate("/totp-setup")}
          >
            {hasTOTP ? "Manage 2FA" : "Enable 2FA"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

