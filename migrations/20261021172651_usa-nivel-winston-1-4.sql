-- Winston alumno_nivel: 1 Maternal, 2 Kinder, 3 Primaria, 4 Secundaria.
-- El CASE anterior (1/2/3) invertía Primaria y Secundaria.

CREATE OR REPLACE FUNCTION public.usa_programa_list()
RETURNS TABLE (
  id uuid,
  alumno_id integer,
  alumno_ref integer,
  folio text,
  estado text,
  nombre_completo text,
  nivel text,
  grado text,
  curp text,
  fecha_nacimiento text,
  correo_tutor text,
  tipo_incorporacion text,
  fecha_pago1 text,
  fecha_pago2 text,
  fecha_pago3 text,
  fecha_correo_bienvenida text,
  fecha_alta_reporte_inicial text,
  carpeta_drive text,
  curp_drive text,
  boletas_drive text,
  expediente_documental text,
  autorizacion_control_escolar text,
  validacion_archivo_final text,
  fecha_inclusion_archivo_final text,
  devolucion_solicitada text,
  fecha_devolucion text,
  observaciones text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
STABLE
AS $$
  SELECT
    u.id,
    u.alumno_id,
    a.alumno_ref,
    u.folio,
    u.estado,
    coalesce(
      trim(both ' ' FROM concat_ws(' ', a.alumno_nombre, a.alumno_app, a.alumno_apm)),
      ''
    ),
    CASE a.alumno_nivel
      WHEN 1 THEN 'Kinder'
      WHEN 2 THEN 'Kinder'
      WHEN 3 THEN 'Primaria'
      WHEN 4 THEN 'Secundaria'
      ELSE 'Primaria'
    END,
    coalesce(a.alumno_grado::text, ''),
    coalesce(d.alumno_curp, ''),
    coalesce(to_char(d.alumno_fecha_nac::timestamp, 'YYYY-MM-DD'), ''),
    coalesce(
      (
        SELECT fam.familiar_email
        FROM public.alumno_familiar fam
        WHERE fam.alumno_id = a.alumno_id
          AND fam.familiar_email IS NOT NULL
          AND btrim(fam.familiar_email) <> ''
        ORDER BY fam.tutor_id NULLS LAST
        LIMIT 1
      ),
      ''
    ),
    CASE
      WHEN a.alumno_nuevo_ingreso = 1 THEN 'Nuevo Ingreso'
      ELSE 'Continuidad'
    END,
    u.fecha_pago1,
    u.fecha_pago2,
    u.fecha_pago3,
    u.fecha_correo_bienvenida,
    u.fecha_alta_reporte_inicial,
    u.carpeta_drive,
    u.curp_drive,
    u.boletas_drive,
    u.expediente_documental,
    u.autorizacion_control_escolar,
    u.validacion_archivo_final,
    u.fecha_inclusion_archivo_final,
    u.devolucion_solicitada,
    u.fecha_devolucion,
    u.observaciones
  FROM public.usa_programa_alumno u
  LEFT JOIN public.alumno a ON a.alumno_id = u.alumno_id
  LEFT JOIN public.alumno_detalles d ON d.alumno_id = u.alumno_id
  ORDER BY u.folio;
$$;

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
      WHEN 2 THEN 'Kinder'
      WHEN 3 THEN 'Primaria'
      WHEN 4 THEN 'Secundaria'
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
