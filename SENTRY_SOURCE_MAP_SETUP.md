# Sentry Source Map Upload for Vite

## Current Status

✅ **Sentry Auth Token Added**: `SENTRY_AUTH_TOKEN=f34e30384bcb11f1b327c64fdd12ad4f`

Your Sentry DSN and auth token are now configured. Source maps help Sentry show readable error stack traces instead of minified code.

## Optional: Automatic Source Map Upload

To automatically upload source maps to Sentry during build, add the Sentry Vite plugin:

### Step 1: Install the plugin

```bash
pnpm add -D @sentry/vite-plugin
```

### Step 2: Update vite.config.ts

```typescript
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { defineConfig } from "vite";
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    sentryVitePlugin({
      org: "easy-asphalt",
      project: "easy-asphalt",
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
  // ... rest of your config
});
```

### Step 3: Update build script

Source maps will be automatically uploaded when you run:

```bash
pnpm build
```

## Manual Source Map Upload

If you prefer not to add the plugin, you can upload source maps manually:

### Option 1: Use Sentry CLI

```bash
# Install Sentry CLI
npm install -g @sentry/cli

# Upload source maps
sentry-cli upload-sourcemap ./dist/public --url-prefix '/~/' --org easy-asphalt --project easy-asphalt --auth-token f34e30384bcb11f1b327c64fdd12ad4f
```

### Option 2: Upload via Sentry Dashboard

1. Go to https://sentry.io/projects/easy-asphalt/easy-asphalt/releases/
2. Create a new release
3. Upload your source maps manually

## Current Configuration

Your Sentry setup includes:

- ✅ DSN configured: `https://57f4e66333a9611af04d56f203acad1c@o4511361067974656.ingest.us.sentry.io/4511361068236800`
- ✅ Auth token: `f34e30384bcb11f1b327c64fdd12ad4f`
- ✅ Organization: `easy-asphalt`
- ✅ Project: `easy-asphalt`
- ✅ Environment: `development`
- ✅ Server-side: `@sentry/node` configured
- ✅ Client-side: `@sentry/react` configured

## Testing Without Source Maps

Even without source maps, Sentry will:
- ✅ Capture error messages
- ✅ Show stack traces (minified)
- ✅ Track performance metrics
- ✅ Record session replay

Source maps just make the stack traces more readable by showing actual file names and line numbers instead of minified code.

## Recommendation

For development, source maps are optional. For production, consider adding the `@sentry/vite-plugin` for automatic uploads.

## Next Steps

1. Test your current Sentry setup with the tRPC mutation:
   ```bash
   curl -X POST http://localhost:3000/api/trpc/sentryTest.triggerError \
     -H "Content-Type: application/json"
   ```

2. Check https://sentry.io/issues/ to see if the error appears

3. If source maps are important for production, add the Vite plugin