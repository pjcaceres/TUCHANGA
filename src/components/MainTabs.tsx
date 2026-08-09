import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';

export type TabActiva = 'trabajadores' | 'publicaciones' | 'miPerfil';

interface Props {
  activo: TabActiva;
  esTrabajador: boolean;
  onTrabajadores: () => void;
  onPublicaciones: () => void;
  onMiPerfil?: () => void;
}

export default function MainTabs({
  activo,
  esTrabajador,
  onTrabajadores,
  onPublicaciones,
  onMiPerfil,
}: Props) {
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
      {esTrabajador && onMiPerfil && (
        <Pressable
          style={[styles.tab, activo === 'miPerfil' && styles.tabActive]}
          onPress={onMiPerfil}
        >
          <Text style={[styles.tabText, activo === 'miPerfil' && styles.tabTextActive]}>
            👤 Mi Perfil
          </Text>
        </Pressable>
      )}
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
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: '#fff',
  },
});
