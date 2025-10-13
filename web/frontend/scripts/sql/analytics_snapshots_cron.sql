/**
 * Automated Daily Snapshots - Cron Job Setup
 *
 * Sets up automatic daily snapshot creation using pg_cron
 * Runs every day at 00:00 UTC (midnight)
 *
 * Prerequisites:
 * - pg_cron extension must be enabled in Supabase
 * - project_snapshots table must exist
 * - Language breakdown columns must be added
 *
 * Usage:
 * npm run db:sql analytics_snapshots_cron
 *
 * Manual Trigger (for testing):
 * SELECT create_daily_snapshot();
 */

-- ============================================================================
-- Enable pg_cron Extension
-- ============================================================================

-- Note: This requires Supabase Pro plan or self-hosted Supabase
-- If pg_cron is not available, use Supabase Edge Functions instead
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================================
-- Database Function: create_daily_snapshot()
-- ============================================================================

CREATE OR REPLACE FUNCTION create_daily_snapshot()
RETURNS TABLE (
  snapshot_id UUID,
  snapshot_date DATE,
  message TEXT
) AS $$
DECLARE
  v_snapshot_date DATE;
  v_snapshot_id UUID;
  v_total_users INT;
  v_active_users INT;
  v_total_messages BIGINT;
  v_total_conversations INT;
  v_total_issues INT;
  v_open_issues INT;
  v_closed_issues INT;
  v_in_progress_issues INT;
  v_database_size_mb NUMERIC;
  v_storage_size_mb NUMERIC;
BEGIN
  -- Get today's date
  v_snapshot_date := CURRENT_DATE;

  -- Check if snapshot already exists for today
  SELECT id INTO v_snapshot_id
  FROM project_snapshots
  WHERE project_snapshots.snapshot_date = v_snapshot_date;

  IF v_snapshot_id IS NOT NULL THEN
    RETURN QUERY
    SELECT
      v_snapshot_id,
      v_snapshot_date,
      'Snapshot already exists for today'::TEXT;
    RETURN;
  END IF;

  -- ============================================================================
  -- Fetch User Metrics
  -- ============================================================================

  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE is_active = true)
  INTO v_total_users, v_active_users
  FROM profiles;

  -- ============================================================================
  -- Fetch Chat Metrics
  -- ============================================================================

  SELECT
    COUNT(DISTINCT m.id),
    COUNT(DISTINCT m.conversation_id)
  INTO v_total_messages, v_total_conversations
  FROM messages m;

  -- ============================================================================
  -- Fetch Issue Metrics
  -- ============================================================================

  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'open'),
    COUNT(*) FILTER (WHERE status = 'closed'),
    COUNT(*) FILTER (WHERE status = 'in_progress')
  INTO v_total_issues, v_open_issues, v_closed_issues, v_in_progress_issues
  FROM issues;

  -- ============================================================================
  -- Fetch Storage Metrics (Approximate)
  -- ============================================================================

  -- Database size (all tables)
  SELECT
    COALESCE(SUM(pg_total_relation_size(quote_ident(schemaname) || '.' || quote_ident(tablename))) / (1024.0 * 1024.0), 0)::NUMERIC(10,2)
  INTO v_database_size_mb
  FROM pg_tables
  WHERE schemaname = 'public';

  -- Storage size (estimate based on profiles table avatar sizes)
  -- Note: Real storage metrics require Supabase API calls
  v_storage_size_mb := 0;

  -- ============================================================================
  -- Insert Snapshot (Code metrics will be NULL for cron-created snapshots)
  -- ============================================================================

  INSERT INTO project_snapshots (
    snapshot_date,

    -- Code Metrics (NULL for cron, requires GitHub API)
    total_loc,
    total_files,
    total_commits,

    -- User Metrics
    total_users,
    active_users,

    -- Chat Metrics
    total_messages,
    total_conversations,

    -- Issue Metrics
    total_issues,
    open_issues,
    closed_issues,
    in_progress_issues,

    -- Storage Metrics
    database_size_mb,
    storage_size_mb,
    total_storage_mb,

    -- Metadata
    created_by,
    metadata
  )
  VALUES (
    v_snapshot_date,

    -- Code Metrics (set to 0 for cron, admin can manually trigger full snapshot)
    0, -- total_loc
    0, -- total_files
    0, -- total_commits

    -- User Metrics
    v_total_users,
    v_active_users,

    -- Chat Metrics
    v_total_messages,
    v_total_conversations,

    -- Issue Metrics
    v_total_issues,
    v_open_issues,
    v_closed_issues,
    v_in_progress_issues,

    -- Storage Metrics
    v_database_size_mb,
    v_storage_size_mb,
    v_database_size_mb + v_storage_size_mb, -- total_storage_mb

    -- Metadata
    NULL, -- created_by (NULL for cron jobs)
    jsonb_build_object(
      'created_via', 'cron_job',
      'note', 'Code metrics require manual snapshot via admin button'
    )
  )
  RETURNING id, project_snapshots.snapshot_date
  INTO v_snapshot_id, v_snapshot_date;

  -- ============================================================================
  -- Return Success Message
  -- ============================================================================

  RETURN QUERY
  SELECT
    v_snapshot_id,
    v_snapshot_date,
    format('Snapshot created successfully! Users: %s, Messages: %s, Issues: %s', v_total_users, v_total_messages, v_total_issues)::TEXT;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Grant Permissions
