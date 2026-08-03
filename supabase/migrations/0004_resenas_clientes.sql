-- Vincula cada reseña al cliente real que la dejó (además del nombre de
-- muestra que ya se usa para las reseñas de prueba sin cliente asociado).
alter table public.resenas
  add column if not exists cliente_id uuid references public.profiles (id) on delete set null;

-- Un cliente autenticado puede dejar una reseña, siempre asociada a sí mismo
-- (no puede hacerse pasar por otro cliente).
drop policy if exists "Un cliente puede crear su propia reseña" on public.resenas;
create policy "Un cliente puede crear su propia reseña"
  on public.resenas for insert
  to authenticated
  with check (cliente_id = auth.uid());
