-- Registro de alertas de pago enviadas (2.º / 3.er parcialidad: 10, 5 y 0 días).
create table if not exists public.usa_alerta_pago_envio (
  id uuid primary key default gen_random_uuid(),
  programa_alumno_id uuid not null references public.usa_programa_alumno (id) on delete cascade,
  parcialidad smallint not null check (parcialidad in (2, 3)),
  dias_antes smallint not null check (dias_antes in (0, 5, 10)),
  fecha_vencimiento date not null,
  fecha_alerta date not null,
  enviado_a text not null,
  message_id text,
  created_at timestamptz not null default now(),
  unique (programa_alumno_id, parcialidad, dias_antes, fecha_vencimiento)
);

create index if not exists usa_alerta_pago_envio_lookup_idx
  on public.usa_alerta_pago_envio (fecha_alerta, parcialidad);

alter table public.usa_alerta_pago_envio enable row level security;

drop policy if exists usa_alerta_pago_envio_all on public.usa_alerta_pago_envio;
create policy usa_alerta_pago_envio_all
  on public.usa_alerta_pago_envio
  for all
  using (true)
  with check (true);

grant select, insert, update, delete on public.usa_alerta_pago_envio to anon, authenticated;
