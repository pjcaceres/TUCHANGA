import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppHeader from '../components/AppHeader';
import Avatar from '../components/Avatar';
import ConfirmDialog from '../components/ConfirmDialog';
import PublicacionesGrid from '../components/PublicacionesGrid';
import RubroChipsList from '../components/RubroChipsList';
import StarRating from '../components/StarRating';
import { colors } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { esPremiumVigente } from '../lib/premium';
import { eliminarPublicacion } from '../lib/publicaciones';
import { supabase } from '../lib/supabase';
import type { AppStackParamList } from '../navigation/types';
import type { Profile, Publicacion } from '../types/database';

type Props = NativeStackScreenProps<AppStackParamList, 'MiPerfil'>;

export default function MiPerfilScreen({ navigation }: Props) {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [perfil, setPerfil] = useState<Profile | null>(null);
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorPublicacion, setErrorPublicacion] = useState<string | null>(null);
  const [aBorrarId, setABorrarId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelado = false;

      async function cargar() {
        if (!userId) return;
        setLoading(true);
        setError(null);

        const [perfilResult, publicacionesResult] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', userId).single(),
          supabase
            .from('publicaciones')
            .select('*')
            .eq('trabajador_id', userId)
            .order('created_at', { ascending: false }),
        ]);

        if (cancelado) return;

        if (perfilResult.error) {
          setError(perfilResult.error.message);
        } else {
          setPerfil(perfilResult.data);
        }

        if (!publicacionesResult.error) {
          setPublicaciones(publicacionesResult.data ?? []);
        }

        setLoading(false);
      }

      cargar();

      return () => {
        cancelado = true;
      };
    }, [userId])
  );

  const confirmarBorrado = async () => {
    const publicacionId = aBorrarId;
    setABorrarId(null);
    if (!publicacionId) return;

    setErrorPublicacion(null);
    const anteriores = publicaciones;
    setPublicaciones((actuales) => actuales.filter((p) => p.id !== publicacionId));

    const { error: deleteError } = await eliminarPublicacion(publicacionId);
    if (deleteError) {
      setPublicaciones(anteriores);
      setErrorPublicacion(deleteError);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        activo="miPerfil"
        esTrabajador
        onTrabajadores={() => navigation.navigate('WorkersList')}
        onPublicaciones={() => navigation.navigate('PublicacionesFeed')}
        onMiPerfil={() => {}}
        onPremium={() => navigation.navigate('Premium')}
        onMisChats={() => navigation.navigate('MisChats')}
        onConfiguracion={() => navigation.navigate('Configuracion')}
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error || !perfil ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error ?? 'No pudimos cargar tu perfil.'}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerCard}>
            <Avatar fotoUrl={perfil.foto_url} nombre={perfil.nombre} size={88} />
            <Text style={styles.nombre}>{perfil.nombre}</Text>
            <RubroChipsList rubros={perfil.rubros} />
            <StarRating
              calificacion={perfil.calificacion_promedio}
              cantidad={perfil.cantidad_resenas}
              size={16}
            />

            <View style={styles.accionesRow}>
              <Pressable
                style={styles.editarButton}
                onPress={() => navigation.navigate('EditarPerfil')}
              >
                <Text style={styles.editarButtonText}>Editar perfil</Text>
              </Pressable>
              <Pressable
                style={styles.premiumButton}
                onPress={() => navigation.navigate('Premium')}
              >
                <Text style={styles.premiumButtonText}>
                  {esPremiumVigente(perfil) ? '⭐ Premium activo' : '⭐ Hacete Premium'}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Mis publicaciones {publicaciones.length > 0 ? `(${publicaciones.length})` : ''}
            </Text>
            {errorPublicacion && <Text style={styles.errorText}>{errorPublicacion}</Text>}
            {publicaciones.length === 0 ? (
              <Text style={styles.sinPublicaciones}>
                Todavía no publicaste ninguna foto de trabajo.
              </Text>
            ) : (
              <PublicacionesGrid publicaciones={publicaciones} onEliminar={setABorrarId} />
            )}
          </View>
        </ScrollView>
      )}

      <ConfirmDialog
        visible={aBorrarId !== null}
        titulo="Eliminar publicación"
        mensaje="¿Estás seguro que querés eliminar esta publicación? Esta acción no se puede deshacer."
        textoConfirmar="Eliminar"
        destructivo
        onConfirmar={confirmarBorrado}
        onCancelar={() => setABorrarId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  nombre: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  accionesRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  editarButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  editarButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  premiumButton: {
    backgroundColor: '#FDECC8',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  premiumButtonText: {
    color: '#8A5A00',
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  sinPublicaciones: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
