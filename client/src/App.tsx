// client/src/App.tsx
import Login from "./pages/Login";
// ...other imports

export default function App() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/estimator"} component={Estimator} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/project/:projectId"} component={ProjectDetail} />
      <Route path={"/share/:shareToken"} component={SharedProject} />

      {/* new login route */}
      <Route path={"/login"} component={Login} />

      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}
