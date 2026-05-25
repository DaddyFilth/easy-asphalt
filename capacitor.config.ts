import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.daddyfilth.drivewayestimator",
  appName: "Driveway Estimator Pro",
  webDir: "dist/public",
  server: {
    androidScheme: "http",
  },
  android: {
    webContentsDebuggingEnabled: true,
  },
};

export default config;
