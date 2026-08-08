import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RUBROS, type RubroId } from '../constants/rubros';
import { colors } from '../constants/theme';

interface Props {
  seleccionados: RubroId[];
  onToggle: (id: RubroId) => void;
  opciones?: readonly { id: RubroId; label: string }[];
}

export default function RubroChipsSelector({ seleccionados, onToggle, opciones = RUBROS }: Props) {
  return (
    <View style={styles.wrap}>
      {opciones.map((r) => {
        const activo = seleccionados.includes(r.id);
        return (
          <Pressable
            key={r.id}
            style={[styles.chip, activo && styles.chipActive]}
            onPress={() => onToggle(r.id)}
          >
            <Text style={[styles.chipText, activo && styles.chipTextActive]}>{r.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: colors.text,
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
});
