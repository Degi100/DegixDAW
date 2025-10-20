const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugFriendListAvatars() {
  console.log('=== Debugging FriendList Avatars ===\n');

  // Check all profiles with avatar_url
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url')
    .order('username');

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log('All Users in DB:\n');
  profiles.forEach(p => {
    const hasAvatar = p.avatar_url ? '✅ HAS AVATAR' : '❌ NO AVATAR';
    console.log(`${hasAvatar} - ${p.username || 'no-username'} (${p.full_name})`);
    if (p.avatar_url) {
      console.log(`  URL: ${p.avatar_url}`);
    }
    console.log('');
  });

  // Specifically check "admin" user
  const admin = profiles.find(p => p.username === 'admin');
  if (admin) {
    console.log('\n=== ADMIN User Details ===');
    console.log('Username:', admin.username);
    console.log('Full Name:', admin.full_name);
    console.log('Avatar URL:', admin.avatar_url || 'NULL');

    if (admin.avatar_url) {
      console.log('\n✅ Admin HAS avatar_url in database!');
      console.log('Testing if URL is accessible...');

      // Test if URL works
      const response = await fetch(admin.avatar_url).catch(e => ({ ok: false, error: e.message }));
      if (response.ok) {
        console.log('✅ Avatar URL is accessible!');
      } else {
        console.log('❌ Avatar URL NOT accessible!', response.error || response.status);
      }
    }
  }
}

debugFriendListAvatars();
