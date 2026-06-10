// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  // Get your DSN from: https://sentry.io/projects/easy-asphalt/javascript-nextjs/settings/keys/
  dsn: process.env.SENTRY_DSN || "https://57f4e66333a9611af04d56f203acad1c@o4511361067974656.ingest.us.sentry.io/4511361068236800",
  
  // Organization: easy-asphalt
  // Project: javascript-nextjs
  
  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
  
  // Set release and environment
  release: `easy-asphalt@${process.env.npm_package_version || '1.0.0'}`,
  environment: process.env.SENTRY_ENVIRONMENT || 'development',
  
  // Server name for identification
  serverName: 'easy-asphalt-driveway.store',
});
