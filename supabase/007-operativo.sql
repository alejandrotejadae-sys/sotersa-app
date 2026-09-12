-- 007 · Rol "operativo": ve todo lo que ve el administrador, no escribe nada.
--
-- Se aplica en DOS ejecuciones separadas en el SQL Editor. Postgres no
-- permite usar un valor nuevo de un enum en la misma transaccion en que se
-- agrega; si se corre todo junto, las politicas fallan con "unsafe use of
-- new value".

-- ===== EJECUCION 1 =========================================================
alter type rol_usuario add value if not exists 'operativo';

-- ===== EJECUCION 2 =========================================================
-- Quien puede leer todo. es_admin() queda solo para escribir.
create or replace function es_lector()
returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce(mi_rol()::text in ('admin', 'operativo'), false) $$;

-- Politicas de lectura donde antes decia es_admin(). Las de escritura no se
-- tocan: siguen exigiendo es_admin().
drop policy if exists perfiles_lectura_propia on perfiles;
create policy perfiles_lectura_propia on perfiles
  for select using (id = auth.uid() or es_lector());

drop policy if exists empresas_lectura on empresas_cliente;
create policy empresas_lectura on empresas_cliente
  for select using (es_lector() or id = mi_empresa_cliente());

drop policy if exists guardias_lectura on guardias;
create policy guardias_lectura on guardias
  for select using (
    es_lector()
    or perfil_id = auth.uid()
    or mi_rol() = 'supervisor'
  );

drop policy if exists puestos_lectura on puestos;
create policy puestos_lectura on puestos
  for select using (
    es_lector()
    or empresa_cliente_id = mi_empresa_cliente()
    or (mi_rol() = 'supervisor' and zona_id = mi_zona())
    or guardia_tiene_turno_en(id)
  );

drop policy if exists turnos_lectura on turnos;
create policy turnos_lectura on turnos
  for select using (
    es_lector()
    or guardia_id = mi_guardia_id()
    or (mi_rol() = 'supervisor' and puesto_zona(puesto_id) = mi_zona())
  );

drop policy if exists novedades_lectura on novedades;
create policy novedades_lectura on novedades
  for select using (
    es_lector()
    or guardia_id = mi_guardia_id()
    or (mi_rol() = 'supervisor' and puesto_zona(puesto_id) = mi_zona())
    or (mi_rol() = 'cliente'
        and visible_cliente
        and estado in ('validada', 'notificada', 'cerrada')
        and puesto_empresa(puesto_id) = mi_empresa_cliente())
  );

drop policy if exists consentimientos_lectura on consentimientos;
create policy consentimientos_lectura on consentimientos
  for select using (perfil_id = auth.uid() or es_lector());

drop policy if exists formacion_progreso_lectura on formacion_progreso;
create policy formacion_progreso_lectura on formacion_progreso
  for select using (perfil_id = auth.uid() or mi_rol()::text in ('admin', 'supervisor', 'operativo'));

drop policy if exists formacion_evaluaciones_lectura on formacion_evaluaciones;
create policy formacion_evaluaciones_lectura on formacion_evaluaciones
  for select using (perfil_id = auth.uid() or mi_rol()::text in ('admin', 'supervisor', 'operativo'));

-- contactos_puesto, puntos_ronda, aperturas_turno y rondas se leen a traves
-- de puestos/turnos, asi que heredan la ampliacion sin cambios.
