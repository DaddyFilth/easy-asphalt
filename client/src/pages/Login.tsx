import { useAuth } from "@/_core/hooks/useAuth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { LogIn, ShieldCheck, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";

type AuthMode = "login" | "register";

type LoginFormState = {
  email: string;
  password: string;
};

type RegisterFormState = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

function isSafeReturnPath(value: string | null): value is string {
  return (
    !!value &&
    value.length <= 512 &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/login") &&
    !value.includes("\\")
  );
}

function getReturnTo() {
  if (typeof window === "undefined") return "/estimator";

  const params = new URLSearchParams(window.location.search);
  const returnTo = params.get("returnTo");
  return isSafeReturnPath(returnTo) ? returnTo : "/estimator";
}

function getMutationErrorMessage(error: unknown) {
  if (error instanceof TRPCClientError) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export default function Login() {
  const returnTo = useMemo(() => getReturnTo(), []);
  const [, navigate] = useLocation();
  const { isAuthenticated, loading, refresh } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [errorMessage, setErrorMessage] = useState("");
  const [loginForm, setLoginForm] = useState<LoginFormState>({
    email: "",
    password: "",
  });
  const [registerForm, setRegisterForm] = useState<RegisterFormState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await refresh();
      navigate(returnTo, { replace: true });
    },
    onError: error => {
      setErrorMessage(getMutationErrorMessage(error));
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      await refresh();
      navigate(returnTo, { replace: true });
    },
    onError: error => {
      setErrorMessage(getMutationErrorMessage(error));
    },
  });

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(returnTo, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, returnTo]);

  const pending = loginMutation.isPending || registerMutation.isPending;

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    await loginMutation.mutateAsync({
      email: loginForm.email,
      password: loginForm.password,
    });
  };

  const handleRegisterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (registerForm.password !== registerForm.confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    await registerMutation.mutateAsync({
      name: registerForm.name,
      email: registerForm.email,
      password: registerForm.password,
    });
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6">
      <section className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-md items-center">
        <div className="w-full rounded-xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl shadow-slate-950/40 sm:p-8">
          <header className="mb-6 space-y-3 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/15 text-blue-300">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Secure Sign In</h1>
              <p className="text-sm text-slate-300">
                Sign in before using the estimator, dashboard, and device tools.
              </p>
            </div>
          </header>

          <Tabs
            value={mode}
            onValueChange={value => {
              setMode(value as AuthMode);
              setErrorMessage("");
            }}
            className="space-y-4"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Create Account</TabsTrigger>
            </TabsList>

            {errorMessage && (
              <Alert variant="destructive">
                <AlertTitle>Authentication error</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <TabsContent value="login">
              <form className="space-y-4" onSubmit={handleLoginSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={loginForm.email}
                    onChange={event =>
                      setLoginForm(prev => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                    className="border-slate-700 bg-slate-950 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    value={loginForm.password}
                    onChange={event =>
                      setLoginForm(prev => ({
                        ...prev,
                        password: event.target.value,
                      }))
                    }
                    className="border-slate-700 bg-slate-950 text-white"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={pending}
                  className="w-full bg-blue-600 text-white hover:bg-blue-700"
                >
                  <LogIn className="h-4 w-4" />
                  {loginMutation.isPending ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form className="space-y-4" onSubmit={handleRegisterSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="register-name">Full name</Label>
                  <Input
                    id="register-name"
                    type="text"
                    autoComplete="name"
                    value={registerForm.name}
                    onChange={event =>
                      setRegisterForm(prev => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    className="border-slate-700 bg-slate-950 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={registerForm.email}
                    onChange={event =>
                      setRegisterForm(prev => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                    className="border-slate-700 bg-slate-950 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    autoComplete="new-password"
                    value={registerForm.password}
                    onChange={event =>
                      setRegisterForm(prev => ({
                        ...prev,
                        password: event.target.value,
                      }))
                    }
                    className="border-slate-700 bg-slate-950 text-white"
                    required
                  />
                  <p className="text-xs text-slate-400">
                    Use at least 12 characters with uppercase, lowercase, and a
                    number.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-confirm-password">
                    Confirm password
                  </Label>
                  <Input
                    id="register-confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={registerForm.confirmPassword}
                    onChange={event =>
                      setRegisterForm(prev => ({
                        ...prev,
                        confirmPassword: event.target.value,
                      }))
                    }
                    className="border-slate-700 bg-slate-950 text-white"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={pending}
                  className="w-full bg-blue-600 text-white hover:bg-blue-700"
                >
                  <UserPlus className="h-4 w-4" />
                  {registerMutation.isPending
                    ? "Creating account..."
                    : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <footer className="mt-6 text-center text-sm text-slate-400">
            <Link href="/" className="transition hover:text-white">
              Back to home
            </Link>
          </footer>
        </div>
      </section>
    </main>
  );
}
