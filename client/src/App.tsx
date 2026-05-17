import { Analytics } from "@vercel/analytics/react";
import { Route, Switch } from "wouter";
import DevicePermissionGate from "./components/DevicePermissionGate";
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
      <Analytics />
    </>
  );
}
