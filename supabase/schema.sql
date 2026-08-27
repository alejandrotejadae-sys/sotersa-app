-- ============================================================================
-- SOTERSA — Sistema de operaciones y portal de cliente
-- Esquema base (Fase 1)
--
-- Ejecutar en el SQL Editor de Supabase, de una sola vez.
-- Es idempotente: se puede volver a correr sin romper nada.
--
-- Principios que este archivo hace cumplir DESDE LA BASE DE DATOS, no desde
-- la interfaz (una restriccion que solo vive en la pantalla es falsificable):
--
--   1. Cada quien ve solo lo suyo. Guardia -> su turno. Supervisor -> su zona.
--      Cliente -> sus puestos, y solo lo validado. Admin -> todo.
--   2. El registro original de una novedad es INMUTABLE. La validacion del
--      supervisor agrega informacion, nunca reescribe lo que el guardia puso.
--      Si se pudiera editar la hora o el texto despues, la bitacora no probaria
--      nada ante un cliente, una aseguradora o un juez.
--   3. La hora que vale es la de CAPTURA, no la de sincronizacion.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Tipos
-- ----------------------------------------------------------------------------

do $$ begin
  create type rol_usuario as enum ('guardia', 'supervisor', 'admin', 'cliente');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_turno as enum ('fijo_dia', 'fijo_noche', 'saca_francos', 'supervision');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_turno as enum ('programado', 'abierto', 'cerrado', 'ausente');
exception when duplicate_object then null; end $$;

do $$ begin
  create type severidad_novedad as enum ('informativa', 'novedad', 'emergencia');
exception when duplicate_object then null; end $$;

-- registrada -> validada -> notificada -> cerrada
do $$ begin
  create type estado_novedad as enum ('registrada', 'validada', 'notificada', 'cerrada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_contacto_puesto as enum (
    'central_monitoreo', 'administracion_cliente', 'supervisor_zona', 'jefe_operaciones'
  );
exception when duplicate_object then null; end $$;


-- ----------------------------------------------------------------------------
-- 1. Organizacion
-- ----------------------------------------------------------------------------

create table if not exists zonas (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null unique,
  creado_en   timestamptz not null default now()
);

create table if not exists empresas_cliente (
  id                 uuid primary key default gen_random_uuid(),
  nombre             text not null,
  ruc                text,
  direccion          text,
  contacto_nombre    text,
  contacto_correo    text,
  contacto_telefono  text,
  activo             boolean not null default true,
  creado_en          timestamptz not null default now()
);

-- Perfil de aplicacion. Extiende auth.users: Supabase guarda la credencial,
-- nosotros guardamos quien es y que puede hacer.
create table if not exists perfiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  rol                 rol_usuario not null,
  nombre              text not null,
  telefono            text,
  activo              boolean not null default true,
  -- Solo para rol 'cliente': a que empresa pertenece.
  empresa_cliente_id  uuid references empresas_cliente(id) on delete restrict,
  -- Solo para rol 'supervisor': que zona supervisa.
  zona_id             uuid references zonas(id) on delete set null,
  creado_en           timestamptz not null default now(),

  constraint cliente_tiene_empresa check (
    rol <> 'cliente' or empresa_cliente_id is not null
  ),
  constraint supervisor_tiene_zona check (
    rol <> 'supervisor' or zona_id is not null
  )
);

-- Datos propios del personal de seguridad. Separado de 'perfiles' porque la
-- cedula y la credencial son datos del guardia, no de la cuenta.
create table if not exists guardias (
  id          uuid primary key default gen_random_uuid(),
  perfil_id   uuid unique references perfiles(id) on delete cascade,
  cedula      text not null unique,
  credencial  text,
  nombre      text not null,
  telefono    text,
  activo      boolean not null default true,
  creado_en   timestamptz not null default now()
);


-- ----------------------------------------------------------------------------
-- 2. Puestos y puntos de ronda
-- ----------------------------------------------------------------------------

