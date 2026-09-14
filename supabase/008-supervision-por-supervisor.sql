-- 008 - Supervision asignada por supervisor, no por zona.
--
-- Antes: perfil.zona_id -> puestos.zona_id. Un supervisor veia los puestos de
-- su zona. Ahora: tabla supervision_puestos (supervisor, puesto). El admin
-- asigna puestos a cada supervisor directamente; un puesto puede tener mas
-- de un supervisor (dia/noche) y un supervisor cualquier combinacion de
-- puestos. Las zonas quedan como dato opcional y ya no gobiernan el acceso.
--
-- Se aplica en UNA ejecucion.

create table if not exists supervision_puestos (
  supervisor_id uuid not null references perfiles(id) on delete cascade,
  puesto_id     uuid not null references puestos(id) on delete cascade,
  creado_en     timestamptz not null default now(),
  primary key (supervisor_id, puesto_id)
);
create index if not exists supervision_puestos_puesto_idx on supervision_puestos (puesto_id);

alter table supervision_puestos enable row level security;

drop policy if exists supervision_lectura on supervision_puestos;
create policy supervision_lectura on supervision_puestos
  for select using (supervisor_id = auth.uid() or es_lector());

drop policy if exists supervision_admin on supervision_puestos;
create policy supervision_admin on supervision_puestos
  for all using (es_admin()) with check (es_admin());

-- Quien consulta, supervisa este puesto?
create or replace function supervisa_puesto(p_puesto uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from supervision_puestos
    where supervisor_id = auth.uid() and puesto_id = p_puesto
  )
$$;

-- La zona deja de ser obligatoria para el supervisor.
alter table perfiles drop constraint if exists supervisor_tiene_zona;

-- Politicas que antes miraban la zona.
drop policy if exists puestos_lectura on puestos;
create policy puestos_lectura on puestos
  for select using (
    es_lector()
    or empresa_cliente_id = mi_empresa_cliente()
    or (mi_rol() = 'supervisor' and supervisa_puesto(id))
    or guardia_tiene_turno_en(id)
  );

drop policy if exists turnos_lectura on turnos;
create policy turnos_lectura on turnos
  for select using (
    es_lector()
    or guardia_id = mi_guardia_id()
    or (mi_rol() = 'supervisor' and supervisa_puesto(puesto_id))
  );

drop policy if exists novedades_lectura on novedades;
create policy novedades_lectura on novedades
  for select using (
    es_lector()
    or guardia_id = mi_guardia_id()
    or (mi_rol() = 'supervisor' and supervisa_puesto(puesto_id))
    or (mi_rol() = 'cliente'
        and visible_cliente
        and estado in ('validada', 'notificada', 'cerrada')
        and puesto_empresa(puesto_id) = mi_empresa_cliente())
  );

drop policy if exists novedades_supervisor_valida on novedades;
create policy novedades_supervisor_valida on novedades
  for update using (
    es_admin()
    or (mi_rol() = 'supervisor' and supervisa_puesto(puesto_id))
  );

-- Migracion de datos: lo que hoy este asignado por zona pasa al supervisor
-- de esa zona, para no perder nada.
insert into supervision_puestos (supervisor_id, puesto_id)
select p.id, pu.id
from perfiles p
join puestos pu on pu.zona_id = p.zona_id
where p.rol = 'supervisor' and p.activo and p.zona_id is not null
on conflict do nothing;
