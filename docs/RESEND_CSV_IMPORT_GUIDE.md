# Resend API Keys CSV Import Guide

This guide shows you how to import and manage your Resend API keys from a CSV file.

## Your CSV Structure

Your CSV file contains these columns:
- `id` - Unique identifier for the key
- `created` - Creation timestamp
- `name` - Name/label for the key
- `token` - The actual API key (starts with `re_`)
- `domain` - Associated domain
- `permissions` - Key permissions
- `creater` - Who created the key

## Usage

### Basic Commands

```bash
# Display all keys from CSV
pnpm resend:csv:import yourfile.csv list

# Validate all keys (check if they work)
pnpm resend:csv:import yourfile.csv validate

# Get suggestions for environment variables
pnpm resend:csv:import yourfile.csv env

# See database import schema
pnpm resend:csv:import yourfile.csv import

# Run all operations
pnpm resend:csv:import yourfile.csv all
```

## What Each Action Does

### 1. List Keys
Shows all keys from your CSV with their details:
```bash
pnpm resend:csv:import yourfile.csv list
```

**Output:**
```
=== Resend API Keys from CSV ===

Total keys: 5

1. Production Key
   ID: key_123
   Token: re_xxxxxxxxxxxxxxxx...
   Domain: drivewayestimatorpro.com
   Permissions: full
   Created: 2024-01-15T10:30:00.000Z
   Creator: admin
```

### 2. Validate Keys
Tests each key against the Resend API to verify they work:
```bash
pnpm resend:csv:import yourfile.csv validate
```

**Output:**
```
=== Validating API Keys ===

❌ Key re_xxxxxxx... is invalid
Key: Old Key
Status: ❌ Invalid
Domain: example.com
Permissions: limited

✅ Key re_yyyyyyy... is valid
Key: Production Key
Status: ✅ Valid
Domain: drivewayestimatorpro.com
Permissions: full
```

### 3. Environment Suggestions
Suggests which keys to use for your environment variables:
```bash
pnpm resend:csv:import yourfile.csv env
```

**Output:**
```
=== Suggested Environment Variable Updates ===

Production key found:
RESEND_API_KEY=re_production_key_here
RESEND_MASTER_API_KEY=re_production_key_here

Development key found:
RESEND_DEV_API_KEY=re_dev_key_here
```

### 4. Database Import Schema
Shows the database schema needed to store keys:
```bash
pnpm resend:csv:import yourfile.csv import
```

### 5. All Operations
Runs everything at once:
```bash
pnpm resend:csv:import yourfile.csv all
```

## Quick Start Example

### Step 1: Check Your Keys
```bash
# List all keys from your CSV
pnpm resend:csv:import resend_keys.csv list
```

### Step 2: Validate Keys
```bash
# Test which keys are still valid
pnpm resend:csv:import resend_keys.csv validate
```

### Step 3: Update Environment
```bash
# Get suggestions for which keys to use
pnpm resend:csv:import resend_keys.csv env

# Then manually update your .env file with the suggested keys
```

## Manual CSV Import to Environment

After running the env command, manually update your `.env`:

```env
# From CSV suggestions
RESEND_API_KEY=re_your_selected_key_here
RESEND_MASTER_API_KEY=re_your_master_key_here
```

## Database Integration

### Create Database Schema

To permanently store your keys, create a new table:

```sql
CREATE TABLE resend_keys (
  id VARCHAR(255) PRIMARY KEY,
  created TIMESTAMP,
  name VARCHAR(255),
  token TEXT,  -- Encrypt this in production
  domain VARCHAR(255),
  permissions VARCHAR(255),
  creator VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  environment ENUM('dev', 'staging', 'prod'),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Import Script Enhancement

Enhanced import with database:

```typescript
async function importToDatabase(keys: ResendKey[]): Promise<void> {
  for (const key of keys) {
    await db.insert resend_keys values {
      id: key.id,
      created: new Date(key.created),
      name: key.name,
      token: encrypt(key.token), // Encrypt sensitive data
      domain: key.domain,
      permissions: key.permissions,
      creator: key.creater,
      is_active: true,
    };
  }
}
```

## Security Best Practices

### 1. Never Store Plain Text Tokens

```typescript
// ❌ BAD
token: key.token

// ✅ GOOD - Encrypt tokens
token: encrypt(key.token)
```

### 2. Use Environment Variables for App Keys

```env
# Store the active key in environment
RESEND_API_KEY=re_current_key
```

### 3. Rotate Keys Regularly

```bash
# Use the management script to create new keys
pnpm resend:keys:create "New Production Key"

