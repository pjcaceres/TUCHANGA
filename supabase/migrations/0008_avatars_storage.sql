-- Bucket público de Storage para las fotos de perfil (cara del trabajador o
-- logo de su changa/empresa, y foto del cliente). Reutiliza la columna
-- profiles.foto_url que ya existe desde 0001_profiles.sql — no hace falta
-- una columna nueva.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Cualquiera puede ver las fotos (son públicas por diseño: se muestran en el
-- listado y en el perfil de cada trabajador).
drop policy if exists "Fotos de perfil públicas para lectura" on storage.objects;
create policy "Fotos de perfil públicas para lectura"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Cada usuario autenticado sólo puede subir/actualizar/borrar archivos
-- dentro de su propia carpeta (<user_id>/...), nunca en la de otro.
drop policy if exists "Cada usuario sube su propia foto" on storage.objects;
create policy "Cada usuario sube su propia foto"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Cada usuario actualiza su propia foto" on storage.objects;
create policy "Cada usuario actualiza su propia foto"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Cada usuario borra su propia foto" on storage.objects;
create policy "Cada usuario borra su propia foto"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
