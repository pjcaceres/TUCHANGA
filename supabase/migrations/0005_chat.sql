-- Chat interno entre cliente y trabajador: una conversación por par de
-- usuarios, con mensajes en tiempo real vía Supabase Realtime.

create table if not exists public.conversaciones (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.profiles (id) on delete cascade,
  trabajador_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (cliente_id, trabajador_id)
);

alter table public.conversaciones enable row level security;

drop policy if exists "Ver mis conversaciones" on public.conversaciones;
create policy "Ver mis conversaciones"
  on public.conversaciones for select
  to authenticated
  using (cliente_id = auth.uid() or trabajador_id = auth.uid());

drop policy if exists "Iniciar una conversación" on public.conversaciones;
create policy "Iniciar una conversación"
  on public.conversaciones for insert
  to authenticated
  with check (cliente_id = auth.uid());

create table if not exists public.mensajes (
  id uuid primary key default gen_random_uuid(),
  conversacion_id uuid not null references public.conversaciones (id) on delete cascade,
  remitente_id uuid not null references public.profiles (id) on delete cascade,
  contenido text not null,
  leido boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.mensajes enable row level security;

drop policy if exists "Ver mensajes de mis conversaciones" on public.mensajes;
create policy "Ver mensajes de mis conversaciones"
  on public.mensajes for select
  to authenticated
  using (
    exists (
      select 1 from public.conversaciones c
      where c.id = mensajes.conversacion_id
        and (c.cliente_id = auth.uid() or c.trabajador_id = auth.uid())
    )
  );

drop policy if exists "Enviar mensajes en mis conversaciones" on public.mensajes;
create policy "Enviar mensajes en mis conversaciones"
  on public.mensajes for insert
  to authenticated
  with check (
    remitente_id = auth.uid()
    and exists (
      select 1 from public.conversaciones c
      where c.id = mensajes.conversacion_id
        and (c.cliente_id = auth.uid() or c.trabajador_id = auth.uid())
    )
  );

drop policy if exists "Marcar como leídos mis mensajes recibidos" on public.mensajes;
create policy "Marcar como leídos mis mensajes recibidos"
  on public.mensajes for update
  to authenticated
  using (
    exists (
      select 1 from public.conversaciones c
      where c.id = mensajes.conversacion_id
        and (c.cliente_id = auth.uid() or c.trabajador_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.conversaciones c
      where c.id = mensajes.conversacion_id
        and (c.cliente_id = auth.uid() or c.trabajador_id = auth.uid())
    )
  );

-- Habilita Realtime (postgres_changes) para que los mensajes lleguen sin recargar.
alter publication supabase_realtime add table public.mensajes;