# Then update your CSV and environment
```

### 4. Limit Key Permissions

Create keys with minimal required permissions:
- Read-only for dashboard access
- Send-only for email operations
- Full access only for master keys

## Advanced Usage

### Filter Keys by Environment

```typescript
function getKeysByEnvironment(keys: ResendKey[], env: string): ResendKey[] {
  return keys.filter(key => 
    key.name.toLowerCase().includes(env.toLowerCase())
  );
}

// Usage
const prodKeys = getKeysByEnvironment(keys, 'prod');
const devKeys = getKeysByEnvironment(keys, 'dev');
```

### Find Expired Keys

```typescript
function findOldKeys(keys: ResendKey[], daysOld: number = 90): ResendKey[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return keys.filter(key => {
    const created = new Date(key.created);
    return created < cutoffDate;
  });
}

// Usage
const oldKeys = findOldKeys(keys, 90);
console.log('Keys older than 90 days:', oldKeys.length);
```

### Key Activity Tracking

```typescript
interface KeyUsage {
  keyId: string;
  lastUsed: Date;
  usageCount: number;
}

async function trackKeyUsage(keyId: string): Promise<void> {
  // Update usage tracking in database
  await db.update resend_keys 
    set { lastUsed = new Date(), usageCount = usageCount + 1 }
    where { id: keyId };
}
```

## Troubleshooting

### CSV Not Found

```bash
# Make sure your CSV is in the Downloads folder
# On Linux/Mac: ~/Downloads/yourfile.csv
# On Windows: C:\Users\YourName\Downloads\yourfile.csv
```

### Invalid Keys

If validation shows keys as invalid:
```bash
# Check if keys were revoked in Resend dashboard
# Verify the token format (should start with re_)
# Check if keys have expired
```

### Permission Denied

```bash
# Make sure you can read the Downloads folder
# Check file permissions
ls -l ~/Downloads/yourfile.csv
```

## Automation Examples

### Daily Key Validation

```typescript
// Create a cron job to validate keys daily
async function dailyKeyValidation() {
  const keys = readCSVFromDownloads('resend_keys.csv');
  const invalidKeys = [];
  
  for (const key of keys) {
    const isValid = await validateKey(key.token);
    if (!isValid) {
      invalidKeys.push(key);
    }
  }
  
  if (invalidKeys.length > 0) {
    console.log('⚠️ Invalid keys found:', invalidKeys.length);
    // Send alert or create incident
  }
}
```

### Automatic Key Rotation

```typescript
async function automaticKeyRotation() {
  // Find keys older than 90 days
  const oldKeys = findOldKeys(keys, 90);
  
  for (const oldKey of oldKeys) {
    // Create replacement key
    const newKey = await createApiKey(`${oldKey.name} (Rotated)`);
    
    // Update database
    await updateKeyInDatabase(oldKey.id, newKey);
    
    // Delete old key
    await deleteApiKey(oldKey.id);
  }
}
```

## CSV File Location

The script looks for CSV files in:
- **Linux/Mac**: `~/Downloads/yourfile.csv`
- **Windows**: `C:\Users\YourName\Downloads\yourfile.csv`

If your file is elsewhere, either:
1. Move it to Downloads, or
2. Modify the script to use a different path

## Quick Reference

```bash
# List keys
pnpm resend:csv:import filename.csv list

# Validate keys  
pnpm resend:csv:import filename.csv validate

# Environment suggestions
pnpm resend:csv:import filename.csv env

# Database schema
pnpm resend:csv:import filename.csv import

# Everything
pnpm resend:csv:import filename.csv all
```

## Integration with Existing System

Your existing email service will continue using the environment variable:
```typescript
// server/services/email.ts - no changes needed
const response = await fetch("https://api.resend.com/emails", {
  headers: {
    Authorization: `Bearer ${ENV.resendApiKey}`, // From .env
  },
  // ...
});
```

The CSV import helps you:
1. See all your available keys
2. Choose the right key for each environment
3. Validate keys before using them
4. Organize your key management

## Next Steps

1. **Test with your CSV**:
   ```bash
   pnpm resend:csv:import yourfile.csv list
   ```

2. **Validate your keys**:
   ```bash
   pnpm resend:csv:import yourfile.csv validate
   ```

3. **Update your environment**:
   ```bash
   pnpm resend:csv:import yourfile.csv env
   # Then update .env with suggested keys
   ```

4. **Consider database storage** for better key management

This gives you complete control over your Resend API keys from CSV import!