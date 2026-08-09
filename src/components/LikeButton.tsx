import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../constants/theme';

interface Props {
  likeado: boolean;
  cantidad: number;
  onPress: () => void;
  chico?: boolean;
}

export default function LikeButton({ likeado, cantidad, onPress, chico }: Props) {
  return (
    <Pressable style={styles.container} onPress={onPress} hitSlop={8}>
      <Text style={[styles.icono, chico && styles.iconoChico]}>{likeado ? '❤️' : '🤍'}</Text>
      <Text style={[styles.cantidad, chico && styles.cantidadChica]}>{cantidad}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  icono: {
    fontSize: 16,
  },
  iconoChico: {
    fontSize: 12,
  },
  cantidad: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  cantidadChica: {
    fontSize: 11,
    color: '#fff',
  },
});
