-- Corrige fuga de v_id entre iteraciones del sync (SELECT INTO sin fila no limpia).

CREATE OR REPLACE FUNCTION public.usa_sync_pagos_programa(p_ciclo integer DEFAULT 22)
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
  v_matricula text;
  v_nombre text;
  v_nivel text;
  v_grado text;
  v_curp text;
  v_fnac text;
  v_correo text;
  v_tipo text;
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

    SELECT
      a.alumno_id,
      coalesce(d.alumno_clave, '')::text,
      trim(both ' ' FROM concat_ws(' ', a.alumno_nombre, a.alumno_app, a.alumno_apm)),
      CASE a.alumno_nivel
        WHEN 1 THEN 'Kinder'
        WHEN 2 THEN 'Primaria'
        WHEN 3 THEN 'Secundaria'
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
      END
    INTO
      v_alumno_id,
      v_matricula,
      v_nombre,
      v_nivel,
      v_grado,
      v_curp,
      v_fnac,
      v_correo,
      v_tipo
    FROM public.alumno a
    LEFT JOIN public.alumno_detalles d ON d.alumno_id = a.alumno_id
    WHERE a.alumno_ref = r.alumno_ref
    LIMIT 1;

    IF NOT FOUND THEN
      v_alumno_id := r.alumno_id;
      v_matricula := '';
      v_nombre := '';
      v_nivel := 'Primaria';
      v_grado := '';
      v_curp := '';
      v_fnac := '';
      v_correo := '';
      v_tipo := 'Nuevo Ingreso';
    END IF;

    v_id := NULL;
    SELECT u.id
    INTO v_id
    FROM public.usa_programa_alumno u
    WHERE u.alumno_ref = r.alumno_ref
    LIMIT 1;
    v_exists := FOUND;

    IF v_exists THEN
      UPDATE public.usa_programa_alumno u
      SET
        alumno_id = coalesce(v_alumno_id, u.alumno_id),
        matricula = CASE
          WHEN v_matricula <> '' THEN v_matricula
          ELSE u.matricula
        END,
        nombre_completo = CASE
          WHEN v_nombre <> '' THEN v_nombre
          ELSE u.nombre_completo
        END,
        nivel = CASE
          WHEN v_nombre <> '' THEN v_nivel
          ELSE u.nivel
        END,
        grado = CASE
          WHEN v_nombre <> '' THEN v_grado
          ELSE u.grado
        END,
        curp = CASE
          WHEN v_curp <> '' THEN v_curp
          ELSE u.curp
        END,
        fecha_nacimiento = CASE
          WHEN v_fnac <> '' THEN v_fnac
          ELSE u.fecha_nacimiento
        END,
        correo_tutor = CASE
          WHEN v_correo <> '' THEN v_correo
          ELSE u.correo_tutor
        END,
        tipo_incorporacion = CASE
          WHEN v_nombre <> '' THEN v_tipo
          ELSE u.tipo_incorporacion
        END,
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
        matricula,
        nivel,
        estado,
        nombre_completo,
        grado,
        curp,
        fecha_nacimiento,
        correo_tutor,
        tipo_incorporacion,
        fecha_pago1,
        fecha_pago2,
        fecha_pago3
      ) VALUES (
        v_alumno_id,
        r.alumno_ref,
        v_folio,
        coalesce(v_matricula, ''),
        coalesce(v_nivel, 'Primaria'),
        'Activo',
        coalesce(v_nombre, ''),
        coalesce(v_grado, ''),
        coalesce(v_curp, ''),
        coalesce(v_fnac, ''),
        coalesce(v_correo, ''),
        coalesce(v_tipo, 'Nuevo Ingreso'),
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
