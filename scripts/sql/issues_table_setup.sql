-- ============================================
-- Issues Table Setup for DegixDAW
-- Issue Management System für Bug & Feature Tracking
-- ============================================

-- 1. Create Issues Table
CREATE TABLE IF NOT EXISTS public.issues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'done', 'closed')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Metadata
  tags TEXT[], -- Array für flexible Tags
  due_date TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- 2. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_issues_status ON public.issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_priority ON public.issues(priority);
CREATE INDEX IF NOT EXISTS idx_issues_category ON public.issues(category);
CREATE INDEX IF NOT EXISTS idx_issues_created_by ON public.issues(created_by);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON public.issues(created_at DESC);

-- 3. Enable Row Level Security
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Policy: Admins können alles sehen
-- Uses user_metadata.is_admin to check admin status
CREATE POLICY "Admins can view all issues"
ON public.issues
FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  OR
  auth.jwt() ->> 'email' IN (
    SELECT email FROM auth.users WHERE email = 'rene.degering2014@gmail.com'
  )
);

-- Policy: Admins können Issues erstellen
CREATE POLICY "Admins can create issues"
ON public.issues
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  OR
  auth.jwt() ->> 'email' IN (
    SELECT email FROM auth.users WHERE email = 'rene.degering2014@gmail.com'
  )
);

-- Policy: Admins können Issues updaten
CREATE POLICY "Admins can update issues"
ON public.issues
FOR UPDATE
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  OR
  auth.jwt() ->> 'email' IN (
    SELECT email FROM auth.users WHERE email = 'rene.degering2014@gmail.com'
  )
);

-- Policy: Admins können Issues löschen
CREATE POLICY "Admins can delete issues"
ON public.issues
FOR DELETE
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  OR
  auth.jwt() ->> 'email' IN (
    SELECT email FROM auth.users WHERE email = 'rene.degering2014@gmail.com'
  )
);

-- 5. Trigger für updated_at automatisch aktualisieren
CREATE OR REPLACE FUNCTION update_issues_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_issues_updated_at
BEFORE UPDATE ON public.issues
FOR EACH ROW
EXECUTE FUNCTION update_issues_updated_at();

-- 6. Initial Seed Data - Deine 19 Test-Issues
INSERT INTO public.issues (title, description, status, priority, category, created_by) VALUES
-- HIGH PRIORITY
('Doppelter Toast bei Login', 'Login successfully + Willkommen zurück erscheinen beide → nur 1x zeigen', 'open', 'high', 'Auth/Login', (SELECT id FROM auth.users WHERE email = 'rene.degering2014@gmail.com' LIMIT 1)),
('404 bei "Zurück zur Anmeldung"', 'forgot-password: Link führt zu 404 → Route korrigieren', 'open', 'high', 'Routing', (SELECT id FROM auth.users WHERE email = 'rene.degering2014@gmail.com' LIMIT 1)),
('Add User schlägt fehl', 'Create User (Add User) Funktion implementieren', 'open', 'high', 'Admin/Users', (SELECT id FROM auth.users WHERE email = 'rene.degering2014@gmail.com' LIMIT 1)),

-- MEDIUM PRIORITY
('Toast Text anpassen', 'missing email or phonenumber → E-Mail oder Passwort fehlt', 'open', 'medium', 'Auth/Login', (SELECT id FROM auth.users WHERE email = 'rene.degering2014@gmail.com' LIMIT 1)),
('Toast-Sprache einheitlich', 'Toasts teilweise Englisch, teilweise Deutsch → einheitlich Deutsch', 'open', 'medium', 'Auth/Login', (SELECT id FROM auth.users WHERE email = 'rene.degering2014@gmail.com' LIMIT 1)),
('Begrüßung Format ändern', 'Begrüßung mit Full Name + (Username) Format', 'open', 'medium', 'Auth/Login', (SELECT id FROM auth.users WHERE email = 'rene.degering2014@gmail.com' LIMIT 1)),
('Biografie speichern funktioniert nicht', 'Bio-Text wird nicht gespeichert → DB-Anbindung fehlt', 'open', 'medium', 'Profile/Settings', (SELECT id FROM auth.users WHERE email = 'rene.degering2014@gmail.com' LIMIT 1)),
('Analytics: Active Users Filter', 'Active Users enthalten Pending Users → Filter korrigieren', 'open', 'medium', 'Admin/Analytics', (SELECT id FROM auth.users WHERE email = 'rene.degering2014@gmail.com' LIMIT 1)),
('Role Distribution zeigt keinen Admin', 'Es sollte 1 Admin angezeigt werden', 'open', 'medium', 'Admin/Analytics', (SELECT id FROM auth.users WHERE email = 'rene.degering2014@gmail.com' LIMIT 1)),

