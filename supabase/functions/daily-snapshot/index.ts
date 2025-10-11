/**
 * Daily Snapshot Edge Function
 *
 * Alternative to pg_cron for Supabase Free Tier users
 *
 * Triggered by external cron services (e.g., Cron-Job.org, EasyCron)
 * Creates daily project snapshots via RPC call
 *
 * Setup:
 * 1. Deploy: supabase functions deploy daily-snapshot
 * 2. Set env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET
 * 3. Schedule with external cron: POST to https://your-project.supabase.co/functions/v1/daily-snapshot
 *    Header: Authorization: Bearer {CRON_SECRET}
 *
 * Usage:
 * curl -X POST https://your-project.supabase.co/functions/v1/daily-snapshot \
 *   -H "Authorization: Bearer your-cron-secret"
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

// ============================================================================
// Types
// ============================================================================

interface SnapshotResult {
  snapshot_id: string;
  snapshot_date: string;
  message: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  timestamp: string;
}

interface SuccessResponse {
  success: true;
  data: SnapshotResult;
  timestamp: string;
}

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req: Request): Promise<Response> => {
  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST." }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // ============================================================================
  // Authentication: Verify Cron Secret
  // ============================================================================

  const authHeader = req.headers.get("Authorization");
  const cronSecret = Deno.env.get("CRON_SECRET");

  // If CRON_SECRET is set, require authentication
  if (cronSecret) {
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      console.error("[daily-snapshot] Unauthorized request - invalid or missing Authorization header");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unauthorized. Invalid or missing Authorization header.",
          timestamp: new Date().toISOString(),
        } as ErrorResponse),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } else {
    console.warn("[daily-snapshot] CRON_SECRET not set - endpoint is public!");
  }

  // ============================================================================
  // Initialize Supabase Client
  // ============================================================================

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[daily-snapshot] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return new Response(
      JSON.stringify({
        success: false,
        error: "Server misconfigured. Missing environment variables.",
        timestamp: new Date().toISOString(),
      } as ErrorResponse),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // ============================================================================
  // Call Database Function: create_daily_snapshot()
  // ============================================================================

  try {
    console.log("[daily-snapshot] Calling create_daily_snapshot() RPC...");

    const { data, error } = await supabase.rpc("create_daily_snapshot");

    if (error) {
      console.error("[daily-snapshot] RPC error:", error);
      throw new Error(`Database error: ${error.message}`);
    }

    // RPC returns array with one row
    const result: SnapshotResult = Array.isArray(data) ? data[0] : data;

    console.log("[daily-snapshot] Snapshot created successfully:", result);

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      } as SuccessResponse),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[daily-snapshot] Error creating snapshot:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      } as ErrorResponse),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
