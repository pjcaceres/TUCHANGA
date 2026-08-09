import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';
import type { Publicacion } from '../types/database';

interface Props {
  publicaciones: Publicacion[];
  onEliminar?: (publicacionId: string) => void;
}

export default function PublicacionesGrid({ publicaciones, onEliminar }: Props) {
  return (
    <View style={styles.grid}>
      {publicaciones.map((publicacion) => (
        <View key={publicacion.id} style={styles.celdaWrap}>
          <Image source={{ uri: publicacion.imagen_url }} style={styles.celda} resizeMode="cover" />
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
      ))}
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
