-- 006 · Escuela de Formacion: avance por leccion y resultados de evaluacion.
--
-- El contenido (modulos, lecciones, preguntas) vive en el codigo de la app
-- (src/lib/formacion.ts). Aqui solo se guarda lo que hizo cada persona.

create table if not exists formacion_progreso (
  id             uuid primary key default gen_random_uuid(),
  perfil_id      uuid not null references perfiles(id) on delete cascade,
  -- "modulo/leccion", tal como lo arma claveLeccion() en la app.
  leccion_id     text not null,
  completado_en  timestamptz not null default now(),
  unique (perfil_id, leccion_id)
);

create table if not exists formacion_evaluaciones (
  id             uuid primary key default gen_random_uuid(),
  perfil_id      uuid not null references perfiles(id) on delete cascade,
  modulo_id      text not null,
  puntaje        smallint not null check (puntaje between 0 and 100),
  aprobado       boolean not null,
  -- {pregunta_id: indice_elegido}. Sirve para revisar que fallo cada quien.
  respuestas     jsonb not null default '{}'::jsonb,
  respondido_en  timestamptz not null default now()
);

create index if not exists formacion_progreso_perfil_idx on formacion_progreso (perfil_id);
create index if not exists formacion_evaluaciones_perfil_idx on formacion_evaluaciones (perfil_id, modulo_id, respondido_en desc);

alter table formacion_progreso enable row level security;
alter table formacion_evaluaciones enable row level security;

-- Cada quien ve y registra lo suyo. Admin y supervisor ven el avance de todos
-- (es lo que permite saber quien esta capacitado). Nadie edita ni borra: un
-- resultado es un hecho, y el reintento es una fila nueva.
drop policy if exists formacion_progreso_lectura on formacion_progreso;
create policy formacion_progreso_lectura on formacion_progreso
  for select using (perfil_id = auth.uid() or mi_rol() in ('admin', 'supervisor'));

drop policy if exists formacion_progreso_propio on formacion_progreso;
create policy formacion_progreso_propio on formacion_progreso
  for insert with check (perfil_id = auth.uid());

drop policy if exists formacion_evaluaciones_lectura on formacion_evaluaciones;
create policy formacion_evaluaciones_lectura on formacion_evaluaciones
  for select using (perfil_id = auth.uid() or mi_rol() in ('admin', 'supervisor'));

drop policy if exists formacion_evaluaciones_propio on formacion_evaluaciones;
create policy formacion_evaluaciones_propio on formacion_evaluaciones
  for insert with check (perfil_id = auth.uid());
