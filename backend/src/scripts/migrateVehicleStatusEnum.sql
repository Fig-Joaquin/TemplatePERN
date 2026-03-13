BEGIN;

ALTER TYPE public.vehicles_vehicle_status_enum RENAME TO vehicles_vehicle_status_enum_old;

CREATE TYPE public.vehicles_vehicle_status_enum AS ENUM (
  'running',
  'stopped',
  'unknown'
);

ALTER TABLE public.vehicles
  ALTER COLUMN vehicle_status DROP DEFAULT,
  ALTER COLUMN vehicle_status TYPE public.vehicles_vehicle_status_enum
  USING (
    CASE vehicle_status::text
      WHEN 'running' THEN 'running'
      WHEN 'not_running' THEN 'stopped'
      WHEN 'en_marcha' THEN 'running'
      WHEN 'detenido' THEN 'stopped'
      WHEN 'desconocido' THEN 'unknown'
      ELSE 'unknown'
    END
  )::public.vehicles_vehicle_status_enum,
  ALTER COLUMN vehicle_status SET DEFAULT 'unknown'::public.vehicles_vehicle_status_enum;

DROP TYPE public.vehicles_vehicle_status_enum_old;

COMMIT;
