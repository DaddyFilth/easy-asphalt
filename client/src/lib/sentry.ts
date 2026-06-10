import * as Sentry from "@sentry/react";

/**
 * Initialize Sentry for React client-side error tracking and performance monitoring
 * Only initializes when SENTRY_DSN is configured
 */
export function initSentry() {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT || "development";
  
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment,
      // Organization and project info
      release: `easy-asphalt@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
      serverName: 'easy-asphalt-driveway.store',
      // Performance monitoring
      tracesSampleRate: environment === "production" ? 0.1 : 1.0,
      // Session replay
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      // Integrations
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      // Filter out common client errors
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
        'Failed to fetch',
        'NetworkError',
      ],
      // Before send hook for additional filtering
      beforeSend(event, hint) {
        // Filter out sensitive data
        if (event.request) {
          delete event.request.cookies;
          if (event.request.headers) {
            delete event.request.headers.authorization;
            delete event.request.headers['x-api-key'];
          }
        }
        return event;
      },
    });
    
    console.log(`[Sentry Client] Initialized in ${environment} environment`);
  } else {
    console.log('[Sentry Client] Not configured - set VITE_SENTRY_DSN to enable error tracking');
  }
}