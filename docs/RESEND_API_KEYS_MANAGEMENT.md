# Resend API Keys Management Guide

## List API Keys Method

The `resend.apiKeys.list()` method retrieves all API keys associated with your Resend account.

## Basic Usage

```javascript
import { Resend } from 'resend';

const resend = new Resend('re_xxxxxxxxx');

// List all API keys
const keys = await resend.apiKeys.list();

console.log(keys);
```

## Response Format

```javascript
{
  "data": [
    {
      "id": "key_id_1",
      "name": "Production Key",
      "key": "re_...", // Only shown when first created
      "created_at": "2024-01-15T10:30:00.000Z",
    },
    {
      "id": "key_id_2", 
      "name": "Development Key",
      "key": null, // Not shown after creation for security
      "created_at": "2024-01-10T08:00:00.000Z",
    }
  ]
}
```

## Integration in Your Project

### 1. Add Management Script

Create `server/scripts/manage-resend-keys.ts`:

```typescript
import { Resend } from 'resend';
import { ENV } from '../_core/env';

export async function listApiKeys() {
  if (!ENV.resendMasterApiKey) {
    throw new Error('RESEND_MASTER_API_KEY not configured');
  }

  const resend = new Resend(ENV.resendMasterApiKey);

  try {
    const result = await resend.apiKeys.list();
    
    console.log('API Keys:');
    console.log('Total:', result.data?.length || 0);
    
    if (result.data) {
      result.data.forEach((key, index) => {
        console.log(`\n${index + 1}. ${key.name}`);
        console.log('   ID:', key.id);
        console.log('   Key:', key.key || '(Hidden - shown only on creation)');
        console.log('   Created:', key.created_at);
      });
    }
    
    return result;
  } catch (error) {
    console.error('Failed to list API keys:', error);
    throw error;
  }
}

export async function createApiKey(name: string) {
  if (!ENV.resendMasterApiKey) {
    throw new Error('RESEND_MASTER_API_KEY not configured');
  }

  const resend = new Resend(ENV.resendMasterApiKey);

  try {
    const result = await resend.apiKeys.create({ name });
    
    console.log('API Key created successfully:');
    console.log('Name:', result.name);
    console.log('ID:', result.id);
    console.log('Key:', result.key); // This is the only time you'll see the full key!
    console.log('Created:', result.created_at);
    
    return result;
  } catch (error) {
    console.error('Failed to create API key:', error);
    throw error;
  }
}

export async function deleteApiKey(keyId: string) {
  if (!ENV.resendMasterApiKey) {
    throw new Error('RESEND_MASTER_API_KEY not configured');
  }

  const resend = new Resend(ENV.resendMasterApiKey);

  try {
    const result = await resend.apiKeys.remove(keyId);
    
    console.log('API Key deleted successfully:', keyId);
    
    return result;
  } catch (error) {
    console.error('Failed to delete API key:', error);
    throw error;
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  try {
    switch (command) {
      case 'list':
        await listApiKeys();
        break;
      case 'create':
        const name = args[0] || 'Default API Key';
        await createApiKey(name);
        break;
      case 'delete':
        const keyId = args[0];
        if (!keyId) {
          throw new Error('Key ID required for delete command');
        }
        await deleteApiKey(keyId);
        break;
      default:
        console.log('Usage:');
        console.log('  pnpm tsx server/scripts/manage-resend-keys.ts list');
        console.log('  pnpm tsx server/scripts/manage-resend-keys.ts create <name>');
        console.log('  pnpm tsx server/scripts/manage-resend-keys.ts delete <key-id>');
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
```

### 2. Add Package.json Scripts

Add to your `package.json` scripts section:

```json
{
  "scripts": {
    "resend:keys:list": "tsx server/scripts/manage-resend-keys.ts list",
    "resend:keys:create": "tsx server/scripts/manage-resend-keys.ts create",
    "resend:keys:delete": "tsx server/scripts/manage-resend-keys.ts delete"
  }
}
```

### 3. Usage Examples

```bash
# List all API keys
pnpm resend:keys:list

# Create a new API key
pnpm resend:keys:create "Development Key"

# Create production key
pnpm resend:keys:create "Production - Driveway Estimator Pro"

# Delete an API key (use the ID from list command)
pnpm resend:keys:create "key_id_here"
```

## Advanced Usage

### Filter Keys by Name

```typescript
async function findKeyByName(name: string) {
  const keys = await listApiKeys();
  
  if (keys.data) {
    const foundKey = keys.data.find(key => 
      key.name.toLowerCase().includes(name.toLowerCase())
    );
    
    if (foundKey) {
      console.log('Found key:', foundKey);
      return foundKey;
    }
  }
  
  console.log('No key found with name:', name);
  return null;
}
```

### Rotate API Keys

```typescript
async function rotateApiKey(oldKeyId: string, newKeyName: string) {
  console.log('Rotating API key...');
  
  // Create new key
  const newKey = await createApiKey(newKeyName);
  
  // Delete old key
  await deleteApiKey(oldKeyId);
  
  console.log('Rotation complete. New key:', newKey.key);
  console.log('⚠️ Update your environment variables with the new key!');
  
  return newKey;
}
```

### Key Health Check

```typescript
async function validateApiKey(apiKey: string) {
  try {
    const resend = new Resend(apiKey);
    
    // Try a simple API call to validate
    const keys = await resend.apiKeys.list();
    
    console.log('✅ API key is valid');
    return true;
  } catch (error) {
    console.log('❌ API key is invalid or expired');
    return false;
  }
}
```

## Security Best Practices

### 1. Store Keys Securely

