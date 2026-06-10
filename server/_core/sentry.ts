import * as Sentry from "@sentry/node";
import { ENV } from "./env";

/**
 * Initialize Sentry for error tracking and performance monitoring
 * Only initializes in production or when SENTRY_DSN is configured
 */
export function initSentry() {
  if (ENV.sentryDsn) {
    Sentry.init({
      dsn: ENV.sentryDsn,
      environment: ENV.sentryEnvironment,
      // Organization and project info
      release: `easy-asphalt@${process.env.npm_package_version || '1.0.0'}`,
      serverName: 'easy-asphalt-driveway.store',
      // Performance monitoring
      tracesSampleRate: ENV.isProduction ? 0.1 : 1.0, // 10% in production, 100% in development
      // Session replay
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
      // Integrations
      integrations: [
        // HTTP requests tracing
        new Sentry.Integrations.Http({ tracing: true }),
        // Express integration
        new Sentry.Integrations.Express({}),
        // Node.js performance monitoring
        new Sentry.Integrations.Node(),
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
      // Filter out common development errors
      ignoreErrors: [
        // Development-specific errors
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
      ],
    });
    
    console.log(`[Sentry] Initialized in ${ENV.sentryEnvironment} environment`);
  } else {
    console.log('[Sentry] Not configured - set SENTRY_DSN to enable error tracking');
  }
}

/**
 * Capture an exception with additional context
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (ENV.sentryDsn) {
    Sentry.withScope((scope) => {
      if (context) {
        Object.keys(context).forEach(key => {
          scope.setExtra(key, context[key]);
        });
      }
      Sentry.captureException(error);
    });
  } else {
    console.error('[Error]', error.message, context);
  }
}

/**
 * Capture a message with level
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>) {
  if (ENV.sentryDsn) {
    Sentry.withScope((scope) => {
      if (context) {
        Object.keys(context).forEach(key => {
          scope.setExtra(key, context[key]);
        });
      }
      Sentry.captureMessage(message, level);
    });
  } else {
    console.log(`[${level.toUpperCase()}]`, message, context);
  }
}