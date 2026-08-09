-- Una publicación pasa de tener una sola foto (columna publicaciones.imagen_url)
-- a poder tener varias, en orden, en esta tabla nueva.
create table if not exists public.publicacion_fotos (
  id uuid primary key default gen_random_uuid(),
  publicacion_id uuid not null references public.publicaciones (id) on delete cascade,
  imagen_url text not null,
  orden int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists publicacion_fotos_publicacion_id_idx
  on public.publicacion_fotos (publicacion_id, orden);

alter table public.publicacion_fotos enable row level security;

-- Mismo criterio de lectura que "publicaciones": cualquier usuario logueado
-- ve todas las fotos (se muestran en el feed y en los perfiles).
drop policy if exists "Las fotos de publicaciones son visibles para cualquier usuario autenticado" on public.publicacion_fotos;
create policy "Las fotos de publicaciones son visibles para cualquier usuario autenticado"
  on public.publicacion_fotos for select
  to authenticated
  using (true);

-- Solo el trabajador dueño de la publicación puede agregarle o quitarle fotos.
drop policy if exists "Un trabajador agrega fotos a sus propias publicaciones" on public.publicacion_fotos;
create policy "Un trabajador agrega fotos a sus propias publicaciones"
  on public.publicacion_fotos for insert
  to authenticated
  with check (
    exists (
      select 1 from public.publicaciones p
      where p.id = publicacion_fotos.publicacion_id and p.trabajador_id = auth.uid()
    )
  );

drop policy if exists "Un trabajador borra fotos de sus propias publicaciones" on public.publicacion_fotos;
create policy "Un trabajador borra fotos de sus propias publicaciones"
  on public.publicacion_fotos for delete
  to authenticated
  using (
    exists (
      select 1 from public.publicaciones p
      where p.id = publicacion_fotos.publicacion_id and p.trabajador_id = auth.uid()
    )
  );

-- Límite de 6 fotos por publicación, reforzado en el servidor (no solo en
-- la UI) para que no se pueda evadir llamando a la API directamente. Un
-- trigger `before insert` cuenta las fotos ya guardadas de esa publicación;
-- como corre fila por fila dentro de la misma transacción, también funciona
-- para un `insert` de varias filas de una sola vez.
create or replace function public.chequear_limite_fotos_publicacion()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.publicacion_fotos where publicacion_id = new.publicacion_id) >= 6 then
    raise exception 'Una publicación no puede tener más de 6 fotos';
  end if;
  return new;
end;
$$;

drop trigger if exists limite_fotos_publicacion on public.publicacion_fotos;
create trigger limite_fotos_publicacion
  before insert on public.publicacion_fotos
  for each row
  execute function public.chequear_limite_fotos_publicacion();

-- Migra la foto de cada publicación existente (1 por publicación, columna
-- imagen_url) a la tabla nueva antes de borrar esa columna, para no perder
-- datos: quedan con una sola foto, orden 0, y siguen funcionando igual.
insert into public.publicacion_fotos (publicacion_id, imagen_url, orden)
select id, imagen_url, 0 from public.publicaciones
where imagen_url is not null;

alter table public.publicaciones drop column if exists imagen_url;
