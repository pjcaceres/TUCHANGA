-- Crea automáticamente la fila en public.profiles apenas se crea el usuario
-- en auth.users, sin depender de que exista una sesión activa inmediatamente
-- después del signUp. Esto es necesario porque, con la confirmación de email
-- por link habilitada, supabase.auth.signUp() no devuelve sesión hasta que
-- el usuario confirma su email — y un insert hecho desde el cliente en ese
-- momento corría sin autenticación real y quedaba bloqueado por RLS sin
-- mostrar ningún error visible, dejando la cuenta de auth creada pero sin
-- perfil.
--
-- Los datos del formulario de registro (tipo_usuario, nombre, teléfono,
-- rubro, descripción, departamento) se guardan en auth.users.raw_user_meta_data
-- (vía el parámetro `options.data` de signUp, que sí se guarda de forma
-- síncrona al crear el usuario, tenga sesión o no) y este trigger los lee de
-- ahí. Si falta algo obligatorio o el insert falla por cualquier motivo, la
-- excepción aborta la creación del usuario completa y signUp() devuelve el
-- error al cliente — ya no queda una cuenta de auth "huérfana" sin perfil.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, tipo_usuario, nombre, telefono, rubro, descripcion, departamento)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'tipo_usuario', 'cliente'),
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'telefono',
    new.raw_user_meta_data ->> 'rubro',
    new.raw_user_meta_data ->> 'descripcion',
    new.raw_user_meta_data ->> 'departamento'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
