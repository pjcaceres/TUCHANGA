import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Avatar from '../components/Avatar';
import ConfirmDialog from '../components/ConfirmDialog';
import PublicacionCard from '../components/PublicacionCard';
import RubroChipsList from '../components/RubroChipsList';
import StarRating from '../components/StarRating';
import { colors } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { haContactadoAlTrabajador, obtenerOCrearConversacion } from '../lib/chat';
import { esPremiumVigente } from '../lib/premium';
import { eliminarPublicacion } from '../lib/publicaciones';
import { supabase } from '../lib/supabase';
import type { AppStackParamList } from '../navigation/types';
import type { Profile, Publicacion, Resena } from '../types/database';

type Props = NativeStackScreenProps<AppStackParamList, 'WorkerProfile'>;

export default function WorkerProfileScreen({ route, navigation }: Props) {
  const { workerId } = route.params;
  const { session } = useAuth();

  const [trabajador, setTrabajador] = useState<Profile | null>(null);
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [esCliente, setEsCliente] = useState(false);
  const [haContactado, setHaContactado] = useState(false);
  const [contactando, setContactando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorPublicacion, setErrorPublicacion] = useState<string | null>(null);
  const [aBorrarId, setABorrarId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelado = false;
      const userId = session?.user.id;

      async function cargar() {
        setLoading(true);
        setError(null);

        const [perfilResult, resenasResult, publicacionesResult, miPerfilResult] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', workerId).single(),
          supabase
            .from('resenas')
            .select('*')
            .eq('trabajador_id', workerId)
            .order('created_at', { ascending: false }),
          supabase
            .from('publicaciones')
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

        if (!publicacionesResult.error) {
          setPublicaciones(publicacionesResult.data ?? []);
        }

        const clienteConfirmado = miPerfilResult.data?.tipo_usuario === 'cliente';
        setEsCliente(clienteConfirmado);

        if (clienteConfirmado && userId) {
          const contactado = await haContactadoAlTrabajador(userId, workerId);
          if (!cancelado) setHaContactado(contactado);
        } else {
          setHaContactado(false);
        }

        setLoading(false);
      }

      cargar();

      return () => {
        cancelado = true;
      };
    }, [workerId, session?.user.id])
  );

  const contactar = async () => {
    const userId = session?.user.id;
    if (!userId || contactando) return;

    setContactando(true);
    const { conversacionId, error: errorConversacion } = await obtenerOCrearConversacion(
      userId,
      workerId
    );
    setContactando(false);

    if (errorConversacion || !conversacionId) {
      setError(errorConversacion ?? 'No pudimos abrir el chat. Probá de nuevo.');
      return;
    }

    navigation.navigate('Chat', {
      conversacionId,
      nombreOtroUsuario: trabajador?.nombre ?? 'Chat',
    });
  };

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

  const esOtroUsuario = trabajador.id !== session?.user.id;
  const puedeDejarResena = esCliente && esOtroUsuario && haContactado;
  const necesitaContactarPrimero = esCliente && esOtroUsuario && !haContactado;

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
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          <View style={styles.photoWrap}>
            <Avatar fotoUrl={trabajador.foto_url} nombre={trabajador.nombre} size={88} />
          </View>
          <View style={styles.nombreRow}>
            <Text style={styles.nombre}>{trabajador.nombre}</Text>
            {esPremiumVigente(trabajador) && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Destacado</Text>
              </View>
            )}
          </View>
          <View style={styles.rubroWrap}>
            <RubroChipsList rubros={trabajador.rubros} />
          </View>
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
          {esOtroUsuario && (
            <Pressable style={styles.contactarButton} onPress={contactar} disabled={contactando}>
              {contactando ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={styles.contactarButtonText}>💬 Contactar</Text>
              )}
            </Pressable>
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

          {necesitaContactarPrimero && (
            <Text style={styles.avisoContacto}>
              Necesitás contactar a este trabajador antes de poder dejarle una reseña.
            </Text>
          )}
        </View>

        {trabajador.descripcion && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sobre mí</Text>
            <Text style={styles.descripcion}>{trabajador.descripcion}</Text>
          </View>
        )}

        {publicaciones.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trabajos publicados ({publicaciones.length})</Text>
            {errorPublicacion && <Text style={styles.errorText}>{errorPublicacion}</Text>}
            <View style={styles.publicacionesList}>
              {publicaciones.map((publicacion) => (
                <PublicacionCard
                  key={publicacion.id}
                  publicacion={publicacion}
                  esPropia={!esOtroUsuario}
                  onEliminar={!esOtroUsuario ? () => setABorrarId(publicacion.id) : undefined}
                />
              ))}
            </View>
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

      <ConfirmDialog
        visible={aBorrarId !== null}
        titulo="Eliminar publicación"
        mensaje="¿Estás seguro que querés eliminar esta publicación? Esta acción no se puede deshacer."
        textoConfirmar="Eliminar"
        destructivo
        onConfirmar={confirmarBorrado}
        onCancelar={() => setABorrarId(null)}
      />
    </>
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
  photoWrap: {
    marginBottom: 8,
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
  rubroWrap: {
    marginTop: 2,
  },
  ubicacion: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  contactarButton: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  contactarButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  resenaButton: {
    marginTop: 10,
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
  avisoContacto: {
    marginTop: 10,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 8,
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
  publicacionesList: {
    gap: 12,
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
