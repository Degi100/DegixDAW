const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Need service role for bulk insert
);

(async () => {
  console.log('\n=== Fixing Missing Project Owners ===\n');

  try {
    // Step 1: Get all projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, title, creator_id');

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      return;
    }

    console.log('Total projects:', projects?.length || 0);

    if (!projects || projects.length === 0) {
      console.log('No projects found.');
      return;
    }

    // Step 2: Get all existing collaborators
    const { data: existingCollabs } = await supabase
      .from('project_collaborators')
      .select('project_id, user_id');

    const existingMap = new Map(
      existingCollabs?.map(c => [`${c.project_id}:${c.user_id}`, true]) || []
    );

    console.log('Existing collaborators:', existingCollabs?.length || 0);

    // Step 3: Find projects without owner as collaborator
    const missingOwners = projects.filter(project => {
      const key = `${project.id}:${project.creator_id}`;
      return !existingMap.has(key);
    });

    console.log('Projects missing owner collaborator:', missingOwners.length);

    if (missingOwners.length === 0) {
      console.log('✅ All projects already have owner as collaborator!');
      return;
    }

    // Step 4: Insert missing owner collaborators
    const now = new Date().toISOString();
    const inserts = missingOwners.map(project => ({
      project_id: project.id,
      user_id: project.creator_id,
      role: 'admin',
      can_edit: true,
      can_download: true,
      can_upload_audio: true,
      can_upload_mixdown: true,
      can_comment: true,
      can_invite_others: true,
      invited_by: project.creator_id,
      invited_at: now,
      accepted_at: now, // Auto-accept for creator
    }));

    console.log('\nInserting', inserts.length, 'owner collaborators...');

    const { data: inserted, error: insertError } = await supabase
      .from('project_collaborators')
      .insert(inserts)
      .select();

    if (insertError) {
      console.error('Error inserting collaborators:', insertError);
      return;
    }

    console.log('✅ Inserted', inserted?.length || 0, 'collaborators');

    // Step 5: Verify
    console.log('\nProjects fixed:');
    missingOwners.forEach(p => {
      console.log('  -', p.title, '(ID:', p.id.substring(0, 8) + '...)');
    });

    console.log('\n✅ Done! All projects now have owner as ADMIN collaborator.');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
})();
