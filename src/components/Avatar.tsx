import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';

interface Props {
  fotoUrl: string | null;
  nombre: string;
  size: number;
}

export default function Avatar({ fotoUrl, nombre, size }: Props) {
  const [fotoFallo, setFotoFallo] = useState(false);
  const inicial = nombre.trim().charAt(0).toUpperCase() || '?';
  const dimension = { width: size, height: size, borderRadius: size / 2 };

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
});
