import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, ArrowRight, CheckCircle2, ArrowLeft, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type ResetState = "checking" | "invalid" | "form" | "success";

function getTokenFromUrl(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get("token")?.trim() || "";
}

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const token = useMemo(() => getTokenFromUrl(), []);
  const [state, setState] = useState<ResetState>(token ? "checking" : "invalid");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }

    let isMounted = true;

    const validateToken = async () => {
      try {
        const response = await fetch(`/api/auth/reset-password/validate?token=${encodeURIComponent(token)}`, {
          credentials: "include",
        });
        const payload = await response.json();

        if (!isMounted) {
          return;
        }

        setState(payload?.valid ? "form" : "invalid");
      } catch (_error) {
        if (isMounted) {
          setState("invalid");
        }
      }
    };

    validateToken();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const passwordChecks = [
    { label: "At least 8 characters", valid: password.length >= 8 },
    { label: "One uppercase letter", valid: /[A-Z]/.test(password) },
    { label: "One lowercase letter", valid: /[a-z]/.test(password) },
    { label: "One number", valid: /[0-9]/.test(password) },
    { label: "One special character", valid: /[^A-Za-z0-9]/.test(password) },
  ];

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please enter the same password in both fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await apiRequest("POST", "/api/auth/reset-password", {
        token,
        password,
        confirmPassword,
      });
      setState("success");
    } catch (error: any) {
      toast({
        title: "Reset failed",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-[460px] shadow-md border-slate-200 bg-white">
        <CardHeader className="space-y-4 flex flex-col items-center text-center pt-10 pb-2">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-2 ${state === "success" ? "bg-green-100" : "bg-primary/10"}`}>
            {state === "success" ? (
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            ) : (
              <LockKeyhole className="w-8 h-8 text-primary" />
            )}
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
              {state === "success" ? "Password updated" : "Reset your password"}
            </CardTitle>
            <CardDescription className="text-slate-500 text-base max-w-[320px] mx-auto">
              {state === "success"
                ? "Your password has been reset. You can now sign in with your new password."
                : "Create a new password that meets the same account requirements."}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {state === "checking" && (
            <p className="text-center text-sm text-slate-500" data-testid="text-validating-token">
              Validating reset link...
            </p>
          )}

          {state === "invalid" && (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-600 text-center" data-testid="text-invalid-link">
              This reset link is invalid or expired. Please request a new password reset email.
            </div>
          )}

          {state === "form" && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-600 font-medium">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all duration-200 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    data-testid="input-new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-600 font-medium">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all duration-200 pr-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    data-testid="input-confirm-new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-3 bg-slate-50 space-y-1" data-testid="password-requirements">
                {passwordChecks.map((rule) => (
                  <div
                    key={rule.label}
                    className={`text-xs ${rule.valid ? "text-green-600" : "text-slate-500"}`}
                  >
                    {rule.valid ? "PASS" : "PENDING"} {rule.label}
                  </div>
                ))}
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                disabled={isLoading}
                data-testid="button-reset-password"
              >
                {isLoading ? "Updating Password..." : "Update Password"}
                {!isLoading && <ArrowRight className="ml-2 w-4 h-4" />}
              </Button>
            </form>
          )}

          {state === "success" && (
            <Button
              type="button"
              className="w-full h-11 text-base font-semibold"
              onClick={() => setLocation("/login")}
              data-testid="button-go-to-login"
            >
              Go to Sign In
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pt-2 pb-8 bg-slate-50/50 rounded-b-xl border-t border-slate-100">
          <div className="text-center">
            <Link href="/forgot-password">
              <span className="text-sm font-medium text-slate-500 hover:text-slate-700 cursor-pointer transition-colors inline-flex items-center">
                <ArrowLeft className="mr-2 w-4 h-4" /> Back to forgot password
              </span>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