create table if not exists puestos (
  id                  uuid primary key default gen_random_uuid(),
  empresa_cliente_id  uuid not null references empresas_cliente(id) on delete restrict,
  zona_id             uuid references zonas(id) on delete set null,
  codigo              text not null,              -- P-01, P-02...
  nombre              text not null,              -- "Lobby y acceso peatonal"
  cobertura_horas     smallint not null default 24 check (cobertura_horas between 1 and 24),
  armado              boolean not null default false,
  direccion           text,
  lat                 double precision,
  lng                 double precision,
  activo              boolean not null default true,
  creado_en           timestamptz not null default now(),

  unique (empresa_cliente_id, codigo)
);

-- Los contactos que el arte impreso marca como "COMPLETAR EN CADA PUESTO".
-- En papel se llenan a mano y se desactualizan; aqui se configuran una vez.
create table if not exists contactos_puesto (
  id         uuid primary key default gen_random_uuid(),
  puesto_id  uuid not null references puestos(id) on delete cascade,
  tipo       tipo_contacto_puesto not null,
  nombre     text,
  telefono   text not null,

  unique (puesto_id, tipo)
);

create table if not exists puntos_ronda (
  id         uuid primary key default gen_random_uuid(),
  puesto_id  uuid not null references puestos(id) on delete cascade,
  codigo     text not null,
  nombre     text not null,               -- "Subsuelo 2 - salida de emergencia"
  -- Token impreso en el QR. No es un secreto: el sticker esta a la vista en el
  -- sitio. Solo identifica el punto; la prueba de presencia la dan la hora de
  -- captura y el GPS, no el token.
  -- gen_random_uuid() es nucleo de Postgres desde la 13: asi el esquema no
  -- depende de la extension pgcrypto para nada.
  token      text not null unique default replace(gen_random_uuid()::text, '-', ''),
  orden      smallint not null default 0,
  activo     boolean not null default true,
  creado_en  timestamptz not null default now(),

  unique (puesto_id, codigo)
);


-- ----------------------------------------------------------------------------
-- 3. Turnos y apertura de puesto
-- ----------------------------------------------------------------------------

create table if not exists turnos (
  id                 uuid primary key default gen_random_uuid(),
  puesto_id          uuid not null references puestos(id) on delete restrict,
  guardia_id         uuid not null references guardias(id) on delete restrict,
  tipo               tipo_turno not null,
  inicio_programado  timestamptz not null,
  fin_programado     timestamptz not null,
  estado             estado_turno not null default 'programado',
  creado_en          timestamptz not null default now(),

  constraint turno_coherente check (fin_programado > inicio_programado)
);

create index if not exists turnos_puesto_inicio_idx on turnos (puesto_id, inicio_programado desc);
create index if not exists turnos_guardia_inicio_idx on turnos (guardia_id, inicio_programado desc);

-- Apertura y relevo. Sale literal de Normas de la Garita:
--   "Verifica al iniciar el turno: radio, camaras, linterna y bitacora"
--   "Entrega el puesto limpio: quien recibe verifica y firma"
create table if not exists aperturas_turno (
  id                    uuid primary key default gen_random_uuid(),
  turno_id              uuid not null unique references turnos(id) on delete cascade,
  hora_captura          timestamptz not null,
  hora_sync             timestamptz not null default now(),
  -- { "radio": true, "camaras": true, "linterna": false, "bitacora": true }
  checklist             jsonb not null default '{}'::jsonb,
  estado_puesto         text,               -- como se recibio el puesto
  observacion           text,
  foto_url              text,
  firma_entrante_url    text,
  firma_saliente_url    text,
  guardia_saliente_id   uuid references guardias(id) on delete set null,

  -- Un reloj de telefono se puede adelantar. Que la captura quede en el futuro
  -- respecto del servidor es imposible: se rechaza en vez de guardar basura.
  constraint captura_no_futura check (hora_captura <= hora_sync + interval '5 minutes')
);


-- ----------------------------------------------------------------------------
-- 4. Novedades — la bitacora
-- ----------------------------------------------------------------------------

