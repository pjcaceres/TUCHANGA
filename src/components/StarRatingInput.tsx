import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';

interface Props {
  valor: number;
  onChange: (valor: number) => void;
  size?: number;
}

export default function StarRatingInput({ valor, onChange, size = 36 }: Props) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange(n)} hitSlop={6}>
          <Text style={[styles.star, { fontSize: size }, n <= valor && styles.starActiva]}>★</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  star: {
    color: colors.border,
  },
  starActiva: {
    color: '#E0A93B',
  },
});
