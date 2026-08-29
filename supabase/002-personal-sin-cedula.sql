-- ============================================================================
-- SOTERSA — Migración 002
-- Permite cargar personal antes de tener su cédula.
--
-- Ejecutar en el SQL Editor de Supabase, de una sola vez. Es idempotente.
--
-- Por qué:
-- El cuadro de costos trae la nómina completa con nombres y puesto, pero sin
-- cédulas. Un guardia existe en la nómina antes de que Talento Humano capture
-- su documento, y el sistema tiene que poder reflejarlo.
--
-- La cédula sigue siendo el usuario de ingreso: sin ella el guardia está en la
-- nómina pero no puede entrar a la app. Eso es correcto, no un defecto.
-- ============================================================================

-- 1. La cédula deja de ser obligatoria...
alter table guardias alter column cedula drop not null;

-- 2. ...pero sigue siendo única CUANDO existe. Un índice parcial permite
--    muchos nulos y a la vez impide dos guardias con la misma cédula.
alter table guardias drop constraint if exists guardias_cedula_key;
drop index if exists guardias_cedula_unica;
create unique index guardias_cedula_unica
  on guardias (cedula)
  where cedula is not null;

-- 3. Puesto habitual: dónde trabaja normalmente.
--    El turno sigue siendo la asignación real del día; esto es solo la
--    referencia de plantilla que trae la nómina.
alter table guardias
  add column if not exists puesto_habitual_id uuid
  references puestos(id) on delete set null;

create index if not exists guardias_puesto_habitual_idx
  on guardias (puesto_habitual_id);
