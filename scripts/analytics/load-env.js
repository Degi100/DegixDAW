/**
 * Load environment variables from .env or .env.local
 */
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const envLocalPath = resolve(__dirname, '../../.env.local');
const envPath = resolve(__dirname, '../../.env');

// Try .env.local first, then .env
const filePath = existsSync(envLocalPath) ? envLocalPath : envPath;

try {
  const envFile = readFileSync(filePath, 'utf-8');
  const lines = envFile.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').trim();
      if (key && value) {
        process.env[key.trim()] = value;
      }
    }
  }

  const fileName = filePath.includes('.env.local') ? '.env.local' : '.env';
  console.log(`✅ Environment variables loaded from ${fileName}`);
} catch (error) {
  console.warn('⚠️  Could not load environment file:', error.message);
  console.warn('Make sure .env or .env.local exists with required variables.');
}
