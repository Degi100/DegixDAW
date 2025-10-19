const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Simulate the commentsService logic
async function getTrackComments(trackId) {
  try {
    // Step 1: Get comments
    const { data: comments, error } = await supabase
      .from('track_comments')
      .select(`
        id,
        track_id,
        author_id,
        content,
        timestamp_ms,
        is_resolved,
        created_at,
        updated_at
      `)
      .eq('track_id', trackId)
      .order('timestamp_ms', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }

    if (!comments || comments.length === 0) return [];

    console.log('\n=== Step 1: Comments fetched ===');
    console.log('Count:', comments.length);

    // Step 2: Get unique author IDs
    const authorIds = [...new Set(comments.map((c) => c.author_id))];
    console.log('\n=== Step 2: Author IDs ===');
    console.log('Unique authors:', authorIds.length);
    console.log('IDs:', authorIds.map(id => id.substring(0, 8) + '...'));

    // Step 3: Fetch profiles for all authors
    let profilesQuery = supabase
      .from('profiles')
      .select('id, username');

    // Use .eq() for single author, .in() for multiple (avoids encoding issues)
    if (authorIds.length === 1) {
      console.log('\n=== Step 3: Using .eq() (single author) ===');
      profilesQuery = profilesQuery.eq('id', authorIds[0]);
    } else {
      console.log('\n=== Step 3: Using .in() (multiple authors) ===');
      profilesQuery = profilesQuery.in('id', authorIds);
    }

    const { data: profiles, error: profilesError } = await profilesQuery;

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      // Continue without profiles
    }

    console.log('\n=== Profiles fetched ===');
    console.log('Count:', profiles?.length || 0);
    if (profiles) {
      profiles.forEach(p => {
        console.log('  -', p.username, '(ID:', p.id.substring(0, 8) + '...)');
      });
    }

    // Step 4: Map profiles to comments
    const profilesMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    const result = comments.map((comment) => {
      const profile = profilesMap.get(comment.author_id);
      return {
        ...comment,
        username: profile?.username || null,
        avatar_url: null,
      };
    });

    console.log('\n=== Step 4: Mapping result ===');
    result.forEach(c => {
      console.log('Comment:', c.content.substring(0, 20) + '...');
      console.log('  Username:', c.username || 'NULL');
      console.log('  Display:', c.username || 'Unknown');
    });

    return result;
  } catch (error) {
    console.error('getTrackComments failed:', error);
    return [];
  }
}

(async () => {
  // Get a track with comments
  const { data: tracks } = await supabase
    .from('tracks')
    .select('id, name')
    .limit(10);

  console.log('=== Finding track with comments ===');

  for (const track of tracks) {
    const { data: comments } = await supabase
      .from('track_comments')
      .select('id')
      .eq('track_id', track.id);

    if (comments && comments.length > 0) {
      console.log('\nTrack:', track.name);
      console.log('Track ID:', track.id);
      console.log('Comments count:', comments.length);

      console.log('\n========================================');
      console.log('TESTING commentsService LOGIC');
      console.log('========================================');

      await getTrackComments(track.id);
      break;
    }
  }
})();
