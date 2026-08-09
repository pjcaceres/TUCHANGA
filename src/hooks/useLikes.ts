import { useCallback, useEffect, useState } from 'react';
import { darLike, obtenerLikes, quitarLike } from '../lib/likes';

/**
 * Estado de likes (conteo total + si el propio usuario ya likeó) para un
 * conjunto de publicaciones, con toggle optimista: cambia la UI al toque y
 * la revierte si el pedido a Supabase falla. Se usa igual en el feed, en el
 * perfil de un trabajador y en la cuadrícula de "Mi Perfil".
 */
export function useLikes(publicacionIds: string[], usuarioId: string | undefined) {
  const [conteos, setConteos] = useState<Map<string, number>>(new Map());
  const [propios, setPropios] = useState<Set<string>>(new Set());

  const idsClave = publicacionIds.join(',');

  useEffect(() => {
    let cancelado = false;

    obtenerLikes(publicacionIds, usuarioId).then((resultado) => {
      if (cancelado) return;
      setConteos(resultado.conteos);
      setPropios(resultado.propios);
    });

    return () => {
      cancelado = true;
    };
    // idsClave representa a publicacionIds de forma estable (evita refetch
    // en cada render por un array nuevo con el mismo contenido).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsClave, usuarioId]);

  const alternar = useCallback(
    async (publicacionId: string) => {
      if (!usuarioId) return;
      const yaLikeado = propios.has(publicacionId);

      setPropios((actuales) => {
        const siguiente = new Set(actuales);
        if (yaLikeado) siguiente.delete(publicacionId);
        else siguiente.add(publicacionId);
        return siguiente;
      });
      setConteos((actuales) => {
        const siguiente = new Map(actuales);
        const actual = siguiente.get(publicacionId) ?? 0;
        siguiente.set(publicacionId, Math.max(0, actual + (yaLikeado ? -1 : 1)));
        return siguiente;
      });

      const { error } = yaLikeado
        ? await quitarLike(publicacionId, usuarioId)
        : await darLike(publicacionId, usuarioId);

      if (error) {
        setPropios((actuales) => {
          const siguiente = new Set(actuales);
          if (yaLikeado) siguiente.add(publicacionId);
          else siguiente.delete(publicacionId);
          return siguiente;
        });
        setConteos((actuales) => {
          const siguiente = new Map(actuales);
          const actual = siguiente.get(publicacionId) ?? 0;
          siguiente.set(publicacionId, Math.max(0, actual + (yaLikeado ? 1 : -1)));
          return siguiente;
        });
      }
    },
    [propios, usuarioId]
  );

  return { conteos, propios, alternar };
}
