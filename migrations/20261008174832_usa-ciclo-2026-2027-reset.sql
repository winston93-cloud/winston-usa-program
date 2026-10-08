-- Ciclo operativo 2026–2027 (Winston 23):
-- limpia registros del ciclo anterior y actualiza el default del sync.

DELETE FROM public.usa_alerta_pago_envio;
DELETE FROM public.usa_programa_alumno;

COMMENT ON TABLE public.usa_programa_alumno IS
  'Control Programa USA–Hökku. Ciclo 2026–2027 (Winston 23). Identidad vía alumno_id → public.alumno.';

CREATE OR REPLACE FUNCTION public.usa_sync_pagos_programa(p_ciclo integer DEFAULT 23)
RETURNS TABLE (
  inserted integer,
  updated integer,
  alumnos integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_inserted integer := 0;
  v_updated integer := 0;
  r record;
  v_id uuid;
  v_folio text;
  v_next integer;
  v_alumno_id integer;
  v_f1 text;
  v_f2 text;
  v_f3 text;
  v_exists boolean;
BEGIN
  IF p_ciclo IS NULL OR p_ciclo <= 0 THEN
    RAISE EXCEPTION 'p_ciclo inválido';
  END IF;

  FOR r IN
    WITH refs AS (
      SELECT
        regexp_replace(btrim(pd.pago_referencia::text), '[^0-9]', '', 'g') AS ref,
        pd.pago_fecha,
        pd.alumno_id
      FROM public.pago_detalle pd
      WHERE coalesce(pd.pago_cancelado, 0) = 0
        AND length(regexp_replace(btrim(pd.pago_referencia::text), '[^0-9]', '', 'g')) = 12
    ),
    parsed AS (
      SELECT
        substring(ref FROM 1 FOR 5)::integer AS alumno_ref,
        substring(ref FROM 6 FOR 2) AS concepto,
        substring(ref FROM 8 FOR 2)::integer AS ciclo,
        pago_fecha,
        alumno_id
      FROM refs
    ),
    filtered AS (
      SELECT *
      FROM parsed
      WHERE ciclo = p_ciclo
        AND concepto IN ('23', '24', '25')
    )
    SELECT
      f.alumno_ref,
      min(f.alumno_id) FILTER (WHERE f.alumno_id IS NOT NULL) AS alumno_id,
      min(f.pago_fecha) FILTER (WHERE f.concepto = '23') AS fecha_pago1,
      min(f.pago_fecha) FILTER (WHERE f.concepto = '24') AS fecha_pago2,
      min(f.pago_fecha) FILTER (WHERE f.concepto = '25') AS fecha_pago3
    FROM filtered f
    GROUP BY f.alumno_ref
    ORDER BY f.alumno_ref
  LOOP
    v_f1 := coalesce(to_char(r.fecha_pago1, 'YYYY-MM-DD'), '');
    v_f2 := coalesce(to_char(r.fecha_pago2, 'YYYY-MM-DD'), '');
    v_f3 := coalesce(to_char(r.fecha_pago3, 'YYYY-MM-DD'), '');

    SELECT a.alumno_id
    INTO v_alumno_id
    FROM public.alumno a
    WHERE a.alumno_ref = r.alumno_ref
    LIMIT 1;

    IF NOT FOUND THEN
      v_alumno_id := r.alumno_id;
    END IF;

    IF v_alumno_id IS NULL THEN
      CONTINUE;
    END IF;

    v_id := NULL;
    SELECT u.id
    INTO v_id
    FROM public.usa_programa_alumno u
    WHERE u.alumno_id = v_alumno_id
    LIMIT 1;
    v_exists := FOUND;

    IF v_exists THEN
      UPDATE public.usa_programa_alumno u
      SET
        alumno_ref = r.alumno_ref,
        fecha_pago1 = CASE WHEN v_f1 <> '' THEN v_f1 ELSE u.fecha_pago1 END,
        fecha_pago2 = CASE WHEN v_f2 <> '' THEN v_f2 ELSE u.fecha_pago2 END,
        fecha_pago3 = CASE WHEN v_f3 <> '' THEN v_f3 ELSE u.fecha_pago3 END,
        updated_at = now()
      WHERE u.id = v_id;
      v_updated := v_updated + 1;
    ELSE
      SELECT coalesce(
        max(
          CASE
            WHEN u.folio ~ '(\d+)$' THEN substring(u.folio FROM '(\d+)$')::integer
            ELSE 0
          END
        ),
        0
      ) + 1
      INTO v_next
      FROM public.usa_programa_alumno u;

      v_folio := 'A-' || lpad(v_next::text, 3, '0');

      INSERT INTO public.usa_programa_alumno (
        alumno_id,
        alumno_ref,
        folio,
        estado,
        fecha_pago1,
        fecha_pago2,
        fecha_pago3
      ) VALUES (
        v_alumno_id,
        r.alumno_ref,
        v_folio,
        'Activo',
        v_f1,
        v_f2,
        v_f3
      );
      v_inserted := v_inserted + 1;
    END IF;
  END LOOP;

  inserted := v_inserted;
  updated := v_updated;
  alumnos := v_inserted + v_updated;
  RETURN NEXT;
END;
$$;

COMMENT ON FUNCTION public.usa_sync_pagos_programa(integer) IS
  'Upsert usa_programa_alumno desde pagos 23/24/25 del ciclo (default 23 = 2026–2027).';
