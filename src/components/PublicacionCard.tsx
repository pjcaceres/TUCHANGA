import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';
import type { Publicacion } from '../types/database';
import Avatar from './Avatar';

interface Autor {
  nombre: string;
  fotoUrl: string | null;
}

interface Props {
  publicacion: Publicacion;
  autor?: Autor;
  onPressAutor?: () => void;
}

export default function PublicacionCard({ publicacion, autor, onPressAutor }: Props) {
  return (
    <View style={styles.card}>
      {autor && (
        <Pressable style={styles.autorRow} onPress={onPressAutor} disabled={!onPressAutor}>
          <Avatar fotoUrl={autor.fotoUrl} nombre={autor.nombre} size={36} />
          <Text style={styles.autorNombre}>{autor.nombre}</Text>
        </Pressable>
      )}
      <Image source={{ uri: publicacion.imagen_url }} style={styles.imagen} resizeMode="cover" />
      {publicacion.descripcion && <Text style={styles.descripcion}>{publicacion.descripcion}</Text>}
      <Text style={styles.fecha}>{formatearFecha(publicacion.created_at)}</Text>
    </View>
  );
}

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-UY', { day: 'numeric', month: 'short', year: 'numeric' });
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  autorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  autorNombre: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  imagen: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: colors.background,
  },
  descripcion: {
    fontSize: 14,
    color: colors.text,
    paddingHorizontal: 12,
    paddingTop: 10,
    lineHeight: 19,
  },
  fecha: {
    fontSize: 12,
    color: colors.textMuted,
    padding: 12,
    paddingTop: 6,
  },
});
