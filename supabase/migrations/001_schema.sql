-- Sitzungstool ASV Steinach: Tabellen
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'mitglied' check (role in ('admin','mitglied')),
  aktiv boolean not null default true
);

create table public.vorlage_top (
  id uuid primary key default gen_random_uuid(),
  titel text not null,
  position int not null default 0
);
create table public.vorlage_unterpunkt (
  id uuid primary key default gen_random_uuid(),
  top_id uuid not null references public.vorlage_top(id) on delete cascade,
  titel text not null,
  minuten int not null default 5 check (minuten >= 0),
  position int not null default 0
);

create table public.sitzungen (
  id uuid primary key default gen_random_uuid(),
  datum date not null,
  beginn time not null default '19:00',
  geplante_dauer_min int not null default 90 check (geplante_dauer_min >= 0),
  einreichfrist_tage int not null default 2 check (einreichfrist_tage >= 0),
  status text not null default 'entwurf' check (status in ('entwurf','veroeffentlicht','laeuft','beendet')),
  tatsaechlich_start timestamptz,
  tatsaechlich_ende timestamptz,
  created_at timestamptz not null default now()
);

create table public.tops (
  id uuid primary key default gen_random_uuid(),
  sitzung_id uuid not null references public.sitzungen(id) on delete cascade,
  titel text not null,
  position int not null default 0
);

create table public.unterpunkte (
  id uuid primary key default gen_random_uuid(),
  sitzung_id uuid not null references public.sitzungen(id) on delete cascade,
  top_id uuid references public.tops(id) on delete set null,
  titel text not null,
  beschreibung text not null default '',
  minuten int not null default 5 check (minuten >= 0),
  ziel text not null default 'info' check (ziel in ('entscheidung','info')),
  status text not null default 'geplant' check (status in ('vorschlag','geplant','erledigt','gestrichen')),
  ergebnis text check (ergebnis in ('beschlossen','vertagt','kenntnis')),
  ergebnistext text not null default '',
  eingereicht_von uuid references public.profiles(id) on delete set null,
  uebernommen_aus uuid references public.sitzungen(id) on delete set null,
  position int not null default 0,
  verlaengerung_min int not null default 0,
  gestartet_am timestamptz,
  tatsaechliche_sekunden int
);

create table public.aufgaben (
  id uuid primary key default gen_random_uuid(),
  sitzung_id uuid not null references public.sitzungen(id) on delete cascade,
  unterpunkt_id uuid references public.unterpunkte(id) on delete set null,
  verantwortlicher uuid not null references public.profiles(id),
  was text not null,
  bis_wann date,
  erledigt boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.anwesenheit (
  sitzung_id uuid not null references public.sitzungen(id) on delete cascade,
  mitglied_id uuid not null references public.profiles(id) on delete cascade,
  anwesend boolean not null default true,
  primary key (sitzung_id, mitglied_id)
);

create index on public.unterpunkte (sitzung_id);
create index on public.aufgaben (verantwortlicher);
