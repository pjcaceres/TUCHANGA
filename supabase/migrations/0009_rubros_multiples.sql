-- Un trabajador puede tener más de un rubro (por ejemplo, plomero y pintor a
-- la vez). Se reemplaza la columna `rubro` (un solo valor) por `rubros`
-- (array de valores).
alter table public.profiles
  add column if not exists rubros text[] not null default '{}';

-- Migra los datos existentes: cada trabajador que ya tenía un rubro lo
-- conserva como el primer (y único, por ahora) elemento de su lista.
update public.profiles
  set rubros = array[rubro]
  where rubro is not null and rubros = '{}';

alter table public.profiles drop column if exists rubro;

-- Índice para que el filtro "¿este trabajador tiene tal rubro entre los
-- suyos?" (contains / @>) sea rápido en el listado.
create index if not exists profiles_rubros_idx on public.profiles using gin (rubros);

-- El trigger que crea el perfil automáticamente (0007_perfil_automatico.sql)
-- ahora tiene que leer un array de rubros desde los metadatos en vez de un
-- solo valor. auth.users.raw_user_meta_data es jsonb, así que el campo
-- "rubros" llega como un array JSON — se convierte a text[] con
-- jsonb_array_elements_text.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, tipo_usuario, nombre, telefono, rubros, descripcion, departamento)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'tipo_usuario', 'cliente'),
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'telefono',
    coalesce(
      (
        select array_agg(value)
        from jsonb_array_elements_text(new.raw_user_meta_data -> 'rubros')
      ),
      '{}'
    ),
    new.raw_user_meta_data ->> 'descripcion',
    new.raw_user_meta_data ->> 'departamento'
  );
  return new;
end;
$$;
