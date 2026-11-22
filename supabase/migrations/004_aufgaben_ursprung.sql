-- Offene Aufgaben wandern in die nächste Sitzung; das Protokoll der alten Sitzung soll sie weiter zeigen.
alter table public.aufgaben add column urspruenglich_sitzung_id uuid references public.sitzungen(id) on delete set null;
