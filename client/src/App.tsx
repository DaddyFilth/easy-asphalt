import { Analytics } from "@vercel/analytics/react";
import { Route, Switch } from "wouter";
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
        <Route path={"/estimator"} component={Estimator} />
        <Route path={"/dashboard"} component={Dashboard} />
        <Route path={"/project/:projectId"} component={ProjectDetail} />
        <Route path={"/share/:shareToken"} component={SharedProject} />

        <Route path={"/login"} component={Login} />

        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
      <Analytics />
    </>
  );
}
