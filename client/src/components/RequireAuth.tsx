import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Loader2, Lock } from "lucide-react";
import type { ReactNode } from "react";

function getCurrentReturnPath() {
  if (typeof window === "undefined") return "/";

  return `${window.location.pathname}${window.location.search}`;
}

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!user) {
    const loginUrl = getLoginUrl(getCurrentReturnPath());

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <section className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 p-8 text-center shadow-xl">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/15 text-blue-300">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="mb-3 text-2xl font-semibold">Sign in required</h1>
          <p className="mb-7 text-sm leading-6 text-slate-300">
            Your estimates, uploads, saved projects, and contractor share tools
            stay locked until you sign in.
          </p>
          <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
            <a href={loginUrl}>Continue with Google</a>
          </Button>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
