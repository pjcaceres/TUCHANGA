import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';
import type { Publicacion, PublicacionFoto } from '../types/database';
import Avatar from './Avatar';
import Carousel from './Carousel';
import LikeButton from './LikeButton';

interface Autor {
  nombre: string;
  fotoUrl: string | null;
}

interface Props {
  publicacion: Publicacion;
  fotos: PublicacionFoto[];
  autor?: Autor;
  onPressAutor?: () => void;
  esPropia?: boolean;
  onEliminar?: () => void;
  likeado?: boolean;
  cantidadLikes?: number;
  onToggleLike?: () => void;
}

export default function PublicacionCard({
  publicacion,
  fotos,
  autor,
  onPressAutor,
  esPropia,
  onEliminar,
  likeado = false,
  cantidadLikes = 0,
  onToggleLike,
}: Props) {
  return (
    <View style={styles.card}>
      {(autor || esPropia) && (
        <View style={styles.headerRow}>
          {autor ? (
            <Pressable style={styles.autorRow} onPress={onPressAutor} disabled={!onPressAutor}>
              <Avatar fotoUrl={autor.fotoUrl} nombre={autor.nombre} size={32} />
              <Text style={styles.autorNombre} numberOfLines={1}>
                {autor.nombre}
              </Text>
            </Pressable>
          ) : (
            <View />
          )}
          {esPropia && <Text style={styles.propiaTexto}>Tu publicación</Text>}
        </View>
      )}

      <Carousel urls={fotos.map((f) => f.imagen_url)} />

      <View style={styles.info}>
        {publicacion.descripcion && <Text style={styles.descripcion}>{publicacion.descripcion}</Text>}
        <View style={styles.footerRow}>
          <View style={styles.footerLeft}>
            {onToggleLike && (
              <LikeButton likeado={likeado} cantidad={cantidadLikes} onPress={onToggleLike} />
            )}
            <Text style={styles.fecha}>{formatearFecha(publicacion.created_at)}</Text>
          </View>
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
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  autorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
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
  info: {
    padding: 12,
    gap: 6,
  },
  descripcion: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 19,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
