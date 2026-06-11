import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DialogUi,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Mail, Lock, User, AlertCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup";
}

export default function AuthModal({ open, onClose, initialMode = "login" }: AuthModalProps) {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setEmail("");
    setName("");
    setPassword("");
    setError("");
  };

  const switchMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
        toast.success("Welcome back! You're signed in.");
      } else {
        await signup(email, name, password);
        toast.success("Account created! Welcome to Client Scope.");
      }
      resetForm();
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogUi open={open} onOpenChange={(open) => {
      if (!open) {
        resetForm();
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-md border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">
        {/* Decorative top accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-accent to-primary" />

        <DialogHeader className="pt-8 pb-6 px-8 text-center relative">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          
          <DialogTitle 
            className="text-3xl font-bold tracking-tight text-foreground" 
            style={{ fontFamily: "Poppins" }}
          >
            {mode === "login" ? "Welcome Back" : "Join Client Scope"}
          </DialogTitle>
          
          <DialogDescription className="mt-3 text-muted-foreground text-base max-w-xs mx-auto">
            {mode === "login"
              ? "Sign in to access and manage your proposals effortlessly"
              : "Create your account and start building professional proposals"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6">
          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                className="flex items-start gap-3 rounded-2xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Name Field (Signup only) */}
          <AnimatePresence mode="wait">
            {mode === "signup" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <Label htmlFor="auth-name" className="text-foreground font-medium">
                  Full Name
                </Label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    id="auth-name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border-border bg-input/80 hover:bg-input focus:bg-input h-14 pl-12 text-base rounded-2xl placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/30 transition-all"
                    required
                    disabled={loading}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="auth-email" className="text-foreground font-medium">
              Email Address
            </Label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                id="auth-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-border bg-input/80 hover:bg-input focus:bg-input h-14 pl-12 text-base rounded-2xl placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/30 transition-all"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="auth-password" className="text-foreground font-medium">
              Password
            </Label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                id="auth-password"
                type="password"
                placeholder={mode === "signup" ? "Create a strong password (min 6 chars)" : "Enter your password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-border bg-input/80 hover:bg-input focus:bg-input h-14 pl-12 text-base rounded-2xl placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/30 transition-all"
                required
                minLength={6}
                disabled={loading}
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-14 text-base font-semibold rounded-2xl bg-primary hover:bg-primary/90 active:scale-[0.985] transition-all shadow-lg shadow-primary/25 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                {mode === "login" ? "Signing you in..." : "Creating your account..."}
              </>
            ) : (
              mode === "login" ? "Sign In" : "Create Account"
            )}
          </Button>

          {/* Switch Mode */}
          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">
              {mode === "login" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={switchMode}
                    className="font-semibold text-accent hover:text-accent/80 underline-offset-4 hover:underline transition-colors"
                  >
                    Sign up free
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={switchMode}
                    className="font-semibold text-accent hover:text-accent/80 underline-offset-4 hover:underline transition-colors"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </form>
      </DialogContent>
    </DialogUi>
  );
}