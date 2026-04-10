import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { User, Lock, Bell, LogOut } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    specialty: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const userStr = localStorage.getItem("mediportal_user");
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        setUser(parsedUser);
        setProfileForm({
          username: parsedUser.username || "",
          firstName: parsedUser.firstName || "",
          lastName: parsedUser.lastName || "",
          email: parsedUser.email || "",
          phone: parsedUser.phone || "",
          specialty: parsedUser.specialty || "",
        });
      } catch {}
    }
  }, []);

  const capitalize = (str: string) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handleProfileChange = (field: keyof typeof profileForm, value: string) => {
    setProfileForm((current) => ({
      ...current,
      [field]: field === "phone" ? formatPhoneNumber(value) : value,
    }));
  };

  const handlePasswordChange = (field: keyof typeof passwordForm, value: string) => {
    setPasswordForm((current) => ({ ...current, [field]: value }));
  };

  const handleSaveProfile = async () => {
    if (!user?.id) {
      toast({ title: "Error", description: "No active user found", variant: "destructive" });
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await apiRequest("PATCH", `/api/doctors/${user.id}/profile`, profileForm);
      const updatedUser = await res.json();
      setUser(updatedUser);
      setProfileForm({
        username: updatedUser.username || "",
        firstName: updatedUser.firstName || "",
        lastName: updatedUser.lastName || "",
        email: updatedUser.email || "",
        phone: updatedUser.phone || "",
        specialty: updatedUser.specialty || "",
      });
      localStorage.setItem("mediportal_user", JSON.stringify(updatedUser));
      setIsEditingProfile(false);
      toast({ title: "Profile Updated", description: "Your doctor profile was updated successfully." });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error?.message || "Unable to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    setProfileForm({
      username: user?.username || "",
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      specialty: user?.specialty || "",
    });
    setIsEditingProfile(false);
  };

  const handleUpdatePassword = async () => {
    if (!user?.id) {
      toast({ title: "Error", description: "No active user found", variant: "destructive" });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: "Validation Error", description: "New passwords do not match", variant: "destructive" });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await apiRequest("POST", `/api/doctors/${user.id}/password`, {
        currentPassword: passwordForm.currentPassword,
        password: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast({ title: "Password Updated", description: "Your password has been changed successfully." });
    } catch (error: any) {
      toast({
        title: "Password Update Failed",
        description: error?.message || "Unable to update password",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", { username: user?.username });
    } catch {}

    localStorage.removeItem("mediportal_user");
    sessionStorage.removeItem("mediportal_admin_passcode");
    setLocation("/login");
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
          <p className="text-slate-500 mt-2">Manage your account preferences and security settings.</p>
        </div>

        <div className="space-y-6 max-w-3xl">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500 bg-opacity-10">
                <User className="w-5 h-5 text-blue-500" />
              </div>
              <CardTitle className="text-lg font-semibold text-slate-900">Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-600">First Name</Label>
                  <Input
                    data-testid="input-first-name"
                    value={profileForm.firstName}
                    readOnly
                    className="bg-slate-50 border-slate-200 text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600">Last Name</Label>
                  <Input
                    data-testid="input-last-name"
                    value={profileForm.lastName}
                    readOnly
                    className="bg-slate-50 border-slate-200 text-slate-900"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600">Username</Label>
                <Input
                  data-testid="input-username"
                  value={profileForm.username}
                  readOnly
                  className="bg-slate-50 border-slate-200 text-slate-900"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600">Email</Label>
                <Input
                  data-testid="input-email"
                  value={profileForm.email}
                  readOnly={!isEditingProfile}
                  onChange={(e) => handleProfileChange("email", e.target.value)}
                  className="bg-slate-50 border-slate-200 text-slate-900"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-600">Phone</Label>
                  <Input
                    data-testid="input-phone"
                    value={profileForm.phone}
                    readOnly={!isEditingProfile}
                    onChange={(e) => handleProfileChange("phone", e.target.value)}
                    className="bg-slate-50 border-slate-200 text-slate-900"
                    maxLength={14}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600">Specialty</Label>
                  <Input
                    data-testid="input-specialty"
                    value={profileForm.specialty ? capitalize(profileForm.specialty.replace("-", " ")) : ""}
                    readOnly
                    className="bg-slate-50 border-slate-200 text-slate-900"
                  />
                </div>
              </div>
              <div className="pt-2 flex gap-3">
                {isEditingProfile ? (
                  <>
                    <Button
                      data-testid="button-save-profile"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={handleSaveProfile}
                      disabled={isSavingProfile}
                    >
                      {isSavingProfile ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    data-testid="button-edit-profile"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => setIsEditingProfile(true)}
                  >
                    Edit Profile
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500 bg-opacity-10">
                <Lock className="w-5 h-5 text-blue-500" />
              </div>
              <CardTitle className="text-lg font-semibold text-slate-900">Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-600">Current Password</Label>
                <Input
                  data-testid="input-current-password"
                  type="password"
                  placeholder="Enter current password"
                  className="border-slate-200"
                  value={passwordForm.currentPassword}
                  onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-600">New Password</Label>
                  <Input
                    data-testid="input-new-password"
                    type="password"
                    placeholder="Enter new password"
                    className="border-slate-200"
                    value={passwordForm.newPassword}
                    onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600">Confirm Password</Label>
                  <Input
                    data-testid="input-confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    className="border-slate-200"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                  />
                </div>
              </div>
              <div className="pt-2">
                <Button
                  data-testid="button-update-password"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleUpdatePassword}
                  disabled={isUpdatingPassword}
                >
                  {isUpdatingPassword ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500 bg-opacity-10">
                <Bell className="w-5 h-5 text-blue-500" />
              </div>
              <CardTitle className="text-lg font-semibold text-slate-900">Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Email Notifications</p>
                  <p className="text-sm text-slate-500">Receive updates and alerts via email</p>
                </div>
                <Switch
                  data-testid="switch-email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <div className="border-t border-slate-100" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">SMS Notifications</p>
                  <p className="text-sm text-slate-500">Receive urgent alerts via text message</p>
                </div>
                <Switch
                  data-testid="switch-sms-notifications"
                  checked={smsNotifications}
                  onCheckedChange={setSmsNotifications}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 shadow-sm">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500 bg-opacity-10">
                <LogOut className="w-5 h-5 text-red-500" />
              </div>
              <CardTitle className="text-lg font-semibold text-slate-900">Account</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 mb-4">Sign out of your account. You will need to log in again to access the dashboard.</p>
              <Button data-testid="button-sign-out" variant="destructive" onClick={handleSignOut}>
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
