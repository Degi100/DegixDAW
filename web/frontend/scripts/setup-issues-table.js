#!/usr/bin/env node
// scripts/setup-issues-table.js
// Automatically runs the issues table setup SQL script in Supabase

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
config({ path: join(__dirname, '..', '.env') });

// Read environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://xcdzugnjzrkngzmtzeip.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  console.error('❌ Error: VITE_SUPABASE_ANON_KEY not found in environment');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function setupIssuesTable() {
  console.log('🚀 Starting Issues Table Setup...\n');

  try {
    // Read SQL file
    const sqlPath = join(__dirname, '..', 'issues_table_setup.sql');
    const sqlContent = readFileSync(sqlPath, 'utf8');

    console.log('📄 SQL file loaded');
    console.log('📊 Database:', SUPABASE_URL);
    console.log('\n⚠️  WARNING: This script uses the anon key and may not have permissions');
    console.log('   to create tables. You need to run this SQL in the Supabase Dashboard:\n');
    console.log('   1. Go to: https://supabase.com/dashboard/project/xcdzugnjzrkngzmtzeip/sql');
    console.log('   2. Copy content from: issues_table_setup.sql');
    console.log('   3. Click "Run"\n');

    // Check if table already exists
    const { data, error } = await supabase
      .from('issues')
      .select('count')
      .limit(1);

    if (!error) {
      console.log('✅ Issues table already exists!');
      
      // Get count
      const { count } = await supabase
        .from('issues')
        .select('*', { count: 'exact', head: true });
      
      console.log(`📊 Current issues count: ${count || 0}`);
      
      if (count && count > 0) {
        console.log('\n🎉 Issues are already set up!');
        console.log('   Run: npm run dev');
        console.log('   Visit: http://localhost:5173/admin/issues');
      } else {
        console.log('\n⚠️  Table exists but is empty. You may need to run the seed data part of the SQL.');
      }
    } else {
      console.log('❌ Issues table does not exist yet');
      console.log('\n📝 Next steps:');
      console.log('   1. Open Supabase Dashboard SQL Editor');
      console.log('   2. Run the issues_table_setup.sql script');
      console.log('   3. Run this script again to verify\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run setup
setupIssuesTable();
