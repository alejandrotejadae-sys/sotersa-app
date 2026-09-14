-- 009 - El supervisor programa turnos en los puestos que supervisa.
--
-- Hasta ahora solo el admin escribia en turnos (turnos_admin). Con la
-- supervision por supervisor (008), quien conoce la operacion del puesto es
-- quien arma el cuadrante. Solo puede tocar turnos de SUS puestos; no puede
-- borrar (nada se borra en la app: un turno que no se cubre queda 'ausente').

drop policy if exists turnos_supervisor_programa on turnos;
create policy turnos_supervisor_programa on turnos
  for insert with check (
    mi_rol() = 'supervisor' and supervisa_puesto(puesto_id)
  );

drop policy if exists turnos_supervisor_ajusta on turnos;
create policy turnos_supervisor_ajusta on turnos
  for update using (
    mi_rol() = 'supervisor' and supervisa_puesto(puesto_id)
  ) with check (
    mi_rol() = 'supervisor' and supervisa_puesto(puesto_id)
  );
