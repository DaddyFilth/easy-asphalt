# Sentry Setup for Vite + Express + tRPC Architecture

## Architecture Note

Your project uses a **custom architecture** (not standard Next.js):
- **Frontend**: Vite + React
- **Backend**: Express.js
- **API**: tRPC
- **Mobile**: Capacitor

The Sentry Next.js SDK is **not appropriate** for this architecture. Use the configuration below instead.

## Installation

Your project already has the correct packages:
- ✅ `@sentry/node` (for Express.js)
- ✅ `@sentry/react` (for React/Vite)

## Configuration

### 1. Get Your Sentry DSN

1. Log in to https://sentry.io/
2. Navigate to: easy-asphalt organization
3. Select: javascript-nextjs project
4. Go to: Settings → Projects → javascript-nextjs → Keys
5. Copy the DSN

### 2. Environment Variables

Add to your `.env`:

```bash
# Server-side Sentry (Express.js)
SENTRY_DSN=https://<<your-dsn>>

# Client-side Sentry (React)
VITE_SENTRY_DSN=https://<<your-dsn>>

# Environment
SENTRY_ENVIRONMENT=development
VITE_SENTRY_ENVIRONMENT=development

# Organization and Project
SENTRY_ORG=easy-asphalt
SENTRY_PROJECT=javascript-nextjs

# Source map upload (optional)
SENTRY_AUTH_TOKEN=<<your-auth-token>>

# Release version
VITE_APP_VERSION=1.0.0
```

### 3. Current Configuration Status

✅ **Server-side**: Already configured in `server/_core/sentry.ts`  
✅ **Client-side**: Already configured in `client/src/lib/sentry.ts`  
✅ **Edge config**: Already configured in `sentry.edge.config.ts` (if needed)

### 4. Source Maps (Optional)

For production source maps:

1. **Get Auth Token**:
   - Go to: https://sentry.io/settings/auth-tokens/
   - Create token with `project:releases` and `org:read` scopes
   - Copy the token (starts with `sntrys_`)

2. **Update Vite Config**:
   Add Sentry source map upload to your Vite configuration

### 5. Verification

**Test Server Errors:**
```bash
# Temporarily add to any Express route
throw new Error("Sentry test error");
```

**Test Client Errors:**
```bash
# Temporarily add to any React component
throw new Error("Sentry client test error");
```

**Check Dashboard:**
- Visit: https://sentry.io/issues/
- Errors should appear within 30 seconds

## Architecture-Specific Features

### Express.js Middleware
Your Express app can use Sentry middleware for request tracing:

```typescript
// In server/_core/index.ts
import * as Sentry from "@sentry/node";

// Add Sentry middleware
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());
```

### tRPC Integration
For tRPC error tracking:

```typescript
// In your tRPC procedures
import * as Sentry from "@sentry/node";

export const appRouter = router({
  myProcedure: protectedProcedure
    .mutation(async ({ ctx }) => {
      try {
        // Your logic
      } catch (error) {
        Sentry.captureException(error);
        throw error;
      }
    })
});
```

### React Error Boundaries
For client-side error boundaries:

```typescript
import * as Sentry from "@sentry/react";
import { ErrorBoundary } from "@sentry/react";

function App() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <YourApp />
    </ErrorBoundary>
  );
}
```

## Next Steps

1. Add your actual DSN to `.env`
2. Test error tracking
3. Configure source maps (optional)
4. Set up alerts in Sentry dashboard
5. Review performance metrics

Your current setup is correctly configured for your Vite + Express architecture!