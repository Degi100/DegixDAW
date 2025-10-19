const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

(async () => {
  // Get the latest project
  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, creator_id')
    .order('created_at', { ascending: false })
    .limit(1);

  if (!projects || projects.length === 0) {
    console.log('No projects found');
    return;
  }

  const project = projects[0];
  console.log('\n=== PROJECT ===');
  console.log('Title:', project.title);
  console.log('ID:', project.id);
  console.log('Creator ID:', project.creator_id);

  // Get creator profile
  const { data: creatorProfile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', project.creator_id)
    .single();

  console.log('Creator Username:', creatorProfile?.username || 'NULL');

  // Get collaborators for this project
  const { data: collabs } = await supabase
    .from('project_collaborators')
    .select('*')
    .eq('project_id', project.id);

  console.log('\n=== COLLABORATORS IN DB ===');
  console.log('Count:', collabs?.length || 0);

  if (collabs && collabs.length > 0) {
    collabs.forEach(c => {
      console.log('  - User ID:', c.user_id.substring(0, 8) + '...');
      console.log('    Role:', c.role);
      console.log('    Accepted:', c.accepted_at ? 'YES' : 'PENDING');
    });

    // Get profiles for all collaborators
    const userIds = collabs.map(c => c.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', userIds);

    console.log('\n=== PROFILES ===');
    console.log('Found:', profiles?.length || 0);

    if (profiles) {
      profiles.forEach(p => {
        console.log('  - Username:', p.username || 'NULL');
        console.log('    ID:', p.id.substring(0, 8) + '...');
      });
    }

    // Map profiles to collaborators
    const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

    console.log('\n=== MAPPING RESULT ===');
    collabs.forEach(c => {
      const profile = profilesMap.get(c.user_id);
      const displayName = profile?.username || null || 'Unknown User';
      console.log('Collab User ID:', c.user_id.substring(0, 8) + '...');
      console.log('  → Display Name:', displayName);
    });
  } else {
    console.log('No collaborators found in project_collaborators table!');
    console.log('This might be why "Unknown User" is shown.');
  }
})();
