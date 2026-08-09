import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';

export type TabActiva = 'trabajadores' | 'publicaciones' | 'miPerfil';

interface Props {
  activo: TabActiva;
  esTrabajador: boolean;
  cargando?: boolean;
  onTrabajadores: () => void;
  onPublicaciones: () => void;
  onMiPerfil?: () => void;
}

export default function MainTabs({
  activo,
  esTrabajador,
  cargando,
  onTrabajadores,
  onPublicaciones,
  onMiPerfil,
}: Props) {
  // Mientras no sabemos todavía si el usuario es trabajador (primera carga
  // del ProfileContext, por ejemplo justo después de un F5), no mostramos ni
  // ocultamos la pestaña "Mi Perfil" a las apuradas — eso es lo que hacía
  // parpadear el segmented control. En cambio, mostramos un placeholder
  // estable del mismo alto hasta que se resuelve.
  if (cargando) {
    return (
      <View style={styles.container}>
        <View style={styles.skeleton} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.tab, activo === 'trabajadores' && styles.tabActive]}
        onPress={onTrabajadores}
      >
        <Text style={[styles.tabText, activo === 'trabajadores' && styles.tabTextActive]}>
          🔨 Trabajadores
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
  skeleton: {
    flex: 1,
    height: 36,
    borderRadius: 9,
    backgroundColor: colors.border,
  },
});
