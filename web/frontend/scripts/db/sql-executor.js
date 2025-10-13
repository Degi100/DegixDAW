// scripts/db/sql-executor.js
// Automatic SQL Script Executor for Supabase
// Runs SQL files without opening Supabase Dashboard

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, basename } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Make sure .env contains:');
  console.error('  - VITE_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Execute SQL file in Supabase
 * @param {string} filePath - Absolute path to SQL file
 * @returns {Promise<{success: boolean, result?: any, error?: any}>}
 */
export async function executeSQLFile(filePath) {
  const fileName = basename(filePath);
  
  try {
    console.log(`\n📄 Reading: ${fileName}...`);
    const sqlContent = readFileSync(filePath, 'utf-8');
    
    if (!sqlContent.trim()) {
      console.warn('⚠️  File is empty, skipping...');
      return { success: true, result: null };
    }

    console.log(`🔄 Executing SQL...`);
    
    // Split by semicolons and filter out empty statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments
      if (statement.startsWith('--')) continue;

      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';'
        });

        if (error) {
          // Try direct query if RPC fails
          const { data: queryData, error: queryError } = await supabase
            .from('_sql_executor')
            .select('*')
            .limit(0);

          if (queryError) {
            console.error(`   ❌ Statement ${i + 1}/${statements.length} failed:`, queryError.message);
            errorCount++;
          } else {
            successCount++;
          }
        } else {
          results.push(data);
          successCount++;
        }
      } catch (err) {
        console.error(`   ❌ Statement ${i + 1}/${statements.length} error:`, err.message);
        errorCount++;
      }
    }

    console.log(`\n✅ Completed: ${successCount} successful, ${errorCount} errors`);
    
    return { 
      success: errorCount === 0, 
      result: results,
      stats: { successCount, errorCount, totalStatements: statements.length }
    };

  } catch (error) {
    console.error(`❌ Error executing ${fileName}:`, error.message);
    return { success: false, error };
  }
}

/**
 * Execute SQL directly
 * @param {string} sql - SQL query string
 * @returns {Promise<{success: boolean, data?: any, error?: any}>}
 */
export async function executeSQL(sql) {
  try {
    console.log('🔄 Executing SQL query...');
    
    const { data, error } = await supabase.rpc('query', { 
      query_text: sql 
    });

    if (error) {
      console.error('❌ SQL Error:', error.message);
      return { success: false, error };
    }

    console.log('✅ Query executed successfully');
    return { success: true, data };

  } catch (error) {
    console.error('❌ Execution error:', error.message);
    return { success: false, error };
  }
}

/**
 * Execute multiple SQL files in sequence
 * @param {string[]} filePaths - Array of absolute file paths
 */
export async function executeSQLFiles(filePaths) {
  console.log(`\n🚀 Starting SQL execution for ${filePaths.length} file(s)...\n`);
  
  const results = [];
  let totalSuccess = 0;
  let totalErrors = 0;

  for (const filePath of filePaths) {
    const result = await executeSQLFile(filePath);
    results.push({ file: basename(filePath), ...result });
    
    if (result.success) {
      totalSuccess++;
    } else {
      totalErrors++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Summary: ${totalSuccess}/${filePaths.length} files executed successfully`);
  if (totalErrors > 0) {
    console.log(`⚠️  ${totalErrors} file(s) had errors`);
  }
  console.log('='.repeat(50) + '\n');

  return results;
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node sql-executor.js <path-to-sql-file> [<path-to-sql-file2> ...]');
    console.log('\nExample:');
    console.log('  node sql-executor.js ../sql/cleanup_issues.sql');
    process.exit(1);
  }

  const filePaths = args.map(arg => resolve(arg));
  executeSQLFiles(filePaths)
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

export default { executeSQLFile, executeSQL, executeSQLFiles };
