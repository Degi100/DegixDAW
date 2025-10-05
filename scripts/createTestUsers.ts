// scripts/createTestUsers.ts
// Creates 30 random test users with profiles

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'YOUR_SERVICE_KEY';
const ADMIN_USER_ID = '010b60b9-0ef1-4d4a-af3d-822792207dda'; // Your Admin User ID

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const firstNames = [
  'Max', 'Anna', 'Leon', 'Emma', 'Paul', 'Mia', 'Felix', 'Sophie',
  'Jonas', 'Laura', 'Tim', 'Lisa', 'Ben', 'Sarah', 'Tom', 'Julia',
  'Lukas', 'Lena', 'David', 'Nina', 'Simon', 'Marie', 'Jan', 'Hannah',
  'Finn', 'Lea', 'Noah', 'Clara', 'Elias', 'Amelie'
];

const lastNames = [
  'Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer',
  'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Koch', 'Bauer',
  'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz',
  'Zimmermann', 'Braun', 'Krüger', 'Hofmann', 'Hartmann', 'Lange',
  'Schmitt', 'Werner', 'Schmitz', 'Krause', 'Meier', 'Lehmann'
];

const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'web.de', 'gmx.de'];

function generateUsername(firstName: string, lastName: string): string {
  const random = Math.floor(Math.random() * 9999);
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${random}`;
}

function generateEmail(username: string): string {
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${username}@${domain}`;
}

async function createTestUsers() {
  console.log('🚀 Creating 30 test users...\n');

  for (let i = 0; i < 30; i++) {
    const firstName = firstNames[i];
    const lastName = lastNames[i];
    const username = generateUsername(firstName, lastName);
    const email = generateEmail(username);
    const password = 'TestUser123!'; // Same password for all test users

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
          username: username,
          display_name: `${firstName} ${lastName}`
        }
      });

      if (authError) {
        console.error(`❌ Error creating user ${email}:`, authError.message);
        continue;
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          username: username,
          full_name: `${firstName} ${lastName}`,
          email: email
        });

      if (profileError) {
        console.error(`❌ Error creating profile for ${email}:`, profileError.message);
        continue;
      }

      // Create friendship with admin (accepted status)
      const { error: friendshipError } = await supabase
        .from('friendships')
        .insert({
          user_id: ADMIN_USER_ID,
          friend_id: authData.user.id,
          status: 'accepted',
          responded_at: new Date().toISOString()
        });

      if (friendshipError) {
        console.error(`⚠️  Warning: Could not create friendship for ${email}:`, friendshipError.message);
      }

      console.log(`✅ Created: ${firstName} ${lastName} (@${username}) - ${email} [Friend ✓]`);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 150));
    } catch (error) {
      console.error(`❌ Unexpected error for ${email}:`, error);
    }
  }

  console.log('\n🎉 Done! Created 30 test users.');
  console.log('📧 All users have password: TestUser123!');
  console.log('👥 All users are now friends with admin!');
}

createTestUsers().catch(console.error);