-- ============================================================================

-- Allow authenticated users to manually trigger snapshots (optional)
GRANT EXECUTE ON FUNCTION create_daily_snapshot() TO authenticated;

-- ============================================================================
-- Schedule Daily Cron Job
-- ============================================================================

-- Remove existing job if it exists (ignore errors if job doesn't exist)
DO $$
BEGIN
  PERFORM cron.unschedule('daily_project_snapshot');
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Ignore error if job doesn't exist yet
END $$;

-- Schedule job to run every day at 00:00 UTC
SELECT cron.schedule(
  'daily_project_snapshot',          -- Job name
  '0 0 * * *',                        -- Cron expression (00:00 UTC daily)
  $$SELECT create_daily_snapshot()$$  -- SQL to execute
);

-- ============================================================================
-- Verify Cron Job Setup
-- ============================================================================

-- View all scheduled jobs
SELECT * FROM cron.job;

-- View job run history (last 10 runs)
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily_project_snapshot')
ORDER BY start_time DESC
LIMIT 10;

-- ============================================================================
-- Manual Trigger (For Testing)
-- ============================================================================

-- Uncomment to test immediately:
-- SELECT create_daily_snapshot();

-- ============================================================================
-- Cleanup Function: Delete Old Snapshots
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_snapshots(keep_days INT DEFAULT 90)
RETURNS TABLE (
  deleted_count INT,
  message TEXT
) AS $$
DECLARE
  v_cutoff_date DATE;
  v_deleted_count INT;
BEGIN
  -- Calculate cutoff date
  v_cutoff_date := CURRENT_DATE - keep_days;

  -- Delete old snapshots
  DELETE FROM project_snapshots
  WHERE snapshot_date < v_cutoff_date;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN QUERY
  SELECT
    v_deleted_count,
    format('Deleted %s snapshots older than %s days (before %s)', v_deleted_count, keep_days, v_cutoff_date)::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION cleanup_old_snapshots(INT) TO authenticated;

-- Remove existing cleanup job if it exists
DO $$
BEGIN
  PERFORM cron.unschedule('monthly_snapshot_cleanup');
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Ignore error if job doesn't exist yet
END $$;

-- Schedule cleanup to run monthly (1st of each month at 01:00 UTC)
SELECT cron.schedule(
  'monthly_snapshot_cleanup',
  '0 1 1 * *',
  $$SELECT cleanup_old_snapshots(90)$$
);

-- ============================================================================
-- Success Message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Automated daily snapshots configured!';
  RAISE NOTICE '⏰ Cron Job: Runs every day at 00:00 UTC';
  RAISE NOTICE '📊 Tracks: Users, Messages, Issues, Storage';
  RAISE NOTICE '⚠️  Code metrics (LOC, files, commits) require manual snapshot via admin button';
  RAISE NOTICE '🧹 Cleanup: Runs monthly, keeps last 90 days';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 To view scheduled jobs: SELECT * FROM cron.job;';
  RAISE NOTICE '📝 To view job history: SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;';
  RAISE NOTICE '🚀 To test now: SELECT create_daily_snapshot();';
END $$;
