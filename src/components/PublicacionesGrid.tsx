import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';
import type { Publicacion, PublicacionFoto } from '../types/database';
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
        const primeraFoto = fotos[0]?.imagen_url;

        return (
          <View key={publicacion.id} style={styles.celdaWrap}>
            {primeraFoto && (
              <Image source={{ uri: primeraFoto }} style={styles.celda} resizeMode="cover" />
            )}
            {fotos.length > 1 && (
              <View style={styles.multiFotoBadge}>
                <Text style={styles.multiFotoBadgeTexto}>1/{fotos.length}</Text>
              </View>
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
    width: '100%',
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.background,
  },
  multiFotoBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  multiFotoBadgeTexto: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
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
    top: 4,
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
