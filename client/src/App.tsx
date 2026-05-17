import { Analytics } from "@vercel/analytics/react";
import { Suspense, lazy } from "react";
import { Route, Switch } from "wouter";
import DevicePermissionGate from "./components/DevicePermissionGate";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Estimator = lazy(() => import("./pages/Estimator"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const SharedProject = lazy(() => import("./pages/SharedProject"));

function PageLoader() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07100d] px-4 text-white">
      <div className="rounded-lg border border-white/10 bg-white/8 px-5 py-4 text-sm font-bold shadow-[0_18px_60px_rgba(0,0,0,0.32)]">
        Loading...
      </div>
    </main>
  );
}

export default function App() {
  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path={"/"}>
            <DevicePermissionGate>
              <Home />
            </DevicePermissionGate>
          </Route>
          <Route path={"/estimator"}>
            <DevicePermissionGate>
              <Estimator />
            </DevicePermissionGate>
          </Route>
          <Route path={"/dashboard"}>
            <DevicePermissionGate>
              <Dashboard />
            </DevicePermissionGate>
          </Route>
          <Route path={"/project/:projectId"}>
            <DevicePermissionGate>
              <ProjectDetail />
            </DevicePermissionGate>
          </Route>
          <Route path={"/share/:shareToken"} component={SharedProject} />

          <Route path={"/404"} component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
      <Analytics />
    </>
  );
}
