import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import { useLocation } from "wouter";
import { Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      toast.success("Login successful!");
      navigate("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Login failed. Please try again.");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    loginMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-slate-400">Sign in to your account</p>
        </div>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Login</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your email and password to access your account
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loginMutation.isPending}
                    className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-purple-500"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loginMutation.isPending}
                    className="pl-10 pr-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-purple-500"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-300"
                    disabled={loginMutation.isPending}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <a
                  href="/forgot-password"
                  className="text-purple-400 hover:text-purple-300"
                >
                  Forgot password?
                </a>
              </div>
            </CardContent>

            <CardFooter className="space-y-4">
              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <div className="text-center text-sm text-slate-400">
                Don't have an account?{" "}
                <a href="/signup" className="text-purple-400 hover:text-purple-300 font-medium">
                  Sign up
                </a>
              </div>
            </CardFooter>
          </form>
        </Card>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="inline-flex items-center text-slate-400 hover:text-slate-300 text-sm"
          >
            <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
            Back to home
          </a>
        </div>

        <div className="mt-8 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-slate-400">
              <p className="font-medium text-slate-300 mb-1">Security Notice</p>
              <p>Your login is protected with secure password hashing and encrypted transmission. We never store your actual password.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
