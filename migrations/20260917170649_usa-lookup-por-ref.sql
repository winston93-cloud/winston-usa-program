-- Lookup por alumno_ref (entero Winston) y columna en usa_programa_alumno

ALTER TABLE public.usa_programa_alumno
  ADD COLUMN IF NOT EXISTS alumno_ref INTEGER;

CREATE INDEX IF NOT EXISTS usa_programa_alumno_ref_idx
  ON public.usa_programa_alumno (alumno_ref);

CREATE OR REPLACE FUNCTION public.usa_lookup_alumno_por_ref(p_ref integer)
RETURNS TABLE (
  alumno_id integer,
  alumno_ref integer,
  matricula text,
  nombre_completo text,
  nivel text,
  grado text,
  curp text,
  fecha_nacimiento text,
  correo_tutor text,
  tipo_incorporacion text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
STABLE
AS $$
  SELECT
    a.alumno_id,
    a.alumno_ref,
    COALESCE(d.alumno_clave, '')::text,
    trim(
      both ' '
      from concat_ws(' ', a.alumno_nombre, a.alumno_app, a.alumno_apm)
    ),
    CASE a.alumno_nivel
      WHEN 1 THEN 'Kinder'
      WHEN 2 THEN 'Primaria'
      WHEN 3 THEN 'Secundaria'
      ELSE 'Primaria'
    END,
    COALESCE(a.alumno_grado::text, ''),
    COALESCE(d.alumno_curp, ''),
    COALESCE(to_char(d.alumno_fecha_nac::timestamp, 'YYYY-MM-DD'), ''),
    COALESCE(
      (
        SELECT f.familiar_email
        FROM public.alumno_familiar f
        WHERE f.alumno_id = a.alumno_id
          AND f.familiar_email IS NOT NULL
          AND btrim(f.familiar_email) <> ''
        ORDER BY f.tutor_id NULLS LAST
        LIMIT 1
      ),
      ''
    ),
    CASE
      WHEN a.alumno_nuevo_ingreso = 1 THEN 'Nuevo Ingreso'
      ELSE 'Continuidad'
    END
  FROM public.alumno a
  LEFT JOIN public.alumno_detalles d ON d.alumno_id = a.alumno_id
  WHERE a.alumno_ref = p_ref
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.usa_lookup_alumno_por_ref(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.usa_lookup_alumno_por_ref(integer) TO anon, authenticated;
