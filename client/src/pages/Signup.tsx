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
import { Mail, Lock, User, ArrowRight, Check, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

export default function Signup() {
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: () => {
      toast.success("Account created successfully!");
      navigate("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Signup failed. Please try again.");
    },
  });

  const passwordStrength = (password: string) => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return Math.min(strength, 4);
  };

  const getStrengthColor = (strength: number) => {
    switch (strength) {
      case 0: return "bg-slate-600";
      case 1: return "bg-red-500";
      case 2: return "bg-orange-500";
      case 3: return "bg-yellow-500";
      case 4: return "bg-emerald-500";
      default: return "bg-slate-600";
    }
  };

  const getStrengthText = (strength: number) => {
    switch (strength) {
      case 0: return "Enter a password";
      case 1: return "Weak";
      case 2: return "Fair";
      case 3: return "Good";
      case 4: return "Strong";
      default: return "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const strength = passwordStrength(formData.password);
    if (strength < 2) {
      toast.error("Password is too weak. Please use a stronger password.");
      return;
    }

    signupMutation.mutate({
      name: formData.name,
      email: formData.email,
      password: formData.password,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const currentStrength = passwordStrength(formData.password);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-slate-400">Join Driveway Estimator Pro</p>
        </div>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Sign Up</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your information to create your account
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={signupMutation.isPending}
                    className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-purple-500"
                    required
                    autoComplete="name"
                  />
                </div>
              </div>

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
                    disabled={signupMutation.isPending}
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
                    disabled={signupMutation.isPending}
                    className="pl-10 pr-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-purple-500"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-300"
                    disabled={signupMutation.isPending}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                
                {formData.password && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-slate-600 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getStrengthColor(currentStrength)} transition-all duration-300`}
                          style={{ width: `${(currentStrength / 4) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400">{getStrengthText(currentStrength)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                      <div className={`flex items-center gap-1 ${formData.password.length >= 8 ? 'text-emerald-400' : ''}`}>
                        <Check className="h-3 w-3" />
                        8+ characters
                      </div>
                      <div className={`flex items-center gap-1 ${/[A-Z]/.test(formData.password) ? 'text-emerald-400' : ''}`}>
                        <Check className="h-3 w-3" />
                        Uppercase
                      </div>
                      <div className={`flex items-center gap-1 ${/[0-9]/.test(formData.password) ? 'text-emerald-400' : ''}`}>
                        <Check className="h-3 w-3" />
                        Number
                      </div>
                      <div className={`flex items-center gap-1 ${/[^A-Za-z0-9]/.test(formData.password) ? 'text-emerald-400' : ''}`}>
                        <Check className="h-3 w-3" />
                        Special char
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-300">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={signupMutation.isPending}
                    className={`pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-purple-500 ${
                      formData.confirmPassword && formData.confirmPassword !== formData.password
                        ? 'border-red-500'
                        : ''
                    }`}
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="space-y-4">
              <Button
                type="submit"
                disabled={signupMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {signupMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <div className="text-center text-sm text-slate-400">
                Already have an account?{" "}
                <a href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
                  Sign in
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
              <p className="font-medium text-slate-300 mb-1">Password Requirements</p>
              <ul className="space-y-1">
                <li>• At least 8 characters</li>
                <li>• One uppercase letter</li>
                <li>• One number</li>
                <li>• One special character</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
