// Quick script to check existing Supabase Storage Buckets
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xcdzugnjzrkngzmtzeip.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjZHp1Z25qenJrbmd6bXR6ZWlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODczNjg2MCwiZXhwIjoyMDc0MzEyODYwfQ.OwORmN9NABGIN2QJgyUQzZkyAks2XDHAWA8rerbFFjc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBuckets() {
  console.log('🔍 Checking Supabase Storage Buckets...\n');

  const { data: buckets, error } = await supabase.storage.listBuckets();

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  if (!buckets || buckets.length === 0) {
    console.log('⚠️  No buckets found!');
    return;
  }

  console.log(`✅ Found ${buckets.length} bucket(s):\n`);

  for (const bucket of buckets) {
    console.log(`📦 ${bucket.name}`);
    console.log(`   ID: ${bucket.id}`);
    console.log(`   Public: ${bucket.public}`);
    console.log(`   Created: ${bucket.created_at}`);

    // Try to get file count
    const { data: files, error: filesError } = await supabase
      .storage
      .from(bucket.name)
      .list('', { limit: 1000 });

    if (filesError) {
      console.log(`   Files: ❌ ${filesError.message}`);
    } else {
      const totalSize = files.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);
      console.log(`   Files: ${files.length}`);
      console.log(`   Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    }
    console.log('');
  }
}

checkBuckets();
