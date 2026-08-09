import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';
import MainTabs, { type TabActiva } from './MainTabs';

interface Props {
  activo: TabActiva;
  esTrabajador: boolean;
  onTrabajadores: () => void;
  onPublicaciones: () => void;
  onPremium: () => void;
  onMisChats: () => void;
  onConfiguracion: () => void;
}

export default function AppHeader({
  activo,
  esTrabajador,
  onTrabajadores,
  onPublicaciones,
  onPremium,
  onMisChats,
  onConfiguracion,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.title}>TuChanga</Text>
        <View style={styles.headerActions}>
          {esTrabajador && (
            <Pressable onPress={onPremium}>
              <Text style={styles.premiumLink}>⭐ Premium</Text>
            </Pressable>
          )}
          <Pressable onPress={onMisChats}>
            <Text style={styles.logout}>💬 Mis chats</Text>
          </Pressable>
          <Pressable onPress={onConfiguracion}>
            <Text style={styles.logout}>⚙️ Configuración</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.tabsSection}>
        <MainTabs activo={activo} onTrabajadores={onTrabajadores} onPublicaciones={onPublicaciones} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 56,
    paddingBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  premiumLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  logout: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabsSection: {
    paddingHorizontal: 20,
  },
});
