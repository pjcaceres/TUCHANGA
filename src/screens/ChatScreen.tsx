import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { AppStackParamList } from '../navigation/types';
import type { Mensaje } from '../types/database';

type Props = NativeStackScreenProps<AppStackParamList, 'Chat'>;

export default function ChatScreen({ route }: Props) {
  const { conversacionId } = route.params;
  const { session } = useAuth();
  const userId = session?.user.id;

  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const listaRef = useRef<FlatList<Mensaje>>(null);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setLoading(true);
      const { data } = await supabase
        .from('mensajes')
        .select('*')
        .eq('conversacion_id', conversacionId)
        .order('created_at', { ascending: true });

      if (!cancelado) {
        setMensajes(data ?? []);
        setLoading(false);
      }
    }

    cargar();

    const canal = supabase
      .channel(`mensajes-${conversacionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes',
          filter: `conversacion_id=eq.${conversacionId}`,
        },
        (payload) => {
          setMensajes((actuales) => [...actuales, payload.new as Mensaje]);
        }
      )
      .subscribe();

    return () => {
      cancelado = true;
      supabase.removeChannel(canal);
    };
  }, [conversacionId]);

  const enviarMensaje = useCallback(async () => {
    const contenido = texto.trim();
    if (!contenido || !userId) return;

    setEnviando(true);
    setTexto('');

    const { error, data } = await supabase
      .from('mensajes')
      .insert({ conversacion_id: conversacionId, remitente_id: userId, contenido })
      .select('*')
      .single();

    setEnviando(false);

    if (!error && data) {
      setMensajes((actuales) =>
        actuales.some((m) => m.id === data.id) ? actuales : [...actuales, data]
      );
    }
  }, [texto, userId, conversacionId]);

  useEffect(() => {
    if (mensajes.length > 0) {
      requestAnimationFrame(() => listaRef.current?.scrollToEnd({ animated: true }));
    }
  }, [mensajes.length]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={listaRef}
        style={styles.lista}
        contentContainerStyle={styles.listaContenido}
        data={mensajes}
        keyExtractor={(item) => item.id}
        onContentSizeChange={() => listaRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => {
          const esMio = item.remitente_id === userId;
          return (
            <View style={[styles.burbujaFila, esMio && styles.burbujaFilaMia]}>
              <View style={[styles.burbuja, esMio ? styles.burbujaMia : styles.burbujaOtro]}>
                <Text style={[styles.burbujaTexto, esMio && styles.burbujaTextoMio]}>
                  {item.contenido}
                </Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.vacio}>Todavía no hay mensajes. ¡Escribí el primero!</Text>
        }
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Escribí un mensaje…"
          placeholderTextColor={colors.textMuted}
          value={texto}
          onChangeText={setTexto}
          multiline
          editable={!enviando}
        />
        <Pressable
          style={({ pressed }) => [
            styles.enviarButton,
            (pressed || !texto.trim()) && styles.enviarButtonDeshabilitado,
          ]}
          onPress={enviarMensaje}
          disabled={!texto.trim() || enviando}
        >
          <Text style={styles.enviarButtonText}>Enviar</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  lista: {
    flex: 1,
  },
  listaContenido: {
    padding: 16,
    gap: 8,
  },
  vacio: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 40,
  },
  burbujaFila: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  burbujaFilaMia: {
    justifyContent: 'flex-end',
  },
  burbuja: {
    maxWidth: '78%',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  burbujaOtro: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  burbujaMia: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  burbujaTexto: {
    fontSize: 15,
    color: colors.text,
  },
  burbujaTextoMio: {
    color: '#fff',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.background,
    maxHeight: 120,
  },
  enviarButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  enviarButtonDeshabilitado: {
    opacity: 0.5,
  },
  enviarButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
