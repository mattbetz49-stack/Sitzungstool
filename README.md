# Sitzungstool ASV Steinach 1947

Web-App für die Vorstandssitzungen: Tagesordnung mit Zeitbudget, Sitzungsmodus mit Timer, Beschlüsse, Aufgaben, Protokoll, Archiv.
Alles läuft im Browser (Handy, Tablet, Laptop). Kosten: 0 €.

> Du brauchst: ein Konto bei **Supabase** (Datenbank + Login, Server in Frankfurt) und eins bei **GitHub** (stellt die Seite ins Netz). Plane für die Einrichtung etwa 1 Stunde ein.

## Teil 1 – Supabase einrichten (einmalig)

1. Auf <https://supabase.com> registrieren, **New project** wählen. Name z. B. `asv-sitzungen`, ein langes Datenbank-Passwort vergeben (sicher aufbewahren), **Region: Frankfurt (eu-central-1)**.
2. Links **SQL Editor** → **New query**. Nacheinander den Inhalt dieser vier Dateien aus dem Ordner `supabase/migrations` einfügen und je mit **Run** ausführen: `001_schema.sql`, `002_rls.sql`, `003_seed.sql`, `004_aufgaben_ursprung.sql`.
3. **Rechte-Test (wichtig):** Inhalt von `supabase/tests/rls.sql` einfügen und ausführen. Erwartet wird die Meldung „RLS-Test bestanden“ (der Test verändert nichts, er wird am Ende zurückgerollt). Steht dort „FEHLER“, bitte nicht weitermachen und mir Bescheid geben.
4. **Authentication → Providers → Email**: „Allow new users to sign up“ **ausschalten** (nur eingeladene Personen kommen rein). „Confirm email“ bleibt an.
5. **Authentication → URL Configuration**: *Site URL* und *Redirect URLs* später auf die GitHub-Adresse setzen (Teil 2, Schritt 5).
6. **Edge Functions → Create a new function** (im Browser-Editor): Name `invite-member`, den Inhalt von `supabase/functions/invite-member/index.ts` einfügen, **Deploy**. Danach in den Einstellungen der Funktion „Verify JWT“ eingeschaltet lassen.
7. **Project Settings → API**: die *Project URL* und den *anon public key* notieren (werden in Teil 2 gebraucht). Den *service_role key* niemals weitergeben.

## Teil 2 – App veröffentlichen (GitHub)

1. Auf <https://github.com> registrieren, **New repository** (z. B. `sitzungstool`, privat oder öffentlich).
2. Alle Dateien dieses Projekts hochladen (**Add file → Upload files**; den Ordner `node_modules` nicht).
3. Im Repository **Settings → Secrets and variables → Actions → Variables**: zwei Variablen anlegen: `SUPABASE_URL` (Project URL) und `SUPABASE_ANON_KEY` (anon public key).
4. **Settings → Pages**: *Source* auf **GitHub Actions** stellen. Danach unter **Actions** den Lauf „Veröffentlichen“ abwarten (grüner Haken). Die Adresse steht danach unter Settings → Pages, z. B. `https://DEINNAME.github.io/sitzungstool/`.
5. Diese Adresse in Supabase unter *Site URL* und *Redirect URLs* eintragen (Teil 1, Schritt 5).

## Teil 3 – Ersten Admin anlegen

1. Supabase: **Authentication → Users → Add user → Create new user** mit deiner E-Mail und einem Passwort (Haken „Auto confirm user“ setzen).
2. **SQL Editor**: (Name und E-Mail anpassen)
   ```sql
   insert into profiles (id, name, email, role)
   select id, 'Dein Name', email, 'admin' from auth.users where email = 'deine@mail.de';
   ```
3. Die App-Adresse öffnen und anmelden. Unter **Admin → Mitglieder** den/die Vorsitzende(n) als Admin und alle anderen als Mitglied einladen. Jede Person bekommt eine E-Mail, setzt ein Passwort (mind. 10 Zeichen) und ist drin. Hinweis: Der kostenlose Supabase-Mailversand ist begrenzt (nur wenige E-Mails pro Stunde). Bei 8–12 Einladungen am besten über den Tag verteilen oder unter *Authentication → SMTP Settings* einen eigenen Mailversand (z. B. vom Vereins-Webspace) eintragen.

## Alltag
- **Neue Sitzung:** Sitzungen → „Neue Sitzung“. Offene Aufgaben und vertagte Punkte der letzten Sitzung kommen automatisch dazu. Vorschläge eintreffen lassen, zuordnen, **veröffentlichen**, am Sitzungstag **starten**.
- **Standard-TOPs ändern:** Admin → Tagesordnungs-Vorlage.
- **Datensicherung:** Admin → Datensicherung → „Komplett-Backup“. Einmal im Monat, Datei sicher ablegen.
- **Passwort vergessen:** Auf der Anmeldeseite „Passwort vergessen?“.

## Updates einspielen
Neue Version der Dateien im GitHub-Repository hochladen (**Add file → Upload files**, gleiche Namen überschreiben). Nach 1–2 Minuten ist die neue Version online (Reiter **Actions** zeigt den Fortschritt). Änderungen an `supabase/migrations` müssen zusätzlich im SQL Editor ausgeführt werden.

## Wenn das Projekt „pausiert“
Der Workflow „Supabase wachhalten“ ruft die Datenbank alle 3 Tage auf. Bei GitHub muss dafür Actions aktiv sein. Falls Supabase doch pausiert: im Supabase-Dashboard **Restore project** klicken (Daten bleiben erhalten).

## Datenschutz in Kürze
Gespeichert werden nur Name, E-Mail, Rolle und Vereinsinhalte, in Frankfurt. Verbindung per HTTPS, Passwörter gehasht (Supabase). Mit Supabase und GitHub sollten Auftragsverarbeitungsverträge (AV-Vertrag/DPA) abgeschlossen werden; beide bieten das an.

## Für Entwickler
`npm install`, `.env` nach `.env.example` anlegen, `npm run dev`, `npm test`, `npm run build`.
