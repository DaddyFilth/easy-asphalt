// client/src/pages/Login.tsx
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Chrome } from "lucide-react";

export default function Login() {
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
          <a href={getLoginUrl("/estimator")}>
            <Chrome className="h-4 w-4" />
            Continue with Google
          </a>
        </Button>
      </div>
    </div>
  );
}
