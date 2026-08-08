-- Feed de fotos de trabajos realizados ("Trabajos"), la parte más red
-- social de la app: cada trabajador puede publicar fotos de sus changas,
-- con una descripción corta opcional. El feed las muestra a todos los
-- usuarios, más recientes primero.
create table if not exists public.publicaciones (
  id uuid primary key default gen_random_uuid(),
  trabajador_id uuid not null references public.profiles (id) on delete cascade,
  imagen_url text not null,
  descripcion text,
  created_at timestamptz not null default now()
);

create index if not exists publicaciones_trabajador_id_idx on public.publicaciones (trabajador_id);
create index if not exists publicaciones_created_at_idx on public.publicaciones (created_at desc);

alter table public.publicaciones enable row level security;

-- Cualquier usuario logueado (cliente o trabajador) ve el feed completo.
drop policy if exists "El feed de trabajos es visible para cualquier usuario autenticado" on public.publicaciones;
create policy "El feed de trabajos es visible para cualquier usuario autenticado"
  on public.publicaciones for select
  to authenticated
  using (true);

-- Solo una cuenta de tipo trabajador puede publicar, y únicamente a su
-- propio nombre (no puede publicar en nombre de otro trabajador).
drop policy if exists "Un trabajador puede publicar sus propios trabajos" on public.publicaciones;
create policy "Un trabajador puede publicar sus propios trabajos"
  on public.publicaciones for insert
  to authenticated
  with check (
    trabajador_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.tipo_usuario = 'trabajador'
    )
  );

-- Bucket público de Storage para las fotos del feed de trabajos.
insert into storage.buckets (id, name, public)
values ('publicaciones-fotos', 'publicaciones-fotos', true)
on conflict (id) do nothing;

-- Cualquiera puede ver las fotos publicadas (son públicas por diseño: se
-- muestran en el feed y en el perfil de cada trabajador).
drop policy if exists "Fotos de trabajos públicas para lectura" on storage.objects;
create policy "Fotos de trabajos públicas para lectura"
  on storage.objects for select
  using (bucket_id = 'publicaciones-fotos');

-- Solo el trabajador dueño puede subir a su propia carpeta (<user_id>/...),
-- y solo si su cuenta es de tipo trabajador.
drop policy if exists "Un trabajador sube sus propias fotos de trabajo" on storage.objects;
create policy "Un trabajador sube sus propias fotos de trabajo"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'publicaciones-fotos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.tipo_usuario = 'trabajador'
    )
  );
