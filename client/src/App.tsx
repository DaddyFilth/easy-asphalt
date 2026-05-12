import { Analytics } from "@vercel/analytics/react";
import { Route, Switch } from "wouter";
import DevicePermissionGate from "./components/DevicePermissionGate";
import RequireAuth from "./components/RequireAuth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Estimator from "./pages/Estimator";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import ProjectDetail from "./pages/ProjectDetail";
import SharedProject from "./pages/SharedProject";

export default function App() {
  return (
    <>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/estimator"}>
          <RequireAuth>
            <DevicePermissionGate>
              <Estimator />
            </DevicePermissionGate>
          </RequireAuth>
        </Route>
        <Route path={"/dashboard"}>
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        </Route>
        <Route path={"/project/:projectId"}>
          <RequireAuth>
            <ProjectDetail />
          </RequireAuth>
        </Route>
        <Route path={"/share/:shareToken"} component={SharedProject} />

        <Route path={"/login"} component={Login} />

        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
      <Analytics />
    </>
  );
}
