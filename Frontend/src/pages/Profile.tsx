import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Phone, Building, Shield, Bell, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { auth } from "@/config/firebase";
import { onAuthStateChanged, updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential, User as FirebaseUser } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { TOTPStatusCard } from "@/components/dashboard/TOTPStatusCard";

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  name?: string;
  organization?: string;
}

interface FirestoreUserData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  organization?: string;
  company?: string;
  notifications?: {
    fraudAlerts?: boolean;
    emailNotifications?: boolean;
    weeklyReports?: boolean;
    smsAlerts?: boolean;
  };
}

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [notifications, setNotifications] = useState({
    fraudAlerts: true,
    emailNotifications: true,
    weeklyReports: false,
    smsAlerts: false,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadUserProfile(currentUser);
      } else {
        navigate("/signin");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const loadUserProfile = async (currentUser: FirebaseUser) => {
    try {
      setLoading(true);
      
      // Get basic info from Firebase Auth
      const email = currentUser.email || "";
      const displayName = currentUser.displayName || "";

      // Get additional info from Firestore
      const db = getFirestore();
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      let firestoreData: FirestoreUserData & { name?: string } = {};
      if (userDoc.exists()) {
        firestoreData = userDoc.data() as FirestoreUserData & { name?: string };
      }

      // Determine first and last name from Firestore or Firebase Auth
      let firstName = "";
      let lastName = "";
      
      if (firestoreData.firstName && firestoreData.lastName) {
        // Firestore has separate firstName/lastName
        firstName = firestoreData.firstName;
        lastName = firestoreData.lastName;
      } else if (firestoreData.name) {
        // Firestore has full name, split it
        const nameParts = firestoreData.name.trim().split(" ");
        firstName = nameParts[0] || "";
        lastName = nameParts.slice(1).join(" ") || "";
      } else if (displayName) {
        // Use Firebase Auth displayName
        const nameParts = displayName.trim().split(" ");
        firstName = nameParts[0] || "";
        lastName = nameParts.slice(1).join(" ") || "";
      } else if (email) {
        // Fallback: use email username as first name
        firstName = email.split("@")[0] || "";
      }

      // Populate profile state with actual user data
      setProfile({
        firstName: firstName,
        lastName: lastName,
        email: email,
        phone: firestoreData.phone || "",
        company: firestoreData.organization || firestoreData.company || "",
      });

      // Load notification preferences if they exist
      if (firestoreData.notifications) {
        setNotifications({
          fraudAlerts: firestoreData.notifications.fraudAlerts ?? true,
          emailNotifications: firestoreData.notifications.emailNotifications ?? true,
          weeklyReports: firestoreData.notifications.weeklyReports ?? false,
          smsAlerts: firestoreData.notifications.smsAlerts ?? false,
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load profile data";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);

      // Update display name in Firebase Auth
      const displayName = `${profile.firstName} ${profile.lastName}`.trim();
      if (displayName) {
        await updateProfile(user, { displayName });
      }

      // Update Firestore
      const db = getFirestore();
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        name: displayName,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        organization: profile.company,
        notifications: notifications,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error saving profile:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update profile";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!user || !passwordData.currentPassword || !passwordData.newPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      setSaving(true);

      // Re-authenticate user
      if (!user.email) {
        throw new Error("User email not found");
      }

      const credential = EmailAuthProvider.credential(
        user.email,
        passwordData.currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, passwordData.newPassword);

      // Clear password fields
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      toast.success("Password updated successfully");
    } catch (error) {
      console.error("Error updating password:", error);
      const firebaseError = error as { code?: string; message?: string };
      if (firebaseError.code === "auth/wrong-password") {
        toast.error("Current password is incorrect");
      } else if (firebaseError.code === "auth/weak-password") {
        toast.error("Password is too weak");
      } else {
        toast.error(`Failed to update password: ${firebaseError.message || "Unknown error"}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    const first = profile.firstName?.charAt(0).toUpperCase() || "";
    const last = profile.lastName?.charAt(0).toUpperCase() || "";
    if (first && last) {
      return first + last;
    } else if (first) {
      return first;
    } else if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

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
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Button variant="outline" size="sm" disabled>
                Change Avatar
              </Button>
              <p className="text-xs text-muted-foreground">Avatar feature coming soon</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input 
                id="firstName" 
                placeholder="John" 
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input 
                id="lastName" 
                placeholder="Doe" 
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                id="email" 
                type="email" 
                className="pl-10 bg-muted" 
                placeholder="john.doe@example.com" 
                value={profile.email}
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
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <div className="relative">
              <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                id="company" 
                className="pl-10" 
                placeholder="Acme Inc."
                value={profile.company}
                onChange={(e) => setProfile({ ...profile, company: e.target.value })}
              />
            </div>
          </div>

          <Button 
            onClick={handleSave} 
            className="w-full md:w-auto"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>Manage your password and security preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* TOTP Status Card */}
          <TOTPStatusCard />
          
          <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input 
              id="currentPassword" 
              type="password" 
              placeholder="••••••••"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input 
              id="newPassword" 
              type="password" 
              placeholder="••••••••"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input 
              id="confirmPassword" 
              type="password" 
              placeholder="••••••••"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
            />
          </div>
          <Button 
            variant="outline" 
            className="w-full md:w-auto"
            onClick={handlePasswordUpdate}
            disabled={saving || !user?.email}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Password"
            )}
          </Button>
          {!user?.email && (
            <p className="text-xs text-muted-foreground">
              Password update only available for email/password accounts
            </p>
          )}
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
            <Switch 
              checked={notifications.fraudAlerts}
              onCheckedChange={(checked) => {
                setNotifications({ ...notifications, fraudAlerts: checked });
                handleSave();
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Get email summaries of daily activity</p>
            </div>
            <Switch 
              checked={notifications.emailNotifications}
              onCheckedChange={(checked) => {
                setNotifications({ ...notifications, emailNotifications: checked });
                handleSave();
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Weekly Reports</Label>
              <p className="text-sm text-muted-foreground">Receive weekly analytics reports</p>
            </div>
            <Switch 
              checked={notifications.weeklyReports}
              onCheckedChange={(checked) => {
                setNotifications({ ...notifications, weeklyReports: checked });
                handleSave();
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>SMS Alerts</Label>
              <p className="text-sm text-muted-foreground">Critical alerts via text message</p>
            </div>
            <Switch 
              checked={notifications.smsAlerts}
              onCheckedChange={(checked) => {
                setNotifications({ ...notifications, smsAlerts: checked });
                handleSave();
              }}
            />
          </div>
        </CardContent>
      </Card>
        </div>
      </main>
    </div>
  );
}
