-- ============================================================================
-- AUTO-STATUS TRIGGER
-- Automatically sets status to 'in_progress' when issue is assigned
-- ============================================================================

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_auto_status_on_assignment ON issues;
DROP FUNCTION IF EXISTS auto_status_on_assignment();

-- Create trigger function
CREATE OR REPLACE FUNCTION auto_status_on_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- If issue is being assigned (assigned_to changes from NULL to a user)
  IF OLD.assigned_to IS NULL AND NEW.assigned_to IS NOT NULL THEN
    -- Only auto-change status if current status is 'open'
    IF NEW.status = 'open' THEN
      NEW.status = 'in_progress';
      RAISE NOTICE '🔄 Auto-Status: Issue % assigned to % → status changed to in_progress', NEW.id, NEW.assigned_to;
    END IF;
  END IF;

  -- If issue is being unassigned (assigned_to changes from user to NULL)
  IF OLD.assigned_to IS NOT NULL AND NEW.assigned_to IS NULL THEN
    -- Only auto-change status if current status is 'in_progress'
    IF NEW.status = 'in_progress' THEN
      NEW.status = 'open';
      RAISE NOTICE '🔄 Auto-Status: Issue % unassigned → status changed to open', NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_auto_status_on_assignment
BEFORE UPDATE ON issues
FOR EACH ROW
EXECUTE FUNCTION auto_status_on_assignment();

-- Test output
SELECT '✅ Auto-Status Trigger created successfully!' AS result;
SELECT '📋 Behavior:' AS info;
SELECT '   - Assign issue (NULL → User) + status=open → Auto-change to in_progress' AS behavior_1;
SELECT '   - Unassign issue (User → NULL) + status=in_progress → Auto-change to open' AS behavior_2;
