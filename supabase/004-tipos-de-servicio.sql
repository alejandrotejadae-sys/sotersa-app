-- ============================================================================
-- SOTERSA — Migración 004
-- Tipo de servicio del puesto, y ruta para custodia armada.
--
-- Hasta ahora un puesto solo tenía "cobertura_horas", que no distingue un
-- punto de lunes a domingo de uno de lunes a sábado, ni un diurno de un
-- nocturno. Eso es justo lo que cambia el precio y la dotación, así que tiene
-- que ser un dato propio y no algo que se deduzca.
-- ============================================================================

do $$ begin
  create type tipo_servicio as enum (
    'punto_24_l_d',      -- Punto 24 h, lunes a domingo
    'punto_12_l_d',      -- Punto 12 h, lunes a domingo
    'punto_12_l_s',      -- Punto 12 h, lunes a sábado
    'punto_12_diurno',   -- 12 h diurno
    'punto_12_nocturno', -- 12 h nocturno
    'horario_especial',  -- Horario especial (se detalla en el nombre)
    'custodia_armada'    -- Custodia armada, con origen y destino
  );
exception when duplicate_object then null; end $$;

alter table puestos
  add column if not exists tipo_servicio tipo_servicio not null default 'punto_24_l_d',
  -- Solo para custodia armada. Texto porque una dirección de Quito rara vez
  -- entra completa en unas coordenadas, y el guardia necesita leerla.
  add column if not exists origen  text,
  add column if not exists destino text,
  -- Coordenadas opcionales, para ubicarlos en el mapa de la custodia.
  add column if not exists origen_lat   double precision,
  add column if not exists origen_lng   double precision,
  add column if not exists destino_lat  double precision,
  add column if not exists destino_lng  double precision;

-- Una custodia armada sin origen ni destino no es una ruta: es un registro a
-- medias que nadie puede ejecutar. Se impide desde la base, no desde el
-- formulario, porque el formulario no es el único camino a la tabla.
alter table puestos drop constraint if exists custodia_con_ruta;
alter table puestos add constraint custodia_con_ruta check (
  tipo_servicio <> 'custodia_armada'
  or (origen is not null and destino is not null)
);

-- Los puestos que ya existen son todos de 24 h de lunes a domingo, que es el
-- valor por omisión. Se deja explícito por si alguno tuviera otra cobertura.
update puestos
   set tipo_servicio = case
         when cobertura_horas >= 24 then 'punto_24_l_d'::tipo_servicio
         else 'punto_12_l_d'::tipo_servicio
       end
 where tipo_servicio = 'punto_24_l_d'
   and cobertura_horas < 24;

comment on column puestos.tipo_servicio is
  'Modalidad contratada. Define la dotación y es la base de la cotización.';
comment on column puestos.origen is
  'Custodia armada: punto de partida de la ruta.';
comment on column puestos.destino is
  'Custodia armada: punto de llegada de la ruta.';
