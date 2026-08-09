import { Image, StyleSheet, View } from 'react-native';
import HeaderMenu from './HeaderMenu';
import MainTabs, { type TabActiva } from './MainTabs';

// Relación de aspecto real de assets/logo-header.png (768x670), recortado de
// assets/LogoTuchangaPng.png para sacarle el margen transparente del glow.
const LOGO_ASPECT_RATIO = 768 / 670;

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
        <Image
          source={require('../../assets/logo-header.png')}
          style={styles.logo}
          resizeMode="contain"
        />
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
  logo: {
    height: 36,
    width: 36 * LOGO_ASPECT_RATIO,
  },
  tabsSection: {
    paddingHorizontal: 20,
  },
});
