-- 010 - Saca francos por puesto.
--
-- Un agente fijo pertenece a un puesto (guardias.puesto_habitual_id). El
-- saca francos no: cubre los dias libres de varios puestos, incluso de
-- distintos clientes. Esta tabla dice que relevos cubren cada puesto.

create table if not exists relevos_puesto (
  puesto_id   uuid not null references puestos(id) on delete cascade,
  guardia_id  uuid not null references guardias(id) on delete cascade,
  creado_en   timestamptz not null default now(),
  primary key (puesto_id, guardia_id)
);
create index if not exists relevos_puesto_guardia_idx on relevos_puesto (guardia_id);

alter table relevos_puesto enable row level security;

-- Lectura: admin/operativo todo; supervisor lo de sus puestos; cliente lo de
-- sus puestos (ve al relevo igual que ve al fijo); el propio agente lo suyo.
drop policy if exists relevos_lectura on relevos_puesto;
create policy relevos_lectura on relevos_puesto
  for select using (
    es_lector()
    or (mi_rol() = 'supervisor' and supervisa_puesto(puesto_id))
    or (mi_rol() = 'cliente' and puesto_empresa(puesto_id) = mi_empresa_cliente())
    or guardia_id = mi_guardia_id()
  );

drop policy if exists relevos_admin on relevos_puesto;
create policy relevos_admin on relevos_puesto
  for all using (es_admin()) with check (es_admin());
