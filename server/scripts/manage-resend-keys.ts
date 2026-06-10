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