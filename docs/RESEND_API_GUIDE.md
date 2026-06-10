# Resend API Integration Guide

## Understanding the Code You Provided

```javascript
import { Resend } from 'resend';

const resend = new Resend('re_xxxxxxxxx');

resend.apiKeys.create({ name: 'Production' });
```

This code creates a new API key programmatically using an existing API key.

## How It Works

1. **Initialize Resend Client**: You create a Resend instance using an existing API key
2. **Create New API Key**: The `apiKeys.create()` method generates a new API key
3. **Returns**: The new API key that you can use for specific purposes

## Important Notes

⚠️ **Security Warning**: 
- Never hardcode API keys in your code
- Use environment variables for all API keys
- The API key used to create new keys should have proper permissions

## Installation

First, install the Resend SDK:

```bash
pnpm add resend
```

## Proper Implementation in Your Project

### 1. Add to Environment Variables

Add to your `.env` file:

```env
# Master Resend API key (used to create other keys)
RESEND_MASTER_API_KEY=re_your_master_key_here

# Application-specific Resend API key (created from master)
RESEND_API_KEY=re_your_app_key_here
```

### 2. Create a Utility Script

Create `server/scripts/create-resend-key.ts`:

```typescript
import { Resend } from 'resend';
import { ENV } from '../_core/env';

async function createApiKey() {
  if (!ENV.resendMasterApiKey) {
    throw new Error('RESEND_MASTER_API_KEY not configured');
  }

  const resend = new Resend(ENV.resendMasterApiKey);

  try {
    const result = await resend.apiKeys.create({
      name: 'Driveway Estimator Pro - Production',
    });

    console.log('API Key created successfully:');
    console.log('ID:', result.id);
    console.log('Key:', result.key);
    console.log('Name:', result.name);
    
    return result;
  } catch (error) {
    console.error('Failed to create API key:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createApiKey()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { createApiKey };
```

### 3. Using API Keys in Your Application

Your existing email service already uses Resend correctly. Here's how it works:

```typescript
// server/services/email.ts (your existing code)
async function sendEmail(notification: EmailNotification) {
  if (!ENV.resendApiKey) {
    console.info("[Email] RESEND_API_KEY not configured; mock email accepted");
    return { success: true, messageId: `mock_${Date.now()}` };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: ENV.emailFromAddress,
        to: [notification.to],
        subject: notification.subject,
        html: notification.html,
        text: notification.text,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.error("[Email] Resend API error:", response.status, errorBody);
      return { success: false };
    }

    const result = await response.json();
    return { success: true, messageId: result.id };
  } catch (error) {
    console.error("[Email] Failed to send email:", error);
    return { success: false };
  }
}
```

## Recommended Approach for Production

### Option 1: Manual Key Creation (Recommended)

1. **Sign up at resend.com**
2. **Create API key manually** in the dashboard:
   - Go to API Keys section
   - Click "Create API Key"
   - Name it "Driveway Estimator Pro - Production"
   - Copy the key
3. **Add to environment variables**:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxxx
   ```

### Option 2: Programmatic Key Creation

Use the script approach if you need to automate key creation:

```bash
# Run the script to create a new key
pnpm tsx server/scripts/create-resend-key.ts
```

## API Key Management Best Practices

### 1. Use Separate Keys for Different Environments

```env
# Development
RESEND_DEV_API_KEY=re_dev_key_here

# Staging  
RESEND_STAGING_API_KEY=re_staging_key_here

# Production
RESEND_PROD_API_KEY=re_prod_key_here
```

### 2. Set Key Permissions

When creating keys in Resend dashboard, you can set:
- **Scopes**: Limit what the key can do (email sending only, etc.)
- **Domains**: Restrict to specific domains
- **Expiration**: Set expiration dates for temporary keys

### 3. Rotate Keys Regularly

Create a rotation script:

```typescript
async function rotateApiKey() {
  // Create new key
  const newKey = await createApiKey();
  
  // Update environment variables
  // (This would need to be done manually or via deployment system)
  
  console.log('New key created. Update your environment variables.');
  console.log('New key:', newKey.key);
}
```

## Testing Your Resend Integration

### 1. Test with Mock Mode (Current Implementation)

Your current implementation already handles this:

```typescript
if (!ENV.resendApiKey) {
  console.info("[Email] RESEND_API_KEY not configured; mock email accepted");
  return { success: true, messageId: `mock_${Date.now()}` };
}
```

### 2. Test with Real Key

Once you have a real API key:

```bash
# Add to .env
echo "RESEND_API_KEY=re_your_real_key_here" >> .env

# Test email sending
# Your existing tests will now use real Resend API
```

### 3. Verify Email Delivery

Check:
- Resend dashboard logs
- Email spam folder
- Sender reputation (ensure your domain is authenticated)

## Domain Authentication

For production use, authenticate your domain:

### 1. Add DNS Records

In Resend dashboard:
1. Go to Domains
2. Add your domain (e.g., drivewayestimatorpro.com)
3. Add DNS records:
   - **SPF Record**: For sender verification
   - **DKIM Record**: For email authentication
   - **DMARC Record**: For policy specification

### 2. Update From Address

```env
EMAIL_FROM_ADDRESS=noreply@drivewayestimatorpro.com
```

## Monitoring and Analytics

Resend provides:
- Email delivery analytics
- Open/click tracking
- Bounce handling
- Spam reports

Access these in your Resend dashboard.

## Troubleshooting

### Common Issues

**1. API Key Not Working**
```bash
# Verify the key format
# Should start with "re_"
# Check it's not expired or revoked
```

**2. Emails Not Sending**
```bash
# Check domain authentication
# Verify from address is allowed
# Check rate limits
```

**3. Emails Going to Spam**
```bash
# Ensure domain is authenticated
# Check sender reputation
# Verify email content isn't spammy
```

## Security Best Practices

1. **Never commit API keys to git**
2. **Use environment variables for all keys**
3. **Rotate keys regularly**
4. **Use read-only keys where possible**
5. **Monitor API key usage**
6. **Set up alerts for unusual activity**

## Quick Start Checklist

- [ ] Sign up for Resend account
- [ ] Create API key in dashboard
- [ ] Add RESEND_API_KEY to .env
- [ ] Set EMAIL_FROM_ADDRESS
- [ ] Authenticate your domain (for production)
- [ ] Test email sending
- [ ] Monitor delivery in Resend dashboard

## Current Implementation Status

Your Driveway Estimator Pro project is already set up to use Resend:

✅ Email service implemented in `server/services/email.ts`
✅ Environment variables configured
✅ Mock mode for development
✅ Production-ready when API key is added
✅ Error handling and fallbacks

**Next Step**: Get a real Resend API key and add it to your `.env` file.

## Resources

- Resend Documentation: https://resend.com/docs
- Resend API Reference: https://resend.com/docs/api-reference/introduction
- Email Best Practices: https://resend.com/docs/guides/email-best-practices