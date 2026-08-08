import { StyleSheet, Text, View } from 'react-native';
import { rubroLabel, type RubroId } from '../constants/rubros';
import { colors } from '../constants/theme';

interface Props {
  rubros: RubroId[];
}

export default function RubroChipsList({ rubros }: Props) {
  if (rubros.length === 0) {
    return <Text style={styles.sinRubro}>Oficio no especificado</Text>;
  }

  return (
    <View style={styles.wrap}>
      {rubros.map((id) => (
        <View key={id} style={styles.chip}>
          <Text style={styles.chipText}>{rubroLabel(id)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipText: {
    fontSize: 11,
    color: colors.text,
  },
  sinRubro: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
