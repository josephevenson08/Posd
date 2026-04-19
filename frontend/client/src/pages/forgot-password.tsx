import { useState } from "react";
import { Link } from "wouter";
import { KeyRound, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiRequest("POST", "/api/auth/forgot-password", { email });
      setIsSuccess(true);
    } catch (error: any) {
      toast({
        title: "Unable to send reset link",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOver = () => {
    setIsSuccess(false);
    setEmail("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-[440px] shadow-md border-slate-200 bg-white">
        <CardHeader className="space-y-4 flex flex-col items-center text-center pt-10 pb-2">
          {isSuccess ? (
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2 bg-green-100 transition-colors duration-500">
              <CheckCircle2 className="w-8 h-8 text-green-600 animate-in zoom-in duration-300" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2 bg-primary/10 transition-colors duration-500">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>
          )}
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900" data-testid="text-title">
              {isSuccess ? "Check your email" : "Forgot password?"}
            </CardTitle>
            <CardDescription className="text-slate-500 text-base max-w-[300px] mx-auto" data-testid="text-description">
              {isSuccess
                ? "If the email exists, we sent a reset link that expires in 15 minutes."
                : "Enter your account email and we'll send you a secure reset link."}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {!isSuccess && (
            <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-600 font-medium">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all duration-200"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-email"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                disabled={isLoading}
                data-testid="button-send-link"
              >
                {isLoading ? "Sending Link..." : "Send Reset Link"}
                {!isLoading && <ArrowRight className="ml-2 w-4 h-4" />}
              </Button>
            </form>
          )}

          {isSuccess && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-600 text-center" data-testid="text-success-message">
                Didn't receive the email? Check your spam folder first, then try again. <br />
                <button
                  type="button"
                  onClick={handleStartOver}
                  className="text-primary font-medium hover:underline mt-1 cursor-pointer"
                  data-testid="button-try-again"
                >
                  Send another reset link
                </button>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pt-2 pb-8 bg-slate-50/50 rounded-b-xl border-t border-slate-100">
          <div className="text-center">
            <Link href="/login">
              <span className="text-sm font-medium text-slate-500 hover:text-slate-700 cursor-pointer transition-colors inline-flex items-center" data-testid="link-back-to-signin">
                <ArrowLeft className="mr-2 w-4 h-4" /> Back to sign in
              </span>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
