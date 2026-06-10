import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env", quiet: true });
loadEnv({ path: ".env.local", override: true, quiet: true });

//  CRIT-01: Fail fast on missing / weak JWT_SECRET
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.trim().length < 32) {
  throw new Error(
    "[Startup] JWT_SECRET must be set to a random string of at least 32 characters. " +
      "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
  );
}

//  CRIT-04: Require DATABASE_URL in production
if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
  throw new Error("[Startup] DATABASE_URL must be set in production.");
}

export const ENV = {
  sessionAppId: process.env.APP_ID ?? process.env.VITE_APP_ID ?? "easy-asphalt",
  /** Never empty  validated above */
  cookieSecret: jwtSecret,
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  ownerEmail: process.env.OWNER_EMAIL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  //  HIGH-08: Gemini image generation
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiApiEndpoint:
    process.env.GEMINI_API_ENDPOINT ??
    "https://generativelanguage.googleapis.com",
  //  HIGH-08: direct Google Maps API key (no Forge proxy)
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? "",
  //  HIGH-08: direct OpenAI API key (Whisper transcription)
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  //  HIGH-08: S3 storage (replaces Forge storage proxy)
  s3Bucket: process.env.S3_BUCKET_NAME ?? "",
  //  HIGH-08: configurable LLM model
  llmModel: process.env.LLM_MODEL ?? "gemini-2.5-flash",
  llmMaxTokens: parseInt(process.env.LLM_MAX_TOKENS ?? "4096", 10),
  llmThinkingEnabled: process.env.LLM_THINKING_ENABLED === "true",
  llmThinkingBudget: parseInt(process.env.LLM_THINKING_BUDGET ?? "128", 10),
  //  CRIT-02: Resend email config
  resendMasterApiKey: process.env.RESEND_MASTER_API_KEY ?? "",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  emailFromAddress:
    process.env.EMAIL_FROM_ADDRESS ?? "noreply@easy-asphalt-driveway.store",
  //  Performance monitoring and error tracking
  sentryDsn: process.env.SENTRY_DSN ?? "",
  sentryEnvironment: process.env.SENTRY_ENVIRONMENT ?? "development",
};
