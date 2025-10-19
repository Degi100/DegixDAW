#!/usr/bin/env node
// ============================================
// DEBUG: BPM Detection & Display
// ============================================
// Tests if BPM column exists and shows track BPM values

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugBPM() {
  console.log('🔍 BPM Debug Report\n');
  console.log('='.repeat(60));

  // 1. Check if BPM column exists in tracks table
  console.log('\n1️⃣ Checking Database Schema...\n');

  const { data: columns, error: schemaError } = await supabase
    .from('tracks')
    .select('*')
    .limit(1);

  if (schemaError) {
    console.error('❌ Error querying tracks:', schemaError.message);
    return;
  }

  const hasBPMColumn = columns && columns.length > 0 && 'bpm' in columns[0];

  if (hasBPMColumn) {
    console.log('✅ BPM column exists in tracks table');
  } else {
    console.log('❌ BPM column MISSING in tracks table');
    console.log('   → Run Migration 007 in Supabase SQL Editor!');
    console.log('   → File: docs/architecture/migrations/007_add_bpm_to_tracks.sql');
    return;
  }

  // 2. Get all tracks and show BPM status
  console.log('\n2️⃣ Checking Existing Tracks...\n');

  const { data: tracks, error: tracksError } = await supabase
    .from('tracks')
    .select('id, name, track_type, bpm, created_at')
    .order('created_at', { ascending: false });

  if (tracksError) {
    console.error('❌ Error fetching tracks:', tracksError.message);
    return;
  }

  if (!tracks || tracks.length === 0) {
    console.log('⚠️  No tracks found in database');
    console.log('   → Upload an audio file to test BPM detection');
    return;
  }

  console.log(`Found ${tracks.length} track(s):\n`);

  let tracksWithBPM = 0;
  let tracksWithoutBPM = 0;

  tracks.forEach((track, index) => {
    const hasBPM = track.bpm !== null && track.bpm !== undefined;
    const icon = hasBPM ? '✅' : '❌';
    const bpmText = hasBPM ? `${track.bpm} BPM` : 'NO BPM';

    console.log(`${icon} [${index + 1}] ${track.name}`);
    console.log(`    Type: ${track.track_type.toUpperCase()}`);
    console.log(`    BPM: ${bpmText}`);
    console.log(`    Created: ${new Date(track.created_at).toLocaleString()}`);
    console.log('');

    if (hasBPM) {
      tracksWithBPM++;
    } else {
      tracksWithoutBPM++;
    }
  });

  // 3. Summary
  console.log('='.repeat(60));
  console.log('\n📊 Summary:\n');
  console.log(`   Total Tracks: ${tracks.length}`);
  console.log(`   ✅ With BPM: ${tracksWithBPM}`);
  console.log(`   ❌ Without BPM: ${tracksWithoutBPM}`);

  if (tracksWithoutBPM > 0) {
    console.log('\n💡 Tracks without BPM were uploaded BEFORE BPM detection was added.');
    console.log('   → Upload a NEW audio file to see BPM detection in action!');
  }

  if (tracksWithBPM > 0) {
    console.log('\n✅ BPM Detection is working!');
    console.log('   → Check frontend: AudioPlayer should show "• 128 BPM" in track info');
  }

  console.log('\n='.repeat(60));
}

debugBPM().catch(console.error);