-- LOW PRIORITY
('forgot-password Styling anpassen', 'Email gesendet Seite: Styling verbessern', 'open', 'low', 'UI/Style', (SELECT id FROM auth.users WHERE email = 'rene.degering2014@gmail.com' LIMIT 1)),
('recover Styling anpassen', 'Passwort zurücksetzen Seite: Styling verbessern', 'open', 'low', 'UI/Style', (SELECT id FROM auth.users WHERE email = 'rene.degering2014@gmail.com' LIMIT 1)),
('Auge-Icon schicker machen', 'Passwort-Anzeige Icon verbessern', 'open', 'low', 'UI/Style', (SELECT id FROM auth.users WHERE email = 'rene.degering2014@gmail.com' LIMIT 1)),
('Sonderzeichen-Hinweis entfernen', 'Nicht zwingend erforderlich → entfernen', 'open', 'low', 'UI/Style', (SELECT id FROM auth.users WHERE email = 'rene.degering2014@gmail.com' LIMIT 1)),
('Lupe-Icon richtig positionieren', 'Admin Panel: Lupe im Suchfeld rechts positionieren', 'open', 'low', 'Admin/UI', (SELECT id FROM auth.users WHERE email = 'rene.degering2014@gmail.com' LIMIT 1)),
('Admin UI Layout optimieren', 'Suchfeld + Refresh/Add/Export/Analytics neben Showing users', 'open', 'low', 'Admin/UI', (SELECT id FROM auth.users WHERE email = 'rene.degering2014@gmail.com' LIMIT 1)),

-- FUTURE FEATURES
('Bio: Private/Public Toggle', 'Toggle für Sichtbarkeit der Biografie implementieren', 'open', 'medium', 'Profile/Settings', (SELECT id FROM auth.users WHERE email = 'rene.degering2014@gmail.com' LIMIT 1)),
('2FA-Hinweis ausblenden', 'Zwei-Faktor-Authentifizierung Hinweis später einbauen', 'open', 'low', 'Profile/Settings', (SELECT id FROM auth.users WHERE email = 'rene.degering2014@gmail.com' LIMIT 1)),
('Passwort ändern: Email-Bestätigung', 'Bei Passwort-Änderung Bestätigungs-Modal + Email-Bestätigung', 'open', 'medium', 'Profile/Settings', (SELECT id FROM auth.users WHERE email = 'rene.degering2014@gmail.com' LIMIT 1)),
('Real-time On/Off dokumentieren', 'Funktionalität von Real-time Toggle erklären/verbessern', 'open', 'low', 'Admin/Features', (SELECT id FROM auth.users WHERE email = 'rene.degering2014@gmail.com' LIMIT 1));

-- 7. Useful Views (Optional)

-- View: Open Issues by Priority
CREATE OR REPLACE VIEW issues_open_by_priority AS
SELECT 
  priority,
  COUNT(*) as count,
  array_agg(title ORDER BY created_at DESC) as recent_titles
FROM public.issues
WHERE status IN ('open', 'in-progress')
GROUP BY priority
ORDER BY 
  CASE priority
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END;

-- View: Issues by Category
CREATE OR REPLACE VIEW issues_by_category AS
SELECT 
  category,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'open') as open_count,
  COUNT(*) FILTER (WHERE status = 'in-progress') as in_progress_count,
  COUNT(*) FILTER (WHERE status = 'done') as done_count
FROM public.issues
GROUP BY category
ORDER BY total DESC;

-- ============================================
-- Fertig! 🎉
-- ============================================
-- Run this script in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- ============================================
