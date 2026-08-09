import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Publicacion, PublicacionFoto } from '../types/database';
import Carousel from './Carousel';
import LikeButton from './LikeButton';

interface Props {
  publicaciones: Publicacion[];
  fotosPorId: Map<string, PublicacionFoto[]>;
  likesPorId?: Map<string, number>;
  misLikes?: Set<string>;
  onToggleLike?: (publicacionId: string) => void;
  onEliminar?: (publicacionId: string) => void;
}

export default function PublicacionesGrid({
  publicaciones,
  fotosPorId,
  likesPorId,
  misLikes,
  onToggleLike,
  onEliminar,
}: Props) {
  return (
    <View style={styles.grid}>
      {publicaciones.map((publicacion) => {
        const fotos = fotosPorId.get(publicacion.id) ?? [];

        return (
          <View key={publicacion.id} style={styles.celdaWrap}>
            {fotos.length > 0 && (
              <Carousel
                urls={fotos.map((f) => f.imagen_url)}
                aspectRatio={1}
                style={styles.celda}
              />
            )}
            {onToggleLike && (
              <View style={styles.likeBadge}>
                <LikeButton
                  likeado={misLikes?.has(publicacion.id) ?? false}
                  cantidad={likesPorId?.get(publicacion.id) ?? 0}
                  onPress={() => onToggleLike(publicacion.id)}
                  chico
                />
              </View>
            )}
            {onEliminar && (
              <Pressable
                style={styles.eliminarBadge}
                onPress={() => onEliminar(publicacion.id)}
                hitSlop={6}
              >
                <Text style={styles.eliminarBadgeTexto}>✕</Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  celdaWrap: {
    width: '32%',
    aspectRatio: 1,
    marginBottom: 6,
  },
  celda: {
    borderRadius: 4,
  },
  likeBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  eliminarBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eliminarBadgeTexto: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
