import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data, error } = await supabase
  .from('project_snapshots')
  .select('snapshot_date, total_loc, typescript_loc, javascript_loc, cpp_loc, other_loc')
  .order('snapshot_date', { ascending: false })
  .limit(3);

if (error) {
  console.error('Error:', error);
} else {
  console.log('Latest 3 snapshots:');
  console.table(data);
  
  if (data.length > 0) {
    const latest = data[0];
    console.log('\n📊 Latest snapshot analysis:');
    console.log(`Total LOC: ${latest.total_loc}`);
    console.log(`TypeScript: ${latest.typescript_loc || 0}`);
    console.log(`JavaScript: ${latest.javascript_loc || 0}`);
    console.log(`C++: ${latest.cpp_loc || 0}`);
    console.log(`Other: ${latest.other_loc || 'NULL/MISSING'}`);
    
    const sum = (latest.typescript_loc || 0) + 
                (latest.javascript_loc || 0) + 
                (latest.cpp_loc || 0) + 
                (latest.other_loc || 0);
    
    console.log(`\nSum of languages: ${sum}`);
    console.log(`Missing: ${latest.total_loc - sum} LOC`);
  }
}
