import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';
import HeaderMenu from './HeaderMenu';
import MainTabs, { type TabActiva } from './MainTabs';

interface Props {
  activo: TabActiva;
  esTrabajador: boolean;
  onTrabajadores: () => void;
  onPublicaciones: () => void;
  onMiPerfil?: () => void;
  onPremium: () => void;
  onMisChats: () => void;
  onConfiguracion: () => void;
}

export default function AppHeader({
  activo,
  esTrabajador,
  onTrabajadores,
  onPublicaciones,
  onMiPerfil,
  onPremium,
  onMisChats,
  onConfiguracion,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.title}>TuChanga</Text>
        <HeaderMenu
          esTrabajador={esTrabajador}
          onPremium={onPremium}
          onMisChats={onMisChats}
          onConfiguracion={onConfiguracion}
        />
      </View>

      <View style={styles.tabsSection}>
        <MainTabs
          activo={activo}
          esTrabajador={esTrabajador}
          onTrabajadores={onTrabajadores}
          onPublicaciones={onPublicaciones}
          onMiPerfil={onMiPerfil}
        />
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
  tabsSection: {
    paddingHorizontal: 20,
  },
});
