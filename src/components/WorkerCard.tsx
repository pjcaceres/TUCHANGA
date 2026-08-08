import { Pressable, StyleSheet, Text, View } from 'react-native';
import { rubrosLabel } from '../constants/rubros';
import { colors } from '../constants/theme';
import { esPremiumVigente } from '../lib/premium';
import type { Profile } from '../types/database';
import Avatar from './Avatar';
import StarRating from './StarRating';

interface Props {
  trabajador: Profile;
  distanciaKm: number | null;
  onPress: () => void;
}

export default function WorkerCard({ trabajador, distanciaKm, onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <Avatar fotoUrl={trabajador.foto_url} nombre={trabajador.nombre} size={56} />

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.nombre} numberOfLines={1}>
            {trabajador.nombre}
          </Text>
          {esPremiumVigente(trabajador) && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Destacado</Text>
            </View>
          )}
        </View>
        <Text style={styles.rubro}>{rubrosLabel(trabajador.rubros)}</Text>
        <StarRating
          calificacion={trabajador.calificacion_promedio}
          cantidad={trabajador.cantidad_resenas}
        />
      </View>

      {distanciaKm !== null && (
        <View style={styles.distanciaContainer}>
          <Text style={styles.distancia}>{formatearDistancia(distanciaKm)}</Text>
        </View>
      )}
    </Pressable>
  );
}

function formatearDistancia(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  cardPressed: {
    backgroundColor: colors.background,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nombre: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    flexShrink: 1,
  },
  badge: {
    backgroundColor: '#FDECC8',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A5A00',
  },
  rubro: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 2,
  },
  distanciaContainer: {
    alignItems: 'flex-end',
  },
  distancia: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
});