create table if not exists novedades (
  id              uuid primary key default gen_random_uuid(),
  puesto_id       uuid not null references puestos(id) on delete restrict,
  turno_id        uuid references turnos(id) on delete set null,
  guardia_id      uuid references guardias(id) on delete set null,

  -- === Bloque inmutable: lo que registro el guardia ===
  tipo            text not null,
  severidad       severidad_novedad not null default 'novedad',
  descripcion     text not null,
  foto_url        text,
  lat             double precision,
  lng             double precision,
  hora_captura    timestamptz not null,
  hora_sync       timestamptz not null default now(),

  -- === Bloque de gestion: lo que agrega SOTERSA despues ===
  estado          estado_novedad not null default 'registrada',
  -- El cliente NO ve el crudo. Una novedad de disciplina interna se guarda
  -- igual, con su hora original, pero no se publica en el portal.
  visible_cliente boolean not null default false,
  validada_por    uuid references perfiles(id) on delete set null,
  validada_en     timestamptz,
  notificada_en   timestamptz,
  nota_supervisor text,

  constraint captura_no_futura check (hora_captura <= hora_sync + interval '5 minutes')
);

create index if not exists novedades_puesto_captura_idx on novedades (puesto_id, hora_captura desc);
create index if not exists novedades_estado_idx on novedades (estado) where estado = 'registrada';

-- Cumplimiento del SLA de aviso (15 min comprometidos a Citimed).
-- Se calcula de hora_captura a notificada_en: deja de ser una promesa
-- comercial y pasa a ser un numero que el cliente verifica.
-- security_invoker: la vista se ejecuta con los permisos de QUIEN LA CONSULTA,
-- no de quien la creo. Sin esto, la vista se salta el RLS de 'novedades' y le
-- muestra a un cliente el SLA de los demas. No es teorico: se detecto asi.
create or replace view v_sla_novedades with (security_invoker = true) as
select
  n.id,
  n.puesto_id,
  p.empresa_cliente_id,
  n.severidad,
  n.hora_captura,
  n.notificada_en,
  round(extract(epoch from (n.notificada_en - n.hora_captura)) / 60.0, 1) as minutos_aviso,
  (n.notificada_en is not null
    and n.notificada_en <= n.hora_captura + interval '15 minutes') as cumple_sla
from novedades n
join puestos p on p.id = n.puesto_id
where n.severidad in ('novedad', 'emergencia');


-- ----------------------------------------------------------------------------
-- 5. Rondas
-- ----------------------------------------------------------------------------

create table if not exists rondas (
  id            uuid primary key default gen_random_uuid(),
  turno_id      uuid not null references turnos(id) on delete cascade,
  punto_id      uuid not null references puntos_ronda(id) on delete restrict,
  guardia_id    uuid references guardias(id) on delete set null,
  hora_captura  timestamptz not null,
  hora_sync     timestamptz not null default now(),
  lat           double precision,
  lng           double precision,

  constraint captura_no_futura check (hora_captura <= hora_sync + interval '5 minutes')
);

create index if not exists rondas_turno_idx on rondas (turno_id, hora_captura desc);


-- ----------------------------------------------------------------------------
-- 6. La regla que hace que la bitacora sirva: inmutabilidad
-- ----------------------------------------------------------------------------

create or replace function bloquear_edicion_novedad()
returns trigger
language plpgsql
as $$
begin
  if new.tipo         is distinct from old.tipo
  or new.severidad    is distinct from old.severidad
  or new.descripcion  is distinct from old.descripcion
  or new.foto_url     is distinct from old.foto_url
  or new.hora_captura is distinct from old.hora_captura
  or new.guardia_id   is distinct from old.guardia_id
  or new.puesto_id    is distinct from old.puesto_id
  or new.lat          is distinct from old.lat
  or new.lng          is distinct from old.lng
  then
    raise exception
      'El registro original de una novedad es inmutable. Para corregir o matizar, use nota_supervisor.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_novedad_inmutable on novedades;
