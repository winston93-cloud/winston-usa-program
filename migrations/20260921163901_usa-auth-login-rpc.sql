-- Login USA Program sin exponer public.usuario al rol anon.
-- Valida usuario/correo + contraseña (texto plano o md5) y devuelve datos seguros.

CREATE OR REPLACE FUNCTION public.usa_programa_auth_login(
  p_login text,
  p_password text
)
RETURNS TABLE (
  usuario_id integer,
  usuario_email text,
  usuario_username text,
  usuario_nombre text,
  usuario_app text,
  usuario_apm text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF p_login IS NULL OR length(trim(p_login)) = 0
     OR p_password IS NULL OR length(p_password) = 0 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    u.usuario_id::integer,
    coalesce(u.usuario_email, '')::text,
    coalesce(u.usuario_username, '')::text,
    coalesce(u.usuario_nombre, '')::text,
    coalesce(u.usuario_app, '')::text,
    coalesce(u.usuario_apm, '')::text
  FROM public.usuario u
  WHERE coalesce(u.usuario_status, 0) = 1
    AND (
      lower(trim(u.usuario_email)) = lower(trim(p_login))
      OR trim(u.usuario_username) = trim(p_login)
    )
    AND (
      u.usuario_password = p_password
      OR lower(u.usuario_password) = md5(p_password)
    )
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.usa_programa_auth_login(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.usa_programa_auth_login(text, text) TO anon, authenticated;
