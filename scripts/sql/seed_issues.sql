-- Quick Seed Script - Nur die INSERT Statements
-- Kopiere das und führe es separat in Supabase SQL Editor aus

INSERT INTO public.issues (title, description, status, priority, category, created_by) VALUES
('Doppelter Toast bei Login', 'Login successfully + Willkommen zurück erscheinen beide → nur 1x zeigen', 'open', 'high', 'Auth/Login', (SELECT id FROM auth.users WHERE email = 'rene.degering2014@gmail.com' LIMIT 1)),
('404 bei "Zurück zur Anmeldung"', 'forgot-password: Link führt zu 404 → Route korrigieren', 'open', 'high', 'Routing', (SELECT id FROM auth.users WHERE email = 'rene.degering2014@gmail.com' LIMIT 1)),
('Add User schlägt fehl', 'Create User (Add User) Funktion implementieren', 'open', 'high', 'Admin/Users', (SELECT id FROM auth.users WHERE email = 'rene.degering2014@gmail.com' LIMIT 1)),
('Toast Text anpassen', 'missing email or phonenumber → E-Mail oder Passwort fehlt', 'open', 'medium', 'Auth/Login', (SELECT id FROM auth.users WHERE email = 'rene.degering2014@gmail.com' LIMIT 1)),
('Toast-Sprache einheitlich', 'Toasts teilweise Englisch, teilweise Deutsch → einheitlich Deutsch', 'open', 'medium', 'Auth/Login', (SELECT id FROM auth.users WHERE email = 'rene.degering2014@gmail.com' LIMIT 1)),
('Begrüßung Format ändern', 'Begrüßung mit Full Name + (Username) Format', 'open', 'medium', 'Auth/Login', (SELECT id FROM auth.users WHERE email = 'rene.degering2014@gmail.com' LIMIT 1)),
('Biografie speichern funktioniert nicht', 'Bio-Text wird nicht gespeichert → DB-Anbindung fehlt', 'open', 'medium', 'Profile/Settings', (SELECT id FROM auth.users WHERE email = 'rene.degering2014@gmail.com' LIMIT 1)),
('Analytics: Active Users Filter', 'Active Users enthalten Pending Users → Filter korrigieren', 'open', 'medium', 'Admin/Analytics', (SELECT id FROM auth.users WHERE email = 'rene.degering2014@gmail.com' LIMIT 1)),
('Role Distribution zeigt keinen Admin', 'Es sollte 1 Admin angezeigt werden', 'open', 'medium', 'Admin/Analytics', (SELECT id FROM auth.users WHERE email = 'rene.degering2014@gmail.com' LIMIT 1)),
('forgot-password Styling anpassen', 'Email gesendet Seite: Styling verbessern', 'open', 'low', 'UI/Style', (SELECT id FROM auth.users WHERE email = 'rene.degering2014@gmail.com' LIMIT 1)),
('recover Styling anpassen', 'Passwort zurücksetzen Seite: Styling verbessern', 'open', 'low', 'UI/Style', (SELECT id FROM auth.users WHERE email = 'rene.degering2014@gmail.com' LIMIT 1)),
('Auge-Icon schicker machen', 'Passwort-Anzeige Icon verbessern', 'open', 'low', 'UI/Style', (SELECT id FROM auth.users WHERE email = 'rene.degering2014@gmail.com' LIMIT 1)),
('Sonderzeichen-Hinweis entfernen', 'Nicht zwingend erforderlich → entfernen', 'open', 'low', 'UI/Style', (SELECT id FROM auth.users WHERE email = 'rene.degering2014@gmail.com' LIMIT 1)),
('Lupe-Icon richtig positionieren', 'Admin Panel: Lupe im Suchfeld rechts positionieren', 'open', 'low', 'Admin/UI', (SELECT id FROM auth.users WHERE email = 'rene.degering2014@gmail.com' LIMIT 1)),
('Admin UI Layout optimieren', 'Suchfeld + Refresh/Add/Export/Analytics neben Showing users', 'open', 'low', 'Admin/UI', (SELECT id FROM auth.users WHERE email = 'rene.degering2014@gmail.com' LIMIT 1)),
('Bio: Private/Public Toggle', 'Toggle für Sichtbarkeit der Biografie implementieren', 'open', 'medium', 'Profile/Settings', (SELECT id FROM auth.users WHERE email = 'rene.degering2014@gmail.com' LIMIT 1)),
('2FA-Hinweis ausblenden', 'Zwei-Faktor-Authentifizierung Hinweis später einbauen', 'open', 'low', 'Profile/Settings', (SELECT id FROM auth.users WHERE email = 'rene.degering2014@gmail.com' LIMIT 1)),
('Passwort ändern: Email-Bestätigung', 'Bei Passwort-Änderung Bestätigungs-Modal + Email-Bestätigung', 'open', 'medium', 'Profile/Settings', (SELECT id FROM auth.users WHERE email = 'rene.degering2014@gmail.com' LIMIT 1)),
('Real-time On/Off dokumentieren', 'Funktionalität von Real-time Toggle erklären/verbessern', 'open', 'low', 'Admin/Features', (SELECT id FROM auth.users WHERE email = 'rene.degering2014@gmail.com' LIMIT 1));