Never store the full API key in your code after creation:

```typescript
// ❌ BAD - storing key in code
const myKey = 're_xxxxxxxxxxxxxx';

// ✅ GOOD - use environment variables
const myKey = process.env.RESEND_API_KEY;
```

### 2. Use Key Prefixes for Identification

```typescript
async function createEnvironmentKey(environment: 'dev' | 'staging' | 'prod') {
  const appName = 'Driveway Estimator Pro';
  const keyName = `${appName} - ${environment.toUpperCase()}`;
  
  return await createApiKey(keyName);
}
```

### 3. Implement Key Expiration

```typescript
async function createTemporaryKey(name: string, expiresInDays: number) {
  const key = await createApiKey(`${name} (Temporary - ${expiresInDays} days)`);
  
  // Schedule deletion
  setTimeout(async () => {
    await deleteApiKey(key.id);
    console.log('Temporary key deleted:', key.id);
  }, expiresInDays * 24 * 60 * 60 * 1000);
  
  return key;
}
```

## Monitoring and Auditing

### Audit Log

```typescript
async function auditKeys() {
  const keys = await listApiKeys();
  
  console.log('=== API Key Audit ===');
  console.log('Total Keys:', keys.data?.length || 0);
  
  if (keys.data) {
    const now = new Date();
    
    keys.data.forEach(key => {
      const created = new Date(key.created_at);
      const ageInDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      
      console.log(`\n${key.name}`);
      console.log(`  Age: ${ageInDays} days`);
      
      if (ageInDays > 90) {
        console.log('  ⚠️ Warning: Key is older than 90 days');
      }
      
      if (ageInDays > 180) {
        console.log('  🚨 Critical: Key should be rotated');
      }
    });
  }
}
```

### Usage Monitoring

While Resend doesn't provide per-key usage directly, you can:
1. Monitor email send volume in dashboard
2. Set up alerts for unusual activity
3. Use separate keys for different environments

## Troubleshooting

### Common Issues

**1. Empty Key List**
```bash
# Check if master key is valid
pnpm resend:keys:list

# If empty, verify RESEND_MASTER_API_KEY is correct
# Check account permissions in Resend dashboard
```

**2. Permission Errors**
```typescript
// Ensure your master key has proper permissions
// Some actions may require account admin access
```

**3. Key Not Visible After Creation**
```javascript
// This is normal - keys are only shown once upon creation
// Save the key immediately when it's returned
const result = await resend.apiKeys.create({ name: 'My Key' });
console.log('SAVE THIS KEY:', result.key); // Only chance to see it!
```

## Practical Use Cases

### 1. Environment Setup

```bash
# Create keys for each environment
pnpm resend:keys:create "Development"
pnpm resend:keys:create "Staging" 
pnpm resend:keys:create "Production"

# Add each to respective environment variables
```

### 2. Temporary Access

```typescript
// Create key for contractor with 7-day expiration
const tempKey = await createTemporaryKey('Contractor Access', 7);
console.log('Temporary key:', tempKey.key);
console.log('Expires in 7 days');
```

### 3. Incident Response

```typescript
async function compromiseResponse() {
  // 1. List all keys
  const keys = await listApiKeys();
  
  // 2. Identify potentially compromised key
  const compromisedKey = keys.data?.find(k => k.name.includes('suspicious'));
  
  // 3. Delete compromised key
  if (compromisedKey) {
    await deleteApiKey(compromisedKey.id);
  }
  
  // 4. Create new keys
  await createApiKey('Replacement Key');
  
  // 5. Rotate all environment variables
  console.log('⚠️ Update all environment variables!');
}
```

## Integration with Existing Code

Your current email service doesn't need changes. It will continue using `RESEND_API_KEY` from environment variables:

```typescript
// server/services/email.ts (no changes needed)
const response = await fetch("https://api.resend.com/emails", {
  headers: {
    Authorization: `Bearer ${ENV.resendApiKey}`, // Uses regular app key
  },
  // ...
});
```

The key management scripts are separate tools for DevOps/administrative tasks.

## Quick Reference

```typescript
// List all keys
await resend.apiKeys.list();

// Create new key (returns key - save it!)
await resend.apiKeys.create({ name: 'My Key' });

// Delete key by ID
await resend.apiKeys.remove('key_id');
```

## When to Use These Methods

**Use list() when:**
- Auditing your API keys
- Checking for old/unused keys
- Planning key rotation
- Troubleshooting key issues

**Use create() when:**
- Setting up new environments
- Rotating compromised keys
- Creating temporary access
- Onboarding new services

**Use remove() when:**
- Key rotation
- Removing temporary access
- Cleaning up unused keys
- Security incident response

## Automation Examples

### Monthly Key Rotation

```typescript
// Run monthly via cron job
async function monthlyRotation() {
  const keys = await listApiKeys();
  
  if (keys.data) {
    for (const key of keys.data) {
      const age = getKeyAgeInDays(key.created_at);
      
      if (age > 90) {
        console.log(`Rotating old key: ${key.name}`);
        await rotateApiKey(key.id, `${key.name} (Rotated)`);
      }
    }
  }
}
```

### Automatic Cleanup

```typescript
async function cleanupOldKeys() {
  const keys = await listApiKeys();
  
  if (keys.data) {
    for (const key of keys.data) {
      const age = getKeyAgeInDays(key.created_at);
      
      if (age > 365 && !key.name.includes('permanent')) {
        console.log(`Deleting old key: ${key.name}`);
        await deleteApiKey(key.id);
      }
    }
  }
}
```

This gives you complete control over your Resend API keys with both manual and automated management options!