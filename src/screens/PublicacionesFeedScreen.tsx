import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import AppHeader from '../components/AppHeader';
import PublicacionCard from '../components/PublicacionCard';
import { colors } from '../constants/theme';
import { useMiPerfil } from '../contexts/ProfileContext';
import { supabase } from '../lib/supabase';
import type { AppStackParamList } from '../navigation/types';
import type { Publicacion } from '../types/database';

type Props = NativeStackScreenProps<AppStackParamList, 'PublicacionesFeed'>;

type Autor = { nombre: string; fotoUrl: string | null };

export default function PublicacionesFeedScreen({ navigation }: Props) {
  // "esTrabajador" sale del contexto compartido (no de un fetch propio de
  // esta pantalla) para que no arranque en false cada vez que React
  // Navigation vuelve a montarla al cambiar de pestaña, lo que hacía
  // parpadear la pestaña "Mi Perfil".
  const { perfil: miPerfil, cargando: cargandoMiPerfil } = useMiPerfil();
  const esTrabajador = miPerfil?.tipo_usuario === 'trabajador';

  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [autoresPorId, setAutoresPorId] = useState<Map<string, Autor>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <View style={styles.container}>
      <AppHeader
        activo="publicaciones"
        esTrabajador={esTrabajador}
        cargando={cargandoMiPerfil}
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
          renderItem={({ item }) => {
            const autor = autoresPorId.get(item.trabajador_id);
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
              />
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
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
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 14,
  },
});