create trigger trg_novedad_inmutable
  before update on novedades
  for each row execute function bloquear_edicion_novedad();

-- Nadie borra una novedad. Ni el admin.
create or replace function bloquear_borrado_novedad()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Una novedad no se borra. Cierrela con estado = cerrada.';
end;
$$;

drop trigger if exists trg_novedad_sin_borrado on novedades;
create trigger trg_novedad_sin_borrado
  before delete on novedades
  for each row execute function bloquear_borrado_novedad();

-- Sellos de tiempo automaticos al cambiar de estado.
create or replace function sellar_estado_novedad()
returns trigger
language plpgsql
as $$
begin
  if new.estado = 'validada' and old.estado = 'registrada' and new.validada_en is null then
    new.validada_en := now();
    new.validada_por := coalesce(new.validada_por, auth.uid());
  end if;
  if new.estado = 'notificada' and new.notificada_en is null then
    new.notificada_en := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_novedad_sellos on novedades;
create trigger trg_novedad_sellos
  before update on novedades
  for each row execute function sellar_estado_novedad();


-- ----------------------------------------------------------------------------
-- 7. Funciones de identidad
--
-- Van en SECURITY DEFINER a proposito: si una politica RLS sobre 'perfiles'
-- consultara 'perfiles', la politica se llamaria a si misma en un bucle
-- infinito. Estas funciones leen saltandose RLS y devuelven solo un dato.
-- ----------------------------------------------------------------------------

create or replace function mi_rol()
returns rol_usuario
language sql stable security definer set search_path = public
as $$ select rol from perfiles where id = auth.uid() and activo $$;

create or replace function mi_empresa_cliente()
returns uuid
language sql stable security definer set search_path = public
as $$ select empresa_cliente_id from perfiles where id = auth.uid() and activo $$;

create or replace function mi_zona()
returns uuid
language sql stable security definer set search_path = public
as $$ select zona_id from perfiles where id = auth.uid() and activo $$;

create or replace function mi_guardia_id()
returns uuid
language sql stable security definer set search_path = public
as $$ select g.id from guardias g where g.perfil_id = auth.uid() and g.activo $$;

create or replace function es_admin()
returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce(mi_rol() = 'admin', false) $$;

-- --- Rompedores de ciclo -----------------------------------------------------
--
-- Sin estas funciones las politicas se muerden la cola: la de 'puestos'
-- consultaba 'turnos', y la de 'turnos' consultaba 'puestos'. Postgres lo
-- detecta y aborta con "infinite recursion detected in policy". Al ir en
-- SECURITY DEFINER, estas lecturas se saltan RLS y el ciclo se corta.
--
-- Devuelven un solo dato y no filtran nada sensible: a quien pertenece un
-- puesto y en que zona esta.

create or replace function puesto_empresa(p_puesto uuid)
returns uuid
language sql stable security definer set search_path = public
as $$ select empresa_cliente_id from puestos where id = p_puesto $$;

create or replace function puesto_zona(p_puesto uuid)
returns uuid
language sql stable security definer set search_path = public
as $$ select zona_id from puestos where id = p_puesto $$;

create or replace function turno_es_mio(p_turno uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from turnos t
    where t.id = p_turno and t.guardia_id = mi_guardia_id()
  )
$$;

create or replace function guardia_tiene_turno_en(p_puesto uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from turnos t
    where t.puesto_id = p_puesto and t.guardia_id = mi_guardia_id()
  )
$$;


-- ----------------------------------------------------------------------------
-- 8. RLS
-- ----------------------------------------------------------------------------

alter table zonas             enable row level security;
alter table empresas_cliente  enable row level security;
alter table perfiles          enable row level security;
alter table guardias          enable row level security;
alter table puestos           enable row level security;
alter table contactos_puesto  enable row level security;
alter table puntos_ronda      enable row level security;
alter table turnos            enable row level security;
alter table aperturas_turno   enable row level security;
alter table novedades         enable row level security;
alter table rondas            enable row level security;

