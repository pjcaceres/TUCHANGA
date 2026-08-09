-- Un trabajador puede borrar sus propias publicaciones del feed de trabajos
-- (no las de otro trabajador).
drop policy if exists "Un trabajador puede borrar sus propias publicaciones" on public.publicaciones;
create policy "Un trabajador puede borrar sus propias publicaciones"
  on public.publicaciones for delete
  to authenticated
  using (trabajador_id = auth.uid());
