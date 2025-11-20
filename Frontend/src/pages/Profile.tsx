import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Phone, Building, Shield, Bell, Lock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { auth } from "@/config/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/services/api";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { totpAuthService } from "@/services/totpAuth";

interface FirestoreUserData {
  name?: string;
  phone?: string;
  company?: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [firestoreData, setFirestoreData] = useState<FirestoreUserData & { name?: string }>({});
  const [loading, setLoading] = useState(true);
  const [totpEnrolled, setTotpEnrolled] = useState(false);
  const [checkingTOTP, setCheckingTOTP] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Fetch Firestore data
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data() as FirestoreUserData;
            setFirestoreData({
              name: data.name || "",
              phone: data.phone || "",
              company: data.company || "",
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
        
        // Check TOTP enrollment
        try {
          const enrolled = totpAuthService.hasTOTPEnrolled(currentUser);
          setTotpEnrolled(enrolled);
        } catch (error) {
          console.error("Error checking TOTP enrollment:", error);
        } finally {
          setCheckingTOTP(false);
        }
        
        setLoading(false);
      } else {
        navigate("/signin");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleSave = async () => {
    if (!user) return;
    
    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        name: firestoreData.name,
        phone: firestoreData.phone,
        company: firestoreData.company,
      }, { merge: true });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  const handleTOTPSetup = () => {
    navigate("/totp-setup");
  };

  if (loading || checkingTOTP) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <p>Loading profile...</p>
          </div>
        </main>
      </div>
    );
  }

  const displayName = firestoreData.name || user?.displayName || user?.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground">Manage your account settings and preferences</p>
          </div>

          {/* Profile Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline" size="sm">Change Avatar</Button>
                  <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max size 2MB</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={firestoreData.name || ""}
                    onChange={(e) => setFirestoreData({ ...firestoreData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="company"
                      className="pl-10"
                      placeholder="Acme Inc."
                      value={firestoreData.company || ""}
                      onChange={(e) => setFirestoreData({ ...firestoreData, company: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-10"
                    value={user?.email || ""}
                    disabled
                  />
                </div>
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    className="pl-10"
                    placeholder="+1 (555) 000-0000"
                    value={firestoreData.phone || ""}
                    onChange={(e) => setFirestoreData({ ...firestoreData, phone: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={handleSave} className="w-full md:w-auto">
                Save Changes
              </Button>
            </CardContent>
          </Card>

          {/* Security Settings with MFA */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security
              </CardTitle>
              <CardDescription>Manage your password and security preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Multi-Factor Authentication */}
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      <Label>Two-Factor Authentication (TOTP)</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security with time-based one-time passwords
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {totpEnrolled ? (
                      <span className="text-sm font-medium text-green-600">Enabled</span>
                    ) : (
                      <span className="text-sm font-medium text-muted-foreground">Not Set Up</span>
                    )}
                    <Button
                      variant={totpEnrolled ? "outline" : "default"}
                      size="sm"
                      onClick={handleTOTPSetup}
                    >
                      {totpEnrolled ? "Manage" : "Set Up"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Password Change */}
              <div className="space-y-4">
                <h4 className="font-medium">Change Password</h4>
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" placeholder="••••••••" />
                </div>
                <Button variant="outline" className="w-full md:w-auto">
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>Configure how you receive alerts and updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Fraud Alerts</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications for high-risk transactions</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Get email summaries of daily activity</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Reports</Label>
                  <p className="text-sm text-muted-foreground">Receive weekly analytics reports</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMS Alerts</Label>
                  <p className="text-sm text-muted-foreground">Critical alerts via text message</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