-- --- perfiles ---------------------------------------------------------------
drop policy if exists perfiles_lectura_propia on perfiles;
create policy perfiles_lectura_propia on perfiles
  for select using (id = auth.uid() or es_admin());

drop policy if exists perfiles_admin_escribe on perfiles;
create policy perfiles_admin_escribe on perfiles
  for all using (es_admin()) with check (es_admin());

-- --- catalogos (zonas, empresas, guardias) ----------------------------------
drop policy if exists zonas_lectura on zonas;
create policy zonas_lectura on zonas for select using (auth.uid() is not null);

drop policy if exists zonas_admin on zonas;
create policy zonas_admin on zonas for all using (es_admin()) with check (es_admin());

drop policy if exists empresas_lectura on empresas_cliente;
create policy empresas_lectura on empresas_cliente
  for select using (es_admin() or id = mi_empresa_cliente());

drop policy if exists empresas_admin on empresas_cliente;
create policy empresas_admin on empresas_cliente
  for all using (es_admin()) with check (es_admin());

drop policy if exists guardias_lectura on guardias;
create policy guardias_lectura on guardias
  for select using (
    es_admin()
    or perfil_id = auth.uid()
    or mi_rol() = 'supervisor'
  );

drop policy if exists guardias_admin on guardias;
create policy guardias_admin on guardias for all using (es_admin()) with check (es_admin());

-- --- puestos ----------------------------------------------------------------
-- Cliente: solo los puestos de su empresa.
-- Supervisor: solo los de su zona.
-- Guardia: solo aquellos donde tiene turno asignado.
drop policy if exists puestos_lectura on puestos;
create policy puestos_lectura on puestos
  for select using (
    es_admin()
    or empresa_cliente_id = mi_empresa_cliente()
    or (mi_rol() = 'supervisor' and zona_id = mi_zona())
    or guardia_tiene_turno_en(id)
  );

drop policy if exists puestos_admin on puestos;
create policy puestos_admin on puestos for all using (es_admin()) with check (es_admin());

drop policy if exists contactos_lectura on contactos_puesto;
create policy contactos_lectura on contactos_puesto
  for select using (
    exists (select 1 from puestos p where p.id = contactos_puesto.puesto_id)
  );

drop policy if exists contactos_admin on contactos_puesto;
create policy contactos_admin on contactos_puesto
  for all using (es_admin()) with check (es_admin());

drop policy if exists puntos_lectura on puntos_ronda;
create policy puntos_lectura on puntos_ronda
  for select using (
    exists (select 1 from puestos p where p.id = puntos_ronda.puesto_id)
  );

drop policy if exists puntos_admin on puntos_ronda;
create policy puntos_admin on puntos_ronda for all using (es_admin()) with check (es_admin());

-- --- turnos -----------------------------------------------------------------
drop policy if exists turnos_lectura on turnos;
create policy turnos_lectura on turnos
  for select using (
    es_admin()
    or guardia_id = mi_guardia_id()
    or (mi_rol() = 'supervisor' and puesto_zona(puesto_id) = mi_zona())
  );

drop policy if exists turnos_admin on turnos;
create policy turnos_admin on turnos for all using (es_admin()) with check (es_admin());

-- El guardia marca su propio turno como abierto/cerrado, nada mas.
drop policy if exists turnos_guardia_actualiza on turnos;
create policy turnos_guardia_actualiza on turnos
  for update using (guardia_id = mi_guardia_id())
  with check (guardia_id = mi_guardia_id());

-- --- aperturas de turno -----------------------------------------------------
drop policy if exists aperturas_lectura on aperturas_turno;
create policy aperturas_lectura on aperturas_turno
  for select using (
    exists (select 1 from turnos t where t.id = aperturas_turno.turno_id)
  );

drop policy if exists aperturas_guardia_inserta on aperturas_turno;
create policy aperturas_guardia_inserta on aperturas_turno
  for insert with check (turno_es_mio(turno_id));

