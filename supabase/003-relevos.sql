-- ============================================================================
-- SOTERSA — Migración 003
-- Distingue al personal de relevo (saca francos / saca vacaciones).
--
-- Por qué:
-- Un saca francos no pertenece a un puesto: cubre varios, según quién libra
-- ese día. Su puesto habitual queda vacío a propósito, y su asignación real
-- vive en cada turno. Pero al armar el cuadrante hay que saber quién es
-- relevo y quién es fijo, y eso no se deduce de los datos que ya hay.
-- ============================================================================

alter table guardias
  add column if not exists es_relevo boolean not null default false;

comment on column guardias.es_relevo is
  'Personal de relevo (saca francos / saca vacaciones): cubre distintos puestos, no tiene puesto fijo.';
