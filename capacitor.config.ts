import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.daddyfilth.drivewayestimator",
  appName: "Driveway Estimator Pro",
  webDir: "dist/public",
  server: {
    androidScheme: "http",
  },
  android: {
    // Security: Disable webContentsDebuggingEnabled in production
    webContentsDebuggingEnabled: process.env.NODE_ENV !== "production",
  },
};

export default config;
