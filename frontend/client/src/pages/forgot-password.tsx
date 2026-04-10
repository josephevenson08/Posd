import { useState } from "react";
import { Link } from "wouter";
import { Smartphone, Mail, KeyRound, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type RecoveryMethod = "sms" | "email" | null;
type Step = "choose" | "form" | "success";

const formatPhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("choose");
  const [method, setMethod] = useState<RecoveryMethod>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const handleSelectMethod = (selected: RecoveryMethod) => {
    setMethod(selected);
    setStep("form");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep("success");
    }, 1500);
  };

  const handleStartOver = () => {
    setStep("choose");
    setMethod(null);
    setEmail("");
    setPhone("");
  };

  const getHeaderIcon = () => {
    if (step === "success") {
      return (
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2 bg-green-100 transition-colors duration-500">
          <CheckCircle2 className="w-8 h-8 text-green-600 animate-in zoom-in duration-300" />
        </div>
      );
    }
    return (
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2 bg-primary/10 transition-colors duration-500">
        <KeyRound className="w-8 h-8 text-primary" />
      </div>
    );
  };

  const getTitle = () => {
    if (step === "success") {
      return method === "sms" ? "Check your phone" : "Check your email";
    }
    if (step === "form") {
      return method === "sms" ? "Enter your phone number" : "Enter your email";
    }
    return "Forgot password?";
  };

  const getDescription = () => {
    if (step === "success") {
      return method === "sms"
        ? "We've sent a verification code to your phone."
        : "We've sent a reset link to your email.";
    }
    if (step === "form") {
      return method === "sms"
        ? "We'll send a verification code to your mobile number."
        : "We'll send a reset link to your email address.";
    }
    return "Choose how you'd like to reset your password.";
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-[440px] shadow-md border-slate-200 bg-white">
        <CardHeader className="space-y-4 flex flex-col items-center text-center pt-10 pb-2">
          {getHeaderIcon()}
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900" data-testid="text-title">
              {getTitle()}
            </CardTitle>
            <CardDescription className="text-slate-500 text-base max-w-[300px] mx-auto" data-testid="text-description">
              {getDescription()}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {step === "choose" && (
            <div className="grid grid-cols-2 gap-4" data-testid="method-selection">
              <button
                type="button"
                onClick={() => handleSelectMethod("sms")}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-slate-200 bg-slate-50 hover:border-primary hover:bg-primary/5 transition-all duration-200 cursor-pointer group"
                data-testid="card-sms"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white border border-slate-200 group-hover:border-primary/30 group-hover:bg-primary/10 transition-all duration-200">
                  <Smartphone className="w-6 h-6 text-slate-500 group-hover:text-primary transition-colors duration-200" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-900 text-sm">Text Message</p>
                  <p className="text-xs text-slate-500 mt-1">We'll send a verification code to your mobile number</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectMethod("email")}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-slate-200 bg-slate-50 hover:border-primary hover:bg-primary/5 transition-all duration-200 cursor-pointer group"
                data-testid="card-email"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white border border-slate-200 group-hover:border-primary/30 group-hover:bg-primary/10 transition-all duration-200">
                  <Mail className="w-6 h-6 text-slate-500 group-hover:text-primary transition-colors duration-200" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-900 text-sm">Email</p>
                  <p className="text-xs text-slate-500 mt-1">We'll send a reset link to your email address</p>
                </div>
              </button>
            </div>
          )}

          {step === "form" && method === "sms" && (
            <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-600 font-medium">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 555-5555"
                  className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all duration-200"
                  maxLength={14}
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                  required
                  data-testid="input-phone"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                disabled={isLoading}
                data-testid="button-send-code"
              >
                {isLoading ? "Sending Code..." : "Send Verification Code"}
                {!isLoading && <ArrowRight className="ml-2 w-4 h-4" />}
              </Button>
              <button
                type="button"
                onClick={handleStartOver}
                className="w-full text-sm text-slate-500 hover:text-slate-700 font-medium flex items-center justify-center gap-1 transition-colors"
                data-testid="button-back-to-methods"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Choose another method
              </button>
            </form>
          )}

          {step === "form" && method === "email" && (
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
              <button
                type="button"
                onClick={handleStartOver}
                className="w-full text-sm text-slate-500 hover:text-slate-700 font-medium flex items-center justify-center gap-1 transition-colors"
                data-testid="button-back-to-methods"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Choose another method
              </button>
            </form>
          )}

          {step === "success" && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-600 text-center" data-testid="text-success-message">
                {method === "sms" ? "Didn't receive the code?" : "Didn't receive the email?"} <br />
                <button
                  type="button"
                  onClick={handleStartOver}
                  className="text-primary font-medium hover:underline mt-1 cursor-pointer"
                  data-testid="button-try-again"
                >
                  Click to try another method
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
