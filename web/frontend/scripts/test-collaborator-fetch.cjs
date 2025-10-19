const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

(async () => {
  try {
    // Get a real project
    const { data: projects } = await supabase
      .from('projects')
      .select('id, title')
      .limit(1)
      .single();

    if (!projects) {
      console.log('No projects found. Create one first!');
      return;
    }

    console.log('\n=== Project ===');
    console.log('Title:', projects.title);
    console.log('ID:', projects.id);

    // Get collaborators for this project (same logic as service)
    const { data: collaborators, error: collabError } = await supabase
      .from('project_collaborators')
      .select('*')
      .eq('project_id', projects.id)
      .order('created_at', { ascending: true });

    console.log('\n=== Collaborators Query ===');
    console.log('Found:', collaborators?.length || 0);
    if (collabError) console.log('Error:', collabError);

    if (!collaborators || collaborators.length === 0) {
      console.log('\nNo collaborators yet. Invite someone via the UI!');
      return;
    }

    // Get profiles (same logic as service)
    const userIds = collaborators.map((c) => c.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', userIds);

    console.log('\n=== Profiles Query ===');
    console.log('User IDs to fetch:', userIds);
    console.log('Profiles found:', profiles?.length || 0);
    if (profilesError) console.log('Error:', profilesError);

    // Map (same logic as service)
    const profilesMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    console.log('\n=== Mapping Result ===');
    collaborators.forEach((collab) => {
      const profile = profilesMap.get(collab.user_id);
      console.log('\nCollaborator:');
      console.log('  User ID:', collab.user_id);
      console.log('  Role:', collab.role);
      console.log('  Profile found:', !!profile);
      console.log('  Username:', profile?.username || 'NULL');
      console.log('  Display Name:', profile?.username || null || 'Unknown User');
    });

  } catch (error) {
    console.error('Error:', error);
  }
})();
