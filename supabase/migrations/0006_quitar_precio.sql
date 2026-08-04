-- El precio orientativo ya no forma parte del flujo (ni al registrarse, ni
-- en el listado, ni en el perfil del trabajador).
alter table public.profiles drop column if exists precio_orientativo;
