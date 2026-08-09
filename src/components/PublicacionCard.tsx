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
  esPropia?: boolean;
  onEliminar?: () => void;
}

export default function PublicacionCard({
  publicacion,
  autor,
  onPressAutor,
  esPropia,
  onEliminar,
}: Props) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: publicacion.imagen_url }} style={styles.imagen} resizeMode="cover" />
      <View style={styles.info}>
        {autor && (
          <Pressable style={styles.autorRow} onPress={onPressAutor} disabled={!onPressAutor}>
            <Avatar fotoUrl={autor.fotoUrl} nombre={autor.nombre} size={22} />
            <Text style={styles.autorNombre} numberOfLines={1}>
              {autor.nombre}
            </Text>
          </Pressable>
        )}
        {esPropia && <Text style={styles.propiaTexto}>Tu publicación</Text>}
        {publicacion.descripcion && (
          <Text style={styles.descripcion} numberOfLines={2}>
            {publicacion.descripcion}
          </Text>
        )}
        <View style={styles.footerRow}>
          <Text style={styles.fecha}>{formatearFecha(publicacion.created_at)}</Text>
          {esPropia && onEliminar && (
            <Pressable onPress={onEliminar} hitSlop={8}>
              <Text style={styles.eliminarTexto}>Eliminar</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-UY', { day: 'numeric', month: 'short', year: 'numeric' });
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 12,
  },
  imagen: {
    width: 84,
    height: 84,
    borderRadius: 10,
    backgroundColor: colors.background,
  },
  info: {
    flex: 1,
    gap: 4,
    justifyContent: 'center',
  },
  autorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  autorNombre: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    flexShrink: 1,
  },
  propiaTexto: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  descripcion: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  fecha: {
    fontSize: 12,
    color: colors.textMuted,
  },
  eliminarTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.error,
  },
});
