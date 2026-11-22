-- RLS-Test: im Supabase SQL-Editor ausführen. Läuft in einer Transaktion und rollt am Ende zurück.
-- Erwartung: Meldung "RLS-Test bestanden" (unter Messages/Notices). Bei einem Fehler steht "FEHLER: ..." dort.
begin;
do $$
declare a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); c uuid := gen_random_uuid();
        s uuid := gen_random_uuid(); t uuid := gen_random_uuid(); n int;
begin
  insert into auth.users (id, email) values (a,'a@test.de'),(b,'b@test.de'),(c,'c@test.de');
  insert into profiles (id,name,email,role) values (a,'Admin','a@test.de','admin'),(b,'Mitglied B','b@test.de','mitglied'),(c,'Mitglied C','c@test.de','mitglied');
  insert into sitzungen (id,datum,beginn,einreichfrist_tage) values (s, current_date + 30, '19:00', 2);
  insert into aufgaben (id,sitzung_id,verantwortlicher,was) values (t,s,c,'Fremde Aufgabe');
  perform set_config('request.jwt.claims', json_build_object('sub',b,'role','authenticated')::text, true);
  set local role authenticated;

  update aufgaben set erledigt = true where id = t; get diagnostics n = row_count;
  if n <> 0 then raise exception 'FEHLER: Mitglied darf fremde Aufgabe abhaken'; end if;

  update profiles set role = 'admin' where id = b; get diagnostics n = row_count;
  if n <> 0 then raise exception 'FEHLER: Mitglied darf eigene Rolle ändern'; end if;

  begin
    insert into sitzungen (datum) values (current_date);
    raise exception 'FEHLER: Mitglied darf Sitzung anlegen';
  exception when insufficient_privilege or others then
    if sqlerrm like 'FEHLER%' then raise; end if;
  end;

  insert into unterpunkte (sitzung_id,titel,status,eingereicht_von) values (s,'Mein Vorschlag','vorschlag',b);
  begin
    insert into unterpunkte (sitzung_id,titel,status,eingereicht_von) values (s,'Direkt geplant','geplant',b);
    raise exception 'FEHLER: Mitglied darf Punkt direkt planen';
  exception when others then
    if sqlerrm like 'FEHLER%' then raise; end if;
  end;

  perform set_config('request.jwt.claims', json_build_object('sub',a,'role','authenticated')::text, true);
  update aufgaben set erledigt = true where id = t; get diagnostics n = row_count;
  if n <> 1 then raise exception 'FEHLER: Admin darf Aufgabe nicht ändern'; end if;

  raise notice 'RLS-Test bestanden';
end $$;
rollback;
