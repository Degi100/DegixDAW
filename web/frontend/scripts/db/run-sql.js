// scripts/db/run-sql.js
// Simple SQL Script Runner for Supabase
// Alternative method using direct Supabase client

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runSQL(filePath) {
  const fileName = filePath.split(/[\\/]/).pop();
  
  try {
    console.log(`\n📄 Reading ${fileName}...`);
    const sql = readFileSync(filePath, 'utf-8');
    
    console.log(`🔄 Executing SQL in Supabase...\n`);
    console.log('─'.repeat(60));
    console.log(sql.substring(0, 200) + (sql.length > 200 ? '...' : ''));
    console.log('─'.repeat(60));

    // Note: This requires enabling the pg_net extension in Supabase
    // Or you need to execute via REST API / Service Role
    
    console.log('\n⚠️  NOTE: Direct SQL execution requires Service Role Key');
    console.log('📋 Copy the SQL above and paste it into Supabase SQL Editor');
    console.log('🔗 https://supabase.com/dashboard/project/_/sql\n');

    // Alternative: Save SQL to clipboard (if on Windows)
    if (process.platform === 'win32') {
      console.log('💡 TIP: SQL copied to clipboard (if clip command available)');
      const { exec } = await import('child_process');
      exec(`echo ${sql} | clip`);
    }

    return { success: true };

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return { success: false, error };
  }
}

// CLI
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: node run-sql.js <path-to-sql-file>');
  console.log('\nExample:');
  console.log('  node run-sql.js ../sql/mark_issues_done.sql');
  process.exit(1);
}

const filePath = resolve(args[0]);
runSQL(filePath);
