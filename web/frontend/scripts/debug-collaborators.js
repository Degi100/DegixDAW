const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

(async () => {
  // Test: Get a project's collaborators
  const { data: collabs } = await supabase
    .from('project_collaborators')
    .select('*')
    .limit(3);

  console.log('\n=== COLLABORATORS ===');
  console.log(JSON.stringify(collabs, null, 2));

  if (collabs && collabs.length > 0) {
    const userIds = collabs.map(c => c.user_id);

    // Test: Get profiles for these users
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', userIds);

    console.log('\n=== PROFILES ===');
    console.log(JSON.stringify(profiles, null, 2));
    if (error) console.log('ERROR:', error);

    // Show mapping
    console.log('\n=== MAPPING ===');
    collabs.forEach(c => {
      const profile = profiles?.find(p => p.id === c.user_id);
      console.log('User ID: ' + c.user_id);
      console.log('  Profile found: ' + !!profile);
      console.log('  Username: ' + (profile?.username || 'NULL'));
    });
  }
})();
