#!/usr/bin/env node
// scripts/db/execute-sql.js
// Execute SQL scripts using Service Role Key

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing credentials in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function executeSQLFile(filePath) {
  try {
    console.log(`\n📄 Reading ${filePath}...`);
    const sql = readFileSync(filePath, 'utf-8');
    
    // Split by semicolons and filter out comments
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`\n🔄 Executing ${statements.length} SQL statements...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      
      // Skip empty or comment-only statements
      if (!stmt || stmt.length < 10) continue;

      try {
        // Execute using rpc or direct query
        const { error } = await supabase.rpc('exec_sql', { sql_query: stmt });
        
        if (error) {
          // Try alternative: use .from() for table operations
          console.log(`⚠️  Statement ${i + 1} needs manual execution`);
          errorCount++;
        } else {
          successCount++;
          process.stdout.write('✅ ');
        }
      } catch (err) {
        console.log(`\n❌ Error on statement ${i + 1}:`, err.message);
        errorCount++;
      }
    }

    console.log(`\n\n📊 Results:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    
    if (errorCount > 0) {
      console.log(`\n⚠️  Some statements failed. Please execute the SQL manually in Supabase SQL Editor:`);
      console.log(`   🔗 https://supabase.com/dashboard/project/_/sql\n`);
    } else {
      console.log(`\n🎉 All statements executed successfully!\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Get file path from command line
const filePath = process.argv[2];

if (!filePath) {
  console.error('❌ Usage: node execute-sql.js <path-to-sql-file>');
  process.exit(1);
}

executeSQLFile(filePath);
