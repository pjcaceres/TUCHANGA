-- "Me gusta" en una publicación. Un usuario (cliente o trabajador) puede dar
-- like una sola vez por publicación — el `unique` de abajo es lo que hace
-- que tocar el botón de nuevo sea un toggle (insertar de nuevo choca contra
-- la restricción, así que la UI borra la fila en vez de insertarla otra vez).
create table if not exists public.publicacion_likes (
  id uuid primary key default gen_random_uuid(),
  publicacion_id uuid not null references public.publicaciones (id) on delete cascade,
  usuario_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (publicacion_id, usuario_id)
);

create index if not exists publicacion_likes_publicacion_id_idx
  on public.publicacion_likes (publicacion_id);

alter table public.publicacion_likes enable row level security;

-- Cualquier usuario logueado ve todos los likes (para mostrar el contador
-- total y saber si el propio usuario ya likeó cada publicación).
drop policy if exists "Los likes son visibles para cualquier usuario autenticado" on public.publicacion_likes;
create policy "Los likes son visibles para cualquier usuario autenticado"
  on public.publicacion_likes for select
  to authenticated
  using (true);

drop policy if exists "Un usuario da like en su propio nombre" on public.publicacion_likes;
create policy "Un usuario da like en su propio nombre"
  on public.publicacion_likes for insert
  to authenticated
  with check (usuario_id = auth.uid());

drop policy if exists "Un usuario quita su propio like" on public.publicacion_likes;
create policy "Un usuario quita su propio like"
  on public.publicacion_likes for delete
  to authenticated
  using (usuario_id = auth.uid());
