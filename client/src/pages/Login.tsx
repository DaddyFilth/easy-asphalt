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
  const neonInputClassName =
    "h-11 border-[#2b6e1b] bg-black/80 text-[#39ff14] placeholder:text-[#5e9f4d] focus-visible:border-[#39ff14] focus-visible:ring-[#39ff14]/20";
  const neonButtonClassName =
    "h-11 w-full border border-[#39ff14]/40 bg-[#123c0f] text-[#39ff14] hover:bg-[#195314]";
  const mutedCopyClassName = "text-[#9fe788]";
  const helperCopyClassName = "text-[#78bf64]";
  const neonInputStyle = {
    color: "#39ff14",
    WebkitTextFillColor: "#39ff14",
    caretColor: "#39ff14",
  } as const;

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
    <main className="min-h-dvh overflow-x-hidden overflow-y-auto bg-[#010400] px-4 py-8 text-[#d6ffcb] [color-scheme:dark] sm:px-6">
      <section className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-lg items-center">
        <div className="w-full rounded-2xl border border-[#246416] bg-[#041103]/96 p-6 shadow-[0_0_0_1px_rgba(57,255,20,0.12),0_24px_80px_rgba(0,0,0,0.6)] sm:p-8">
          <header className="mb-6 space-y-3 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#39ff14]/12 text-[#39ff14] shadow-[0_0_22px_rgba(57,255,20,0.14)]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-[#39ff14]">
                Secure Sign In
              </h1>
              <p className={`text-sm leading-6 ${mutedCopyClassName}`}>
                Sign in or create an account to unlock the full estimator,
                dashboard, pricing, previews, and saved project tools.
              </p>
              <p className={`text-xs leading-5 ${helperCopyClassName}`}>
                Want to test the capture flow first? The estimator demo works
                without an account.
              </p>
            </div>
          </header>

          <Tabs
            value={mode}
            onValueChange={value => {
              setMode(value as AuthMode);
              setErrorMessage("");
            }}
            className="space-y-5"
          >
            <TabsList className="grid h-auto w-full grid-cols-2 border border-[#2b6e1b] bg-[#0a2107] p-1">
              <TabsTrigger
                value="login"
                className="h-11 text-base text-[#afff98] data-[state=active]:border-[#39ff14]/25 data-[state=active]:bg-[#39ff14]/18 data-[state=active]:text-[#39ff14]"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="h-11 text-base text-[#afff98] data-[state=active]:border-[#39ff14]/25 data-[state=active]:bg-[#39ff14]/18 data-[state=active]:text-[#39ff14]"
              >
                Create Account
              </TabsTrigger>
            </TabsList>

            {errorMessage && (
              <Alert
                variant="destructive"
                className="border border-[#7a220f] bg-[#240903] text-[#ffd7cc]"
              >
                <AlertTitle className="text-[#ffd7cc]">
                  Authentication error
                </AlertTitle>
                <AlertDescription className="text-[#ffb8a6]">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            <TabsContent value="login" className="text-[#d6ffcb]">
              <form className="space-y-4" onSubmit={handleLoginSubmit}>
                <div className="space-y-2">
                  <Label
                    htmlFor="login-email"
                    className="text-sm text-[#b9ff9a]"
                  >
                    Email
                  </Label>
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
                    className={neonInputClassName}
                    style={neonInputStyle}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="login-password"
                    className="text-sm text-[#b9ff9a]"
                  >
                    Password
                  </Label>
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
                    className={neonInputClassName}
                    style={neonInputStyle}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={pending}
                  className={neonButtonClassName}
                >
                  <LogIn className="h-4 w-4" />
                  {loginMutation.isPending ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="text-[#d6ffcb]">
              <form className="space-y-4" onSubmit={handleRegisterSubmit}>
                <div className="space-y-2">
                  <Label
                    htmlFor="register-name"
                    className="text-sm text-[#b9ff9a]"
                  >
                    Full name
                  </Label>
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
                    className={neonInputClassName}
                    style={neonInputStyle}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="register-email"
                    className="text-sm text-[#b9ff9a]"
                  >
                    Email
                  </Label>
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
                    className={neonInputClassName}
                    style={neonInputStyle}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="register-password"
                    className="text-sm text-[#b9ff9a]"
                  >
                    Password
                  </Label>
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
                    className={neonInputClassName}
                    style={neonInputStyle}
                    required
                  />
                  <p className={`text-xs ${helperCopyClassName}`}>
                    Use at least 12 characters with uppercase, lowercase, and a
                    number.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="register-confirm-password"
                    className="text-sm text-[#b9ff9a]"
                  >
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
                    className={neonInputClassName}
                    style={neonInputStyle}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={pending}
                  className={neonButtonClassName}
                >
                  <UserPlus className="h-4 w-4" />
                  {registerMutation.isPending
                    ? "Creating account..."
                    : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <footer className={`mt-6 text-center text-sm ${helperCopyClassName}`}>
            <Link href="/" className="transition hover:text-[#d6ffcb]">
              Back to home
            </Link>
            <span className="mx-2 text-[#2f621f]">•</span>
            <Link href="/estimator" className="transition hover:text-[#d6ffcb]">
              Open demo capture
            </Link>
          </footer>
        </div>
      </section>
    </main>
  );
}
