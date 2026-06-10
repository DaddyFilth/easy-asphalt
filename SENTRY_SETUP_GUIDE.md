# Sentry Setup Guide for Easy Asphalt

## Overview

Sentry has been configured for the Easy Asphalt project with the following details:
- **Organization**: easy-asphalt
- **Project**: javascript-nextjs
- **Domain**: easy-asphalt-driveway.store

## Manual Setup Required

Since the interactive wizard could not be run in this environment, you'll need to complete a few manual steps:

### Step 1: Get Your Sentry DSN

1. Log in to your Sentry account at https://sentry.io/
2. Navigate to your organization: easy-asphalt
3. Select the project: javascript-nextjs
4. Go to Settings > Projects > javascript-nextjs > Keys
5. Copy the DSN (Data Source Name)

The DSN should look like:
```
https://<your-key>@o4511361067974656.ingest.us.sentry.io/<your-project-id>
```

### Step 2: Update Environment Variables

Add the DSN to your `.env` file:

```bash
SENTRY_DSN=https://<your-actual-dsn-from-sentry>
SENTRY_ENVIRONMENT=development
VITE_SENTRY_DSN=https://<your-actual-dsn-from-sentry>
VITE_SENTRY_ENVIRONMENT=development
VITE_APP_VERSION=1.0.0
```

For production:
```bash
SENTRY_ENVIRONMENT=production
VITE_SENTRY_ENVIRONMENT=production
```

### Step 3: Verify Configuration

The Sentry configuration has been updated in the following files:

- `server/_core/sentry.ts` - Server-side error tracking
- `sentry.server.config.ts` - Next.js server configuration
- `sentry.edge.config.ts` - Edge runtime configuration
- `client/src/lib/sentry.ts` - Client-side error tracking

All configurations include:
- Organization: easy-asphalt
- Project: javascript-nextjs
- Server name: easy-asphalt-driveway.store
- Release tracking with version numbers

### Step 4: Test Sentry Integration

#### Test Server-Side Errors

1. Start your development server:
```bash
pnpm dev
```

2. In your application code (temporarily for testing), add this to trigger an error:
```javascript
// Add this to any server-side route temporarily
throw new Error("Test Sentry server error");
```

3. Check your Sentry dashboard at https://sentry.io/projects/easy-asphalt/javascript-nextjs/

#### Test Client-Side Errors

1. Visit the test page (if available): `/sentry-example-page`
2. Or temporarily add this to your client code:
```javascript
// Add this to any client-side component temporarily
throw new Error("Test Sentry client error");
```

3. Check your Sentry dashboard for the error

#### Test with Existing Example Pages

The project includes example pages for Sentry testing:
- `src/pages/sentry-example-page.tsx` - Client-side test page
- `src/pages/api/sentry-example-api.ts` - Server-side test API

Visit `/sentry-example-page` and click the test button to trigger an error.

## Configuration Details

### Server-Side Configuration

```typescript
// server/_core/sentry.ts
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT || 'development',
  release: `easy-asphalt@${process.env.npm_package_version || '1.0.0'}`,
  serverName: 'easy-asphalt-driveway.store',
  tracesSampleRate: 0.1, // 10% in production
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### Client-Side Configuration

```typescript
// client/src/lib/sentry.ts
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
  release: `easy-asphalt@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
  serverName: 'easy-asphalt-driveway.store',
  tracesSampleRate: 0.1, // 10% in production
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### Features Enabled

- **Error Tracking**: Captures JavaScript errors and exceptions
- **Performance Monitoring**: Tracks transaction performance
- **Session Replay**: Records user sessions for debugging (10% sample rate)
- **Release Tracking**: Associates errors with specific versions
- **Environment Tagging**: Separates development, staging, and production data
- **Data Filtering**: Removes sensitive information (cookies, auth headers)

## Production Considerations

### Sampling Rates

For production deployment, consider adjusting sampling rates:

```typescript
// In production
tracesSampleRate: 0.1, // 10% of transactions
replaysSessionSampleRate: 0.01, // 1% of sessions
replaysOnErrorSampleRate: 1.0, // 100% of error sessions
```

### Security

The configuration includes automatic filtering of sensitive data:
- Cookies are removed from requests
- Authorization headers are removed
- API keys are removed
- All text is masked in session replays
- Media is blocked in session replays

### Alerts

Set up alerts in Sentry to notify you of:
- New errors
- Increased error frequency
- Performance degradation
- Release-specific issues

Configure alerts at: https://sentry.io/alerts/

## Troubleshooting

### Errors Not Appearing in Sentry

1. Check that SENTRY_DSN is set correctly in `.env`
2. Verify the environment is set correctly
3. Check browser console for Sentry initialization messages
4. Ensure your Sentry project is active
5. Check that your organization has sufficient quota

### Development vs Production

- Development: 100% sampling, more detailed logging
- Production: 10% sampling, optimized for performance

### Network Issues

If you experience network issues with Sentry:
- Check your firewall allows connections to sentry.io
- Verify your DSN is correct
- Check Sentry service status at https://status.sentry.io/

## Monitoring Best Practices

1. **Regular Review**: Check Sentry dashboard weekly
2. **Set Alerts**: Configure alerts for critical errors
3. **Track Releases**: Associate each deployment with a release
4. **Monitor Performance**: Keep an eye on transaction times
5. **Session Replay**: Review session replays for critical user flows

## Integration with Other Tools

Sentry integrates well with:
- **GitHub**: Link Sentry issues to GitHub commits
- **Slack**: Send error notifications to Slack channels
- **Jira**: Create Jira tickets from Sentry issues
- **PagerDuty**: Trigger on-call rotations for critical errors

Configure integrations at: https://sentry.io/settings/integrations/

## Next Steps

1. Add your actual Sentry DSN to `.env`
2. Test error tracking with the example pages
3. Set up appropriate alerts
4. Configure release tracking for your deployment pipeline
5. Integrate with your preferred communication tools

## Support

For Sentry-specific issues:
- Documentation: https://docs.sentry.io/
- Community: https://forum.sentry.io/
- Support: https://sentry.io/support/

For Easy Asphalt project issues:
- GitHub Issues: https://github.com/DaddyFilth/easy-asphalt/issues
- Email: support@easy-asphalt-driveway.store