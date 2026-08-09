import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';

export type TabActiva = 'trabajadores' | 'publicaciones';

interface Props {
  activo: TabActiva;
  onTrabajadores: () => void;
  onPublicaciones: () => void;
}

export default function MainTabs({ activo, onTrabajadores, onPublicaciones }: Props) {
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
      <Pressable
        style={[styles.tab, activo === 'publicaciones' && styles.tabActive]}
        onPress={onPublicaciones}
      >
        <Text style={[styles.tabText, activo === 'publicaciones' && styles.tabTextActive]}>
          📸 Publicaciones
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
