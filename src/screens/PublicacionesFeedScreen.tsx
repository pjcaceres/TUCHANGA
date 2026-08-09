import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import AppHeader from '../components/AppHeader';
import ConfirmDialog from '../components/ConfirmDialog';
import PublicacionCard from '../components/PublicacionCard';
import { colors } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { useMiPerfil } from '../contexts/ProfileContext';
import { eliminarPublicacion } from '../lib/publicaciones';
import { supabase } from '../lib/supabase';
import type { AppStackParamList } from '../navigation/types';
import type { Publicacion } from '../types/database';

type Props = NativeStackScreenProps<AppStackParamList, 'PublicacionesFeed'>;

type Autor = { nombre: string; fotoUrl: string | null };

export default function PublicacionesFeedScreen({ navigation }: Props) {
  const { session } = useAuth();
  const userId = session?.user.id;

  // Igual que en WorkersListScreen: "esTrabajador" sale del contexto
  // compartido (no de un fetch propio de esta pantalla) para que no
  // arranque en false cada vez que React Navigation vuelve a montarla al
  // cambiar de pestaña, lo que hacía parpadear la pestaña "Mi Perfil".
  const { perfil: miPerfil } = useMiPerfil();
  const esTrabajador = miPerfil?.tipo_usuario === 'trabajador';

  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [autoresPorId, setAutoresPorId] = useState<Map<string, Autor>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorPublicacion, setErrorPublicacion] = useState<string | null>(null);
  const [aBorrarId, setABorrarId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelado = false;

      async function cargar() {
        setLoading(true);
        setError(null);

        const { data: feed, error: feedError } = await supabase
          .from('publicaciones')
          .select('*')
          .order('created_at', { ascending: false });

        if (cancelado) return;

        if (feedError) {
          setError(feedError.message);
          setPublicaciones([]);
          setLoading(false);
          return;
        }

        const lista = feed ?? [];
        setPublicaciones(lista);

        const autorIds = Array.from(new Set(lista.map((p) => p.trabajador_id)));
        const { data: perfiles } = autorIds.length
          ? await supabase.from('profiles').select('id, nombre, foto_url').in('id', autorIds)
          : { data: [] };

        if (cancelado) return;

        setAutoresPorId(
          new Map((perfiles ?? []).map((p) => [p.id, { nombre: p.nombre, fotoUrl: p.foto_url }]))
        );
        setLoading(false);
      }

      cargar();

      return () => {
        cancelado = true;
      };
    }, [])
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
        activo="publicaciones"
        esTrabajador={esTrabajador}
        onTrabajadores={() => navigation.navigate('WorkersList')}
        onPublicaciones={() => {}}
        onMiPerfil={() => navigation.navigate('MiPerfil')}
        onPremium={() => navigation.navigate('Premium')}
        onMisChats={() => navigation.navigate('MisChats')}
        onConfiguracion={() => navigation.navigate('Configuracion')}
      />

      {esTrabajador && (
        <View style={styles.publicarSection}>
          <Pressable
            style={styles.publicarButton}
            onPress={() => navigation.navigate('PublicarTrabajo')}
          >
            <Text style={styles.publicarButtonText}>+ Publicar un trabajo</Text>
          </Pressable>
        </View>
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : publicaciones.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>
            Todavía no hay trabajos publicados. {esTrabajador ? 'Sé el primero en publicar uno.' : ''}
          </Text>
        </View>
      ) : (
        <FlatList
          data={publicaciones}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            errorPublicacion ? (
              <Text style={[styles.errorText, styles.errorPublicacion]}>{errorPublicacion}</Text>
            ) : null
          }
          renderItem={({ item }) => {
            const autor = autoresPorId.get(item.trabajador_id);
            const esPropia = item.trabajador_id === userId;
            return (
              <PublicacionCard
                publicacion={item}
                autor={autor}
                onPressAutor={() =>
                  navigation.navigate('WorkerProfile', {
                    workerId: item.trabajador_id,
                    nombre: autor?.nombre ?? 'Trabajador',
                  })
                }
                esPropia={esPropia}
                onEliminar={esPropia ? () => setABorrarId(item.id) : undefined}
              />
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
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
  publicarSection: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  publicarButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  publicarButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  separator: {
    height: 14,
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
  errorPublicacion: {
    marginBottom: 12,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 14,
  },
});
