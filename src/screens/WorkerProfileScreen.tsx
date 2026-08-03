import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import StarRating from '../components/StarRating';
import { rubroLabel } from '../constants/rubros';
import { colors } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { esPremiumVigente } from '../lib/premium';
import { supabase } from '../lib/supabase';
import type { AppStackParamList } from '../navigation/types';
import type { Profile, Resena } from '../types/database';

type Props = NativeStackScreenProps<AppStackParamList, 'WorkerProfile'>;

export default function WorkerProfileScreen({ route, navigation }: Props) {
  const { workerId } = route.params;
  const { session } = useAuth();

  const [trabajador, setTrabajador] = useState<Profile | null>(null);
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [esCliente, setEsCliente] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelado = false;
      const userId = session?.user.id;

      async function cargar() {
        setLoading(true);
        setError(null);

        const [perfilResult, resenasResult, miPerfilResult] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', workerId).single(),
          supabase
            .from('resenas')
            .select('*')
            .eq('trabajador_id', workerId)
            .order('created_at', { ascending: false }),
          userId
            ? supabase.from('profiles').select('tipo_usuario').eq('id', userId).single()
            : Promise.resolve({ data: null, error: null }),
        ]);

        if (cancelado) return;

        if (perfilResult.error) {
          setError(perfilResult.error.message);
        } else {
          setTrabajador(perfilResult.data);
        }

        if (!resenasResult.error) {
          setResenas(resenasResult.data ?? []);
        }

        setEsCliente(miPerfilResult.data?.tipo_usuario === 'cliente');

        setLoading(false);
      }

      cargar();

      return () => {
        cancelado = true;
      };
    }, [workerId, session?.user.id])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error || !trabajador) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'No encontramos este perfil.'}</Text>
      </View>
    );
  }

  const inicial = trabajador.nombre.trim().charAt(0).toUpperCase() || '?';
  const puedeDejarResena = esCliente && trabajador.id !== session?.user.id;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        {trabajador.foto_url ? (
          <Image source={{ uri: trabajador.foto_url }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Text style={styles.photoInitial}>{inicial}</Text>
          </View>
        )}
        <View style={styles.nombreRow}>
          <Text style={styles.nombre}>{trabajador.nombre}</Text>
          {esPremiumVigente(trabajador) && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Destacado</Text>
            </View>
          )}
        </View>
        <Text style={styles.rubro}>{rubroLabel(trabajador.rubro)}</Text>
        <StarRating
          calificacion={trabajador.calificacion_promedio}
          cantidad={trabajador.cantidad_resenas}
          size={16}
        />
        {(trabajador.barrio || trabajador.departamento) && (
          <Text style={styles.ubicacion}>
            {[trabajador.barrio, trabajador.departamento].filter(Boolean).join(', ')}
          </Text>
        )}
        {trabajador.precio_orientativo !== null && (
          <Text style={styles.precio}>
            Precio orientativo: ${trabajador.precio_orientativo}
          </Text>
        )}

        {puedeDejarResena && (
          <Pressable
            style={styles.resenaButton}
            onPress={() =>
              navigation.navigate('DejarResena', {
                workerId: trabajador.id,
                nombreTrabajador: trabajador.nombre,
              })
            }
          >
            <Text style={styles.resenaButtonText}>✍️ Dejar reseña</Text>
          </Pressable>
        )}
      </View>

      {trabajador.descripcion && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre mí</Text>
          <Text style={styles.descripcion}>{trabajador.descripcion}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Historial de trabajos {resenas.length > 0 ? `(${resenas.length})` : ''}
        </Text>

        {resenas.length === 0 ? (
          <Text style={styles.sinResenas}>Todavía no tiene trabajos ni reseñas cargadas.</Text>
        ) : (
          resenas.map((resena) => (
            <View key={resena.id} style={styles.resenaCard}>
              <View style={styles.resenaHeader}>
                <Text style={styles.resenaTrabajo} numberOfLines={2}>
                  {resena.trabajo_descripcion ?? 'Trabajo realizado'}
                </Text>
                <StarRating
                  calificacion={resena.calificacion}
                  cantidad={1}
                  size={12}
                  mostrarConteo={false}
                />
              </View>
              {resena.comentario && <Text style={styles.resenaComentario}>“{resena.comentario}”</Text>}
              <Text style={styles.resenaCliente}>
                — {resena.cliente_nombre}, {formatearFecha(resena.created_at)}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-UY', { day: 'numeric', month: 'short', year: 'numeric' });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
  },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  photo: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: 8,
  },
  photoPlaceholder: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInitial: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  nombreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nombre: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  badge: {
    backgroundColor: '#FDECC8',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A5A00',
  },
  rubro: {
    fontSize: 14,
    color: colors.textMuted,
  },
  ubicacion: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  precio: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 6,
  },
  resenaButton: {
    marginTop: 14,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  resenaButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  descripcion: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  sinResenas: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  resenaCard: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    gap: 4,
  },
  resenaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  resenaTrabajo: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  resenaComentario: {
    fontSize: 13,
    color: colors.text,
    fontStyle: 'italic',
  },
  resenaCliente: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
