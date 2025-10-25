// Supabase Edge Function: Invite User by Email
// Deploy via Supabase Dashboard

import { serve } from "https://deno.land/std@0.182.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, projectId, projectName, role, permissions } = await req.json()

    // Validate input
    if (!email || !projectId || !projectName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase Admin Client (with Service Role Key)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUsers?.users?.some((u: any) => u.email?.toLowerCase() === email.toLowerCase())

    if (userExists) {
      console.log(`⚠️ User ${email} already exists, skipping invite`)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'User already registered. Please invite them directly from the user search.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send invitation email using Supabase Auth Admin API
    // User will be redirected to /welcome after clicking the magic link
    // Auto-detect: localhost for dev, vercel for production
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://degixdaw.vercel.app';
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${frontendUrl}/welcome?invited=true&project_id=${projectId}`,
      data: {
        invited_to_project: projectId,
        project_name: projectName,
        role: role,
        permissions: permissions,
      }
    })

    if (error) {
      console.error('Supabase invite error:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`✅ Email invitation sent to ${email}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Invitation sent to ${email}`,
        userId: data.user?.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
