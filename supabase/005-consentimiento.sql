-- ============================================================================
-- SOTERSA — Migración 005
-- Registro de consentimiento para el tratamiento de datos personales (LOPDP).
--
-- Base legal elegida por SOTERSA: CONSENTIMIENTO.
-- Eso obliga a tres cosas que esta tabla hace posibles:
--   1. Pedirlo antes de tratar los datos.
--   2. Poder demostrar QUIÉN lo dio, CUÁNDO y SOBRE QUÉ TEXTO.
--   3. Permitir retirarlo.
--
-- El punto 2 es el que se suele hacer mal. Guardar solo "aceptó = true" no
-- prueba nada: si el aviso cambia después, nadie puede saber qué fue lo que
-- esa persona aceptó. Por eso se guarda la versión y un resumen del texto.
-- ============================================================================

create table if not exists consentimientos (
  id            uuid primary key default gen_random_uuid(),
  perfil_id     uuid not null references perfiles(id) on delete cascade,

  -- Versión del aviso de privacidad que se aceptó.
  version       text not null,
  -- Copia del texto vigente al aceptar. Si mañana cambia el aviso, esta fila
  -- sigue probando qué se le mostró a esta persona ese día.
  resumen_aviso text not null,

  aceptado_en   timestamptz not null default now(),
  -- Retirar el consentimiento no borra la fila: la deja con fecha de retiro.
  -- Borrarla eliminaría la prueba de que en su momento sí se dio.
  retirado_en   timestamptz,

  unique (perfil_id, version)
);

create index if not exists consentimientos_perfil_idx
  on consentimientos (perfil_id);

alter table consentimientos enable row level security;

-- Cada quien ve y gestiona el suyo. El admin ve todos, porque es quien tiene
-- que responder ante la autoridad si alguien pregunta.
drop policy if exists consentimientos_lectura on consentimientos;
create policy consentimientos_lectura on consentimientos
  for select using (perfil_id = auth.uid() or es_admin());

drop policy if exists consentimientos_propio_inserta on consentimientos;
create policy consentimientos_propio_inserta on consentimientos
  for insert with check (perfil_id = auth.uid());

-- Solo para marcar el retiro. El trigger de abajo impide que se use para
-- reescribir la aceptación original.
drop policy if exists consentimientos_propio_retira on consentimientos;
create policy consentimientos_propio_retira on consentimientos
  for update using (perfil_id = auth.uid()) with check (perfil_id = auth.uid());

-- Lo aceptado es inmutable: solo puede cambiar la fecha de retiro. Si se
-- pudiera editar la versión o el texto después, el registro no probaría nada.
create or replace function bloquear_edicion_consentimiento()
returns trigger
language plpgsql
as $$
begin
  if new.perfil_id     is distinct from old.perfil_id
  or new.version       is distinct from old.version
  or new.resumen_aviso is distinct from old.resumen_aviso
  or new.aceptado_en   is distinct from old.aceptado_en
  then
    raise exception
      'Un consentimiento no se reescribe. Solo puede marcarse como retirado.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_consentimiento_inmutable on consentimientos;
create trigger trg_consentimiento_inmutable
  before update on consentimientos
  for each row execute function bloquear_edicion_consentimiento();

comment on table consentimientos is
  'Prueba de consentimiento LOPDP: quién aceptó, cuándo y sobre qué texto.';
