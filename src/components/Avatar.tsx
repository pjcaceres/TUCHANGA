import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';

interface Props {
  fotoUrl: string | null;
  nombre: string;
  size: number;
  esPremium?: boolean;
}

export default function Avatar({ fotoUrl, nombre, size, esPremium = false }: Props) {
  const [fotoFallo, setFotoFallo] = useState(false);
  const inicial = nombre.trim().charAt(0).toUpperCase() || '?';
  const dimension = { width: size, height: size, borderRadius: size / 2 };
  const badgeSize = Math.max(16, Math.round(size * 0.34));

  // Si cambia la URL (foto nueva), le damos otra chance antes de asumir que falló.
  useEffect(() => {
    setFotoFallo(false);
  }, [fotoUrl]);

  return (
    <View style={{ width: size, height: size }}>
      {fotoUrl && !fotoFallo ? (
        <Image source={{ uri: fotoUrl }} style={dimension} onError={() => setFotoFallo(true)} />
      ) : (
        <View style={[dimension, styles.placeholder]}>
          <Text style={[styles.inicial, { fontSize: size * 0.4 }]}>{inicial}</Text>
        </View>
      )}

      {esPremium && (
        <View
          style={[
            styles.badge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              borderWidth: Math.max(1.5, size * 0.02),
            },
          ]}
        >
          <Text style={[styles.badgeIcono, { fontSize: badgeSize * 0.62 }]}>⭐</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inicial: {
    color: '#fff',
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#D89A1B',
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIcono: {
    color: '#fff',
    fontWeight: '700',
  },
});
