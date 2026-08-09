import { supabase } from './supabase';

/**
 * Trae los likes de un conjunto de publicaciones y los resume en dos
 * estructuras: cuántos likes tiene cada una (para el contador) y cuáles de
 * ellas ya likeó el propio usuario (para pintar el corazón lleno).
 */
export async function obtenerLikes(
  publicacionIds: string[],
  usuarioId: string | undefined
): Promise<{ conteos: Map<string, number>; propios: Set<string> }> {
  const conteos = new Map<string, number>();
  const propios = new Set<string>();
  if (publicacionIds.length === 0) return { conteos, propios };

  const { data } = await supabase
    .from('publicacion_likes')
    .select('publicacion_id, usuario_id')
    .in('publicacion_id', publicacionIds);

  for (const like of data ?? []) {
    conteos.set(like.publicacion_id, (conteos.get(like.publicacion_id) ?? 0) + 1);
    if (usuarioId && like.usuario_id === usuarioId) {
      propios.add(like.publicacion_id);
    }
  }

  return { conteos, propios };
}

export async function darLike(
  publicacionId: string,
  usuarioId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('publicacion_likes')
    .insert({ publicacion_id: publicacionId, usuario_id: usuarioId });

  return { error: error?.message ?? null };
}

/**
 * Igual que `eliminarPublicacion`: si la política RLS bloquea el borrado,
 * PostgREST responde éxito sin borrar nada, así que chequeamos que
 * `.select('id')` haya devuelto al menos una fila antes de darlo por bueno.
 */
export async function quitarLike(
  publicacionId: string,
  usuarioId: string
): Promise<{ error: string | null }> {
  const { data, error } = await supabase
    .from('publicacion_likes')
    .delete()
    .eq('publicacion_id', publicacionId)
    .eq('usuario_id', usuarioId)
    .select('id');

  if (error) {
    return { error: error.message };
  }

  if (!data || data.length === 0) {
    return { error: 'No pudimos quitar el like. Probá de nuevo.' };
  }

  return { error: null };
}