-- --- novedades --------------------------------------------------------------
-- El guardia inserta solo en su propio turno y solo como 'registrada'.
drop policy if exists novedades_guardia_inserta on novedades;
create policy novedades_guardia_inserta on novedades
  for insert with check (
    guardia_id = mi_guardia_id()
    and estado = 'registrada'
    and visible_cliente = false
    and turno_es_mio(turno_id)
  );

-- El cliente ve SOLO lo de su empresa, marcado visible y ya validado.
-- Una novedad en 'registrada' todavia no paso por supervision: no se publica.
drop policy if exists novedades_lectura on novedades;
create policy novedades_lectura on novedades
  for select using (
    es_admin()
    or guardia_id = mi_guardia_id()
    or (mi_rol() = 'supervisor' and puesto_zona(puesto_id) = mi_zona())
    or (mi_rol() = 'cliente'
        and visible_cliente
        and estado in ('validada', 'notificada', 'cerrada')
        and puesto_empresa(puesto_id) = mi_empresa_cliente())
  );

-- Validar es de supervisor y admin. El trigger de inmutabilidad impide que
-- esta politica sirva para reescribir lo que el guardia registro.
drop policy if exists novedades_supervisor_valida on novedades;
create policy novedades_supervisor_valida on novedades
  for update using (
    es_admin()
    or (mi_rol() = 'supervisor' and puesto_zona(puesto_id) = mi_zona())
  );

-- --- rondas -----------------------------------------------------------------
drop policy if exists rondas_lectura on rondas;
create policy rondas_lectura on rondas
  for select using (
    exists (select 1 from turnos t where t.id = rondas.turno_id)
  );

drop policy if exists rondas_guardia_inserta on rondas;
create policy rondas_guardia_inserta on rondas
  for insert with check (turno_es_mio(turno_id));


-- ----------------------------------------------------------------------------
-- 9. Alerta de puesto vacio
--
-- El supervisor no deberia tener que adivinar si alguien llego. Este vista
-- lista los turnos que ya debieron abrirse y no se abrieron.
-- ----------------------------------------------------------------------------

-- Igual que v_sla_novedades: sin security_invoker, un cliente veria los turnos
-- sin abrir de OTROS clientes.
create or replace view v_puestos_sin_apertura with (security_invoker = true) as
select
  t.id as turno_id,
  t.puesto_id,
  p.codigo   as puesto_codigo,
  p.nombre   as puesto_nombre,
  p.zona_id,
  p.empresa_cliente_id,
  g.nombre   as guardia_nombre,
  g.telefono as guardia_telefono,
  t.inicio_programado,
  round(extract(epoch from (now() - t.inicio_programado)) / 60.0) as minutos_de_retraso
from turnos t
join puestos p  on p.id = t.puesto_id
join guardias g on g.id = t.guardia_id
left join aperturas_turno a on a.turno_id = t.id
where a.id is null
  and t.estado = 'programado'
  and t.inicio_programado < now() - interval '15 minutes'
  and t.inicio_programado > now() - interval '24 hours';


-- ----------------------------------------------------------------------------
-- 10. Alta de perfil al crear el usuario
--
-- El rol NUNCA sale de lo que el cliente manda: sale de la metadata que puso
-- el panel interno con la llave de servicio. Un usuario que pudiera declarar
-- su propio rol podria declararse admin.
-- ----------------------------------------------------------------------------

create or replace function crear_perfil_nuevo_usuario()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into perfiles (id, rol, nombre, empresa_cliente_id, zona_id)
  values (
    new.id,
    coalesce((new.raw_app_meta_data ->> 'rol')::rol_usuario, 'guardia'),
    coalesce(new.raw_user_meta_data ->> 'nombre', 'Sin nombre'),
    nullif(new.raw_app_meta_data ->> 'empresa_cliente_id', '')::uuid,
    nullif(new.raw_app_meta_data ->> 'zona_id', '')::uuid
  );
  return new;
end;
$$;

drop trigger if exists trg_nuevo_usuario on auth.users;
create trigger trg_nuevo_usuario
  after insert on auth.users
  for each row execute function crear_perfil_nuevo_usuario();
