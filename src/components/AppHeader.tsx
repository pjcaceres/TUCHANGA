import { Image, StyleSheet, View } from 'react-native';
import HeaderMenu from './HeaderMenu';
import MainTabs, { type TabActiva } from './MainTabs';

// Relación de aspecto real de assets/logo-header.png (768x670), recortado de
// assets/LogoTuchangaPng.png para sacarle el margen transparente del glow.
const LOGO_ASPECT_RATIO = 768 / 670;
const LOGO_HEIGHT = 64;

interface Props {
  activo: TabActiva;
  esTrabajador: boolean;
  cargando?: boolean;
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
  cargando,
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
        <View style={styles.menuButton}>
          <HeaderMenu
            esTrabajador={esTrabajador}
            onPremium={onPremium}
            onMisChats={onMisChats}
            onConfiguracion={onConfiguracion}
          />
        </View>
      </View>

      <View style={styles.tabsSection}>
        <MainTabs
          activo={activo}
          esTrabajador={esTrabajador}
          cargando={cargando}
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
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  logo: {
    height: LOGO_HEIGHT,
    width: LOGO_HEIGHT * LOGO_ASPECT_RATIO,
  },
  menuButton: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 20,
    justifyContent: 'center',
  },
  tabsSection: {
    paddingHorizontal: 20,
  },
});
