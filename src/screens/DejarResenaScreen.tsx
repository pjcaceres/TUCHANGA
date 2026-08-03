import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import StarRatingInput from '../components/StarRatingInput';
import { colors } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { AppStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'DejarResena'>;

export default function DejarResenaScreen({ route, navigation }: Props) {
  const { workerId, nombreTrabajador } = route.params;
  const { session } = useAuth();

  const [calificacion, setCalificacion] = useState(0);
  const [trabajoDescripcion, setTrabajoDescripcion] = useState('');
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enviarResena = async () => {
    setError(null);

    if (calificacion < 1) {
      setError('Elegí una calificación de 1 a 5 estrellas.');
      return;
    }
    if (!trabajoDescripcion.trim()) {
      setError('Contanos brevemente qué trabajo te realizó.');
      return;
    }

    const userId = session?.user.id;
    if (!userId) {
      setError('Iniciá sesión para poder dejar una reseña.');
      return;
    }

    setEnviando(true);

    const { data: miPerfil, error: perfilError } = await supabase
      .from('profiles')
      .select('nombre')
      .eq('id', userId)
      .single();

    if (perfilError) {
      setEnviando(false);
      setError('No pudimos identificar tu perfil. Probá de nuevo.');
      return;
    }

    const { error: insertError } = await supabase.from('resenas').insert({
      trabajador_id: workerId,
      cliente_id: userId,
      cliente_nombre: miPerfil.nombre,
      trabajo_descripcion: trabajoDescripcion.trim(),
      calificacion,
      comentario: comentario.trim() || null,
    });

    setEnviando(false);

    if (insertError) {
      setError(`No pudimos guardar tu reseña: ${insertError.message}`);
      return;
    }

    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Dejar reseña</Text>
        <Text style={styles.subtitle}>Contanos cómo te fue con {nombreTrabajador}</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Calificación</Text>
          <StarRatingInput valor={calificacion} onChange={setCalificacion} />

          <Text style={styles.label}>¿Qué trabajo te realizó?</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: cambio de tablero eléctrico"
            placeholderTextColor={colors.textMuted}
            value={trabajoDescripcion}
            onChangeText={setTrabajoDescripcion}
            editable={!enviando}
          />

          <Text style={styles.label}>Comentario (opcional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Contanos cómo fue tu experiencia…"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            maxLength={500}
            value={comentario}
            onChangeText={setComentario}
            editable={!enviando}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={enviarResena}
            disabled={enviando}
          >
            {enviando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Publicar reseña</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    marginTop: 12,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonPressed: {
    backgroundColor: colors.primaryDark,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
