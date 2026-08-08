import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Avatar from '../components/Avatar';
import { colors } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { AppStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'MisChats'>;

type ChatItem = {
  conversacionId: string;
  otroUsuarioId: string;
  otroUsuarioNombre: string;
  otroUsuarioFoto: string | null;
};

export default function MisChatsScreen({ navigation }: Props) {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [chats, setChats] = useState<ChatItem[]>([]);
  const [esTrabajador, setEsTrabajador] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelado = false;

      async function cargar() {
        if (!userId) {
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        const [{ data: miPerfil }, { data: conversaciones, error: conversacionesError }] =
          await Promise.all([
            supabase.from('profiles').select('tipo_usuario').eq('id', userId).maybeSingle(),
            supabase
              .from('conversaciones')
              .select('*')
              .or(`cliente_id.eq.${userId},trabajador_id.eq.${userId}`)
              .order('created_at', { ascending: false }),
          ]);

        if (cancelado) return;

        setEsTrabajador(miPerfil?.tipo_usuario === 'trabajador');

        if (conversacionesError) {
          setError(conversacionesError.message);
          setLoading(false);
          return;
        }

        const lista = conversaciones ?? [];
        const otrosIds = Array.from(
          new Set(lista.map((c) => (c.cliente_id === userId ? c.trabajador_id : c.cliente_id)))
        );

        const { data: perfiles } = otrosIds.length
          ? await supabase.from('profiles').select('id, nombre, foto_url').in('id', otrosIds)
          : { data: [] };

        if (cancelado) return;

        const perfilPorId = new Map((perfiles ?? []).map((p) => [p.id, p]));

        setChats(
          lista.map((c) => {
            const otroUsuarioId = c.cliente_id === userId ? c.trabajador_id : c.cliente_id;
            const otroPerfil = perfilPorId.get(otroUsuarioId);
            return {
              conversacionId: c.id,
              otroUsuarioId,
              otroUsuarioNombre: otroPerfil?.nombre ?? 'Usuario',
              otroUsuarioFoto: otroPerfil?.foto_url ?? null,
            };
          })
        );
        setLoading(false);
      }

      cargar();

      return () => {
        cancelado = true;
      };
    }, [userId])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={chats}
      keyExtractor={(item) => item.conversacionId}
      ListEmptyComponent={
        <Text style={styles.vacio}>
          {esTrabajador
            ? 'Todavía no tenés conversaciones. Vas a ver acá los mensajes de los clientes que te contacten.'
            : 'Todavía no tenés conversaciones. Contactá a un trabajador para empezar.'}
        </Text>
      }
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [styles.chatCard, pressed && styles.chatCardPressed]}
          onPress={() =>
            navigation.navigate('Chat', {
              conversacionId: item.conversacionId,
              nombreOtroUsuario: item.otroUsuarioNombre,
            })
          }
        >
          <Avatar fotoUrl={item.otroUsuarioFoto} nombre={item.otroUsuarioNombre} size={44} />
          <Text style={styles.nombre}>{item.otroUsuarioNombre}</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    gap: 10,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  vacio: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 40,
    paddingHorizontal: 24,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chatCardPressed: {
    opacity: 0.7,
  },
  nombre: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
