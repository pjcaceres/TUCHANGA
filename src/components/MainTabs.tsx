import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';

interface Props {
  activo: 'trabajadores' | 'trabajos';
  onTrabajadores: () => void;
  onTrabajos: () => void;
}

export default function MainTabs({ activo, onTrabajadores, onTrabajos }: Props) {
  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.tab, activo === 'trabajadores' && styles.tabActive]}
        onPress={onTrabajadores}
      >
        <Text style={[styles.tabText, activo === 'trabajadores' && styles.tabTextActive]}>
          👥 Trabajadores
        </Text>
      </Pressable>
      <Pressable style={[styles.tab, activo === 'trabajos' && styles.tabActive]} onPress={onTrabajos}>
        <Text style={[styles.tabText, activo === 'trabajos' && styles.tabTextActive]}>
          📸 Trabajos
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: '#fff',
  },
});
