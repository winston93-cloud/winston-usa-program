-- Programa USA / Hökku: registro local + lookup a public.alumno por matrícula
-- (alumno_clave). No modifica tablas legacy; solo lectura vía SECURITY DEFINER.

CREATE TABLE public.usa_programa_alumno (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id INTEGER REFERENCES public.alumno (alumno_id) ON DELETE SET NULL,
  folio TEXT NOT NULL DEFAULT '',
  matricula TEXT NOT NULL DEFAULT '',
  nivel TEXT NOT NULL DEFAULT 'Primaria',
  estado TEXT NOT NULL DEFAULT 'Activo',
  nombre_completo TEXT NOT NULL DEFAULT '',
  grado TEXT NOT NULL DEFAULT '',
  curp TEXT NOT NULL DEFAULT '',
  fecha_nacimiento TEXT NOT NULL DEFAULT '',
  correo_tutor TEXT NOT NULL DEFAULT '',
  tipo_incorporacion TEXT NOT NULL DEFAULT 'Nuevo Ingreso',
  fecha_pago1 TEXT NOT NULL DEFAULT '',
  fecha_pago2 TEXT NOT NULL DEFAULT '',
  fecha_pago3 TEXT NOT NULL DEFAULT '',
  fecha_correo_bienvenida TEXT NOT NULL DEFAULT '',
  fecha_alta_reporte_inicial TEXT NOT NULL DEFAULT '',
  carpeta_drive TEXT NOT NULL DEFAULT 'N',
  curp_drive TEXT NOT NULL DEFAULT 'N',
  boletas_drive TEXT NOT NULL DEFAULT 'N',
  expediente_documental TEXT NOT NULL DEFAULT '',
  autorizacion_control_escolar TEXT NOT NULL DEFAULT 'N',
  validacion_archivo_final TEXT NOT NULL DEFAULT 'N',
  fecha_inclusion_archivo_final TEXT NOT NULL DEFAULT '',
  devolucion_solicitada TEXT NOT NULL DEFAULT 'N',
  fecha_devolucion TEXT NOT NULL DEFAULT '',
  observaciones TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX usa_programa_alumno_matricula_idx
  ON public.usa_programa_alumno (matricula);
CREATE INDEX usa_programa_alumno_folio_idx
  ON public.usa_programa_alumno (folio);
CREATE INDEX usa_programa_alumno_alumno_id_idx
  ON public.usa_programa_alumno (alumno_id);

COMMENT ON TABLE public.usa_programa_alumno IS
  'Control Programa USA–Hökku. Identidad se rellena desde alumno/alumno_detalles por matrícula.';

ALTER TABLE public.usa_programa_alumno ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usa_programa_select"
  ON public.usa_programa_alumno
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "usa_programa_insert"
  ON public.usa_programa_alumno
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "usa_programa_update"
  ON public.usa_programa_alumno
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "usa_programa_delete"
  ON public.usa_programa_alumno
  FOR DELETE TO anon, authenticated
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.usa_programa_alumno TO anon, authenticated;

CREATE TRIGGER usa_programa_alumno_updated_at
  BEFORE UPDATE ON public.usa_programa_alumno
  FOR EACH ROW
  EXECUTE FUNCTION system.update_updated_at();

-- Lookup seguro: no abre RLS de alumno; solo campos de identidad para el programa.
CREATE OR REPLACE FUNCTION public.usa_lookup_alumno_por_matricula(p_matricula text)
RETURNS TABLE (
  alumno_id integer,
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
    d.alumno_clave::text,
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
  FROM public.alumno_detalles d
  INNER JOIN public.alumno a ON a.alumno_id = d.alumno_id
  WHERE lower(btrim(d.alumno_clave)) = lower(btrim(p_matricula))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.usa_lookup_alumno_por_matricula(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.usa_lookup_alumno_por_matricula(text) TO anon, authenticated;
