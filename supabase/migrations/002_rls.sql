-- Rechte: alles wird in der Datenbank erzwungen
create or replace function public.is_active() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and aktiv)
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and aktiv and role = 'admin')
$$;

-- Einreichfrist: offen, solange Sitzung nicht beendet und Frist nicht abgelaufen
create or replace function public.proposal_open(sid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from sitzungen s
    where s.id = sid and s.status <> 'beendet'
      and now() < ((s.datum + s.beginn) at time zone 'Europe/Berlin') - make_interval(days => s.einreichfrist_tage)
  )
$$;

alter table profiles enable row level security;
alter table vorlage_top enable row level security;
alter table vorlage_unterpunkt enable row level security;
alter table sitzungen enable row level security;
alter table tops enable row level security;
alter table unterpunkte enable row level security;
alter table aufgaben enable row level security;
alter table anwesenheit enable row level security;

-- Lesen: jeder aktive angemeldete Nutzer
create policy read_profiles on profiles for select using (is_active());
create policy read_vorlage_top on vorlage_top for select using (is_active());
create policy read_vorlage_up on vorlage_unterpunkt for select using (is_active());
create policy read_sitzungen on sitzungen for select using (is_active());
create policy read_tops on tops for select using (is_active());
create policy read_aufgaben on aufgaben for select using (is_active());
create policy read_anwesenheit on anwesenheit for select using (is_active());
create policy read_unterpunkte on unterpunkte for select using (is_active());

-- Schreiben (nur Admin)
create policy admin_profiles on profiles for all using (is_admin()) with check (is_admin());
create policy admin_vorlage_top on vorlage_top for all using (is_admin()) with check (is_admin());
create policy admin_vorlage_up on vorlage_unterpunkt for all using (is_admin()) with check (is_admin());
create policy admin_sitzungen on sitzungen for all using (is_admin()) with check (is_admin());
create policy admin_tops on tops for all using (is_admin()) with check (is_admin());
create policy admin_unterpunkte on unterpunkte for all using (is_admin()) with check (is_admin());
create policy admin_aufgaben on aufgaben for all using (is_admin()) with check (is_admin());
create policy admin_anwesenheit on anwesenheit for all using (is_admin()) with check (is_admin());

-- Mitglieder: eigene Vorschläge bis zur Frist
create policy member_insert_vorschlag on unterpunkte for insert
  with check (is_active() and status = 'vorschlag' and eingereicht_von = auth.uid() and proposal_open(sitzung_id));
create policy member_update_vorschlag on unterpunkte for update
  using (is_active() and eingereicht_von = auth.uid() and status = 'vorschlag' and proposal_open(sitzung_id))
  with check (status = 'vorschlag' and eingereicht_von = auth.uid() and proposal_open(sitzung_id));
create policy member_delete_vorschlag on unterpunkte for delete
  using (is_active() and eingereicht_von = auth.uid() and status = 'vorschlag' and proposal_open(sitzung_id));

-- Mitglieder: eigene Aufgaben abhaken (nur Spalte "erledigt")
create policy member_check_aufgabe on aufgaben for update
  using (is_active() and verantwortlicher = auth.uid()) with check (verantwortlicher = auth.uid());

create or replace function public.aufgaben_spaltenschutz() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then
    if new.sitzung_id is distinct from old.sitzung_id or new.unterpunkt_id is distinct from old.unterpunkt_id
       or new.verantwortlicher is distinct from old.verantwortlicher or new.was is distinct from old.was
       or new.bis_wann is distinct from old.bis_wann then
      raise exception 'Mitglieder dürfen nur "erledigt" ändern';
    end if;
  end if;
  return new;
end $$;
create trigger aufgaben_schutz before update on aufgaben for each row execute function aufgaben_spaltenschutz();
