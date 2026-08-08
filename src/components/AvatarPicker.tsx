import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';
import { elegirFotoDePerfil, type FotoElegida } from '../lib/avatar';
import Avatar from './Avatar';

interface Props {
  fotoUrl: string | null;
  nombre: string;
  size?: number;
  subiendo?: boolean;
  onElegir: (foto: FotoElegida) => void;
}

export default function AvatarPicker({
  fotoUrl,
  nombre,
  size = 96,
  subiendo = false,
  onElegir,
}: Props) {
  const manejarPress = async () => {
    if (subiendo) return;
    const foto = await elegirFotoDePerfil();
    if (foto) onElegir(foto);
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={manejarPress} disabled={subiendo} style={{ width: size, height: size }}>
        <Avatar fotoUrl={fotoUrl} nombre={nombre} size={size} />
        <View style={styles.editBadge}>
          {subiendo ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.editBadgeIcono}>📷</Text>
          )}
        </View>
      </Pressable>
      <Pressable onPress={manejarPress} disabled={subiendo}>
        <Text style={styles.cambiarTexto}>
          {subiendo ? 'Subiendo…' : fotoUrl ? 'Cambiar foto' : 'Agregar foto'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
  },
  editBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primaryDark,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadgeIcono: {
    fontSize: 14,
  },
  cambiarTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
});
