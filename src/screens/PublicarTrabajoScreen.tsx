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
import type { FotoElegida } from '../lib/avatar';
import {
  elegirFotosDeTrabajo,
  MAX_FOTOS_POR_PUBLICACION,
  subirFotosDeTrabajo,
} from '../lib/publicaciones';
import { supabase } from '../lib/supabase';
import type { AppStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'PublicarTrabajo'>;

const DESCRIPCION_MAX = 300;

export default function PublicarTrabajoScreen({ navigation }: Props) {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [fotos, setFotos] = useState<FotoElegida[]>([]);
  const [descripcion, setDescripcion] = useState('');
  const [publicando, setPublicando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const agregarFotos = async () => {
    const espacioDisponible = MAX_FOTOS_POR_PUBLICACION - fotos.length;
    if (espacioDisponible <= 0) return;

    const elegidas = await elegirFotosDeTrabajo(espacioDisponible);
    if (elegidas.length > 0) {
      setFotos((actuales) => [...actuales, ...elegidas].slice(0, MAX_FOTOS_POR_PUBLICACION));
    }
  };

  const quitarFoto = (indice: number) => {
    setFotos((actuales) => actuales.filter((_, i) => i !== indice));
  };

  const publicar = async () => {
    setError(null);

    if (!userId) return;
    if (fotos.length === 0) {
      setError('Elegí al menos una foto del trabajo que hiciste.');
      return;
    }

    setPublicando(true);

    const { urls, error: uploadError } = await subirFotosDeTrabajo(userId, fotos);

    if (uploadError || urls.length !== fotos.length) {
      setPublicando(false);
      setError(uploadError ?? 'No pudimos subir las fotos. Probá de nuevo.');
      return;
    }

    const { data: publicacionCreada, error: insertError } = await supabase
      .from('publicaciones')
      .insert({ trabajador_id: userId, descripcion: descripcion.trim() || null })
      .select('id')
      .single();

    if (insertError || !publicacionCreada) {
      setPublicando(false);
      setError(`No pudimos publicar el trabajo: ${insertError?.message ?? 'error desconocido'}`);
      return;
    }

    const { error: fotosError } = await supabase.from('publicacion_fotos').insert(
      urls.map((url, orden) => ({
        publicacion_id: publicacionCreada.id,
        imagen_url: url,
        orden,
      }))
    );

    setPublicando(false);

    if (fotosError) {
      setError(`No pudimos guardar las fotos: ${fotosError.message}`);
      return;
    }

    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <Text style={styles.label}>
            Fotos del trabajo ({fotos.length}/{MAX_FOTOS_POR_PUBLICACION})
          </Text>

          <View style={styles.fotosRow}>
            {fotos.map((foto, indice) => (
              <View key={foto.uri} style={styles.fotoBox}>
                <Image source={{ uri: foto.uri }} style={styles.foto} resizeMode="cover" />
                <Pressable
                  style={styles.quitarFotoBadge}
                  onPress={() => quitarFoto(indice)}
                  disabled={publicando}
                  hitSlop={6}
                >
                  <Text style={styles.quitarFotoBadgeTexto}>✕</Text>
                </Pressable>
              </View>
            ))}

            {fotos.length < MAX_FOTOS_POR_PUBLICACION && (
              <Pressable
                style={[styles.fotoBox, styles.agregarFotoBox]}
                onPress={agregarFotos}
                disabled={publicando}
              >
                <Text style={styles.agregarFotoTexto}>+ Agregar</Text>
              </Pressable>
            )}
          </View>

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
  fotosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fotoBox: {
    width: 76,
    height: 76,
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
  quitarFotoBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quitarFotoBadgeTexto: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  agregarFotoBox: {
    borderStyle: 'dashed',
  },
  agregarFotoTexto: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
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
