const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

(async () => {
  try {
    // Get a track with comments
    const { data: tracks } = await supabase
      .from('tracks')
      .select('id, name')
      .limit(5);

    if (!tracks || tracks.length === 0) {
      console.log('No tracks found!');
      return;
    }

    console.log('\n=== Checking tracks for comments ===');

    for (const track of tracks) {
      // Check each track for comments
      const { data: comments } = await supabase
        .from('track_comments')
        .select('*')
        .eq('track_id', track.id);

      if (comments && comments.length > 0) {
        console.log('\nTrack:', track.name, '(ID:', track.id + ')');
        console.log('Comments found:', comments.length);

        // Get unique author IDs
        const authorIds = [...new Set(comments.map(c => c.author_id))];
        console.log('Unique authors:', authorIds.length);

        // Fetch profiles (same logic as fixed service)
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', authorIds);

        if (profilesError) {
          console.log('ERROR fetching profiles:', profilesError);
        } else {
          console.log('Profiles found:', profiles?.length || 0);

          // Map profiles
          const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

          comments.forEach(comment => {
            const profile = profilesMap.get(comment.author_id);
            const displayName = profile?.username || null || 'Unknown';
            console.log('  - Comment by:', displayName, '(author_id:', comment.author_id.substring(0, 8) + '...)');
          });
        }
        break; // Only check first track with comments
      }
    }

    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
  }
})();
