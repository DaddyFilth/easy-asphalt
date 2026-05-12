// client/src/pages/Login.tsx
import { Button } from "@/components/ui/button";
import { getAuthorizationUrl } from "@/const";
import { Chrome } from "lucide-react";
import { Link } from "wouter";

function getReturnTo() {
  if (typeof window === "undefined") return "/estimator";

  const params = new URLSearchParams(window.location.search);
  return params.get("returnTo") || "/estimator";
}

export default function Login() {
  const returnTo = getReturnTo();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">
          Sign in to Driveway Estimator Pro
        </h1>
        <p className="text-slate-300 mb-8">
          Continue with your Google account to reach the secure authorization
          screen.
        </p>
        <Button
          asChild
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
        >
          <a href={getAuthorizationUrl(returnTo)}>
            <Chrome className="h-4 w-4" />
            Continue with Google
          </a>
        </Button>
        <Link
          href="/"
          className="mt-5 inline-block text-sm text-slate-400 hover:text-white"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
