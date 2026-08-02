-- Perfiles de usuario (trabajador o cliente), uno a uno con auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  tipo_usuario text not null check (tipo_usuario in ('trabajador', 'cliente')),
  nombre text not null,
  telefono text,
  barrio text,
  rubro text,
  descripcion text,
  precio_orientativo numeric,
  foto_url text,
  es_premium boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Los perfiles son visibles para cualquier usuario autenticado"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Un usuario puede crear su propio perfil"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Un usuario puede editar su propio perfil"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
