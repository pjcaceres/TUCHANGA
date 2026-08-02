-- Ubicación y calificación agregada del trabajador
alter table public.profiles
  add column if not exists lat double precision,
  add column if not exists lng double precision,
  add column if not exists departamento text,
  add column if not exists calificacion_promedio numeric,
  add column if not exists cantidad_resenas integer not null default 0;

alter table public.profiles drop constraint if exists profiles_departamento_check;
alter table public.profiles add constraint profiles_departamento_check
  check (departamento is null or departamento in (
    'Artigas', 'Canelones', 'Cerro Largo', 'Colonia', 'Durazno', 'Flores', 'Florida',
    'Lavalleja', 'Maldonado', 'Montevideo', 'Paysandú', 'Río Negro', 'Rivera', 'Rocha',
    'Salto', 'San José', 'Soriano', 'Tacuarembó', 'Treinta y Tres'
  ));

-- Historial de trabajos realizados + reseña de cada uno
create table if not exists public.resenas (
  id uuid primary key default gen_random_uuid(),
  trabajador_id uuid not null references public.profiles (id) on delete cascade,
  cliente_nombre text not null,
  trabajo_descripcion text,
  calificacion smallint not null check (calificacion between 1 and 5),
  comentario text,
  created_at timestamptz not null default now()
);

create index if not exists resenas_trabajador_id_idx on public.resenas (trabajador_id);

alter table public.resenas enable row level security;

create policy "Las reseñas son visibles para cualquier usuario autenticado"
  on public.resenas for select
  to authenticated
  using (true);

-- Mantiene profiles.calificacion_promedio / cantidad_resenas al día
create or replace function public.actualizar_calificacion_trabajador()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid := coalesce(new.trabajador_id, old.trabajador_id);
begin
  update public.profiles
  set
    calificacion_promedio = (select avg(calificacion) from public.resenas where trabajador_id = target_id),
    cantidad_resenas = (select count(*) from public.resenas where trabajador_id = target_id)
  where id = target_id;

  return null;
end;
$$;

drop trigger if exists resenas_actualizar_calificacion on public.resenas;
create trigger resenas_actualizar_calificacion
  after insert or update or delete on public.resenas
  for each row execute function public.actualizar_calificacion_trabajador();
