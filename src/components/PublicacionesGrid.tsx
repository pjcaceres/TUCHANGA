import { Image, StyleSheet, View } from 'react-native';
import { colors } from '../constants/theme';
import type { Publicacion } from '../types/database';

interface Props {
  publicaciones: Publicacion[];
}

export default function PublicacionesGrid({ publicaciones }: Props) {
  return (
    <View style={styles.grid}>
      {publicaciones.map((publicacion) => (
        <Image
          key={publicacion.id}
          source={{ uri: publicacion.imagen_url }}
          style={styles.celda}
          resizeMode="cover"
        />
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
  celda: {
    width: '32%',
    aspectRatio: 1,
    marginBottom: 6,
    borderRadius: 4,
    backgroundColor: colors.background,
  },
});
