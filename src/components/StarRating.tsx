import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';

interface Props {
  calificacion: number | null;
  cantidad: number;
  size?: number;
  mostrarConteo?: boolean;
}

export default function StarRating({ calificacion, cantidad, size = 14, mostrarConteo = true }: Props) {
  if (calificacion === null || cantidad === 0) {
    return <Text style={[styles.muted, { fontSize: size }]}>Sin reseñas todavía</Text>;
  }

  const estrellasLlenas = Math.round(calificacion);
  const estrellas = '★★★★★'.slice(0, estrellasLlenas) + '☆☆☆☆☆'.slice(estrellasLlenas);

  return (
    <View style={styles.row}>
      <Text style={[styles.stars, { fontSize: size }]}>{estrellas}</Text>
      <Text style={[styles.text, { fontSize: size }]}>
        {calificacion.toFixed(1)}
        {mostrarConteo ? ` (${cantidad})` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stars: {
    color: '#E0A93B',
    letterSpacing: 1,
  },
  text: {
    color: colors.textMuted,
  },
  muted: {
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
