import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { elegirFotoDeTrabajo, subirFotoDeTrabajo } from '../lib/publicaciones';
import { supabase } from '../lib/supabase';
import type { AppStackParamList } from '../navigation/types';
import type { FotoElegida } from '../lib/avatar';

type Props = NativeStackScreenProps<AppStackParamList, 'PublicarTrabajo'>;

const DESCRIPCION_MAX = 300;

export default function PublicarTrabajoScreen({ navigation }: Props) {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [foto, setFoto] = useState<FotoElegida | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [publicando, setPublicando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const elegirFoto = async () => {
    const elegida = await elegirFotoDeTrabajo();
    if (elegida) setFoto(elegida);
  };

  const publicar = async () => {
    setError(null);

    if (!userId) return;
    if (!foto) {
      setError('Elegí una foto del trabajo que hiciste.');
      return;
    }

    setPublicando(true);

    const { url, error: uploadError } = await subirFotoDeTrabajo(userId, foto);

    if (uploadError || !url) {
      setPublicando(false);
      setError(uploadError ?? 'No pudimos subir la foto. Probá de nuevo.');
      return;
    }

    const { error: insertError } = await supabase.from('publicaciones').insert({
      trabajador_id: userId,
      imagen_url: url,
      descripcion: descripcion.trim() || null,
    });

    setPublicando(false);

    if (insertError) {
      setError(`No pudimos publicar el trabajo: ${insertError.message}`);
      return;
    }

    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <Text style={styles.label}>Foto del trabajo</Text>
          <Pressable style={styles.fotoBox} onPress={elegirFoto} disabled={publicando}>
            {foto ? (
              <Image source={{ uri: foto.uri }} style={styles.foto} resizeMode="cover" />
            ) : (
              <Text style={styles.fotoPlaceholder}>📷 Elegir foto</Text>
            )}
          </Pressable>
          {foto && (
            <Pressable onPress={elegirFoto} disabled={publicando}>
              <Text style={styles.cambiarFotoTexto}>Cambiar foto</Text>
            </Pressable>
          )}

          <Text style={styles.label}>Descripción (opcional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Contanos brevemente qué trabajo hiciste…"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            maxLength={DESCRIPCION_MAX}
            value={descripcion}
            onChangeText={setDescripcion}
            editable={!publicando}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={publicar}
            disabled={publicando}
          >
            {publicando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Publicar</Text>
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
  form: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginTop: 14,
    marginBottom: 6,
  },
  fotoBox: {
    width: 140,
    height: 105,
    alignSelf: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  foto: {
    width: '100%',
    height: '100%',
  },
  fotoPlaceholder: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  cambiarFotoTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 8,
    alignSelf: 'center',
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
    minHeight: 80,
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
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonPressed: {
    backgroundColor: colors.primaryDark,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
