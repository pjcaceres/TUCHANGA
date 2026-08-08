import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
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
import AvatarPicker from '../components/AvatarPicker';
import { colors } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { subirFotoDePerfil, type FotoElegida } from '../lib/avatar';
import { supabase } from '../lib/supabase';
import type { AppStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'EditarPerfilCliente'>;

export default function EditarPerfilClienteScreen({ navigation }: Props) {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [cargando, setCargando] = useState(true);
  const [cargaError, setCargaError] = useState<string | null>(null);

  const [nombre, setNombre] = useState('');
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [fotoError, setFotoError] = useState<string | null>(null);

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      if (!userId) return;
      setCargando(true);
      setCargaError(null);

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (cancelado) return;

      if (fetchError || !data) {
        setCargaError(fetchError?.message ?? 'No pudimos cargar tu perfil.');
      } else {
        setNombre(data.nombre);
        setFotoUrl(data.foto_url);
      }
      setCargando(false);
    }

    cargar();

    return () => {
      cancelado = true;
    };
  }, [userId]);

  const manejarFotoElegida = async (foto: FotoElegida) => {
    if (!userId) return;

    setFotoError(null);
    setSubiendoFoto(true);

    const { url, error: uploadError } = await subirFotoDePerfil(userId, foto);

    setSubiendoFoto(false);

    if (uploadError || !url) {
      setFotoError(uploadError ?? 'No pudimos subir la foto. Probá de nuevo.');
      return;
    }

    setFotoUrl(url);
  };

  const handleGuardar = async () => {
    setError(null);

    if (!userId) return;

    if (!nombre.trim()) {
      setError('Completá tu nombre.');
      return;
    }

    setGuardando(true);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ nombre: nombre.trim(), foto_url: fotoUrl })
      .eq('id', userId);

    setGuardando(false);

    if (updateError) {
      setError(`No pudimos guardar los cambios: ${updateError.message}`);
      return;
    }

    navigation.goBack();
  };

  if (cargando) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (cargaError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{cargaError}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <Text style={styles.sectionHeader}>Tus datos</Text>

          <View style={styles.avatarRow}>
            <AvatarPicker
              fotoUrl={fotoUrl}
              nombre={nombre || '?'}
              subiendo={subiendoFoto}
              onElegir={manejarFotoElegida}
            />
          </View>
          {fotoError ? <Text style={styles.errorText}>{fotoError}</Text> : null}

          <Text style={styles.label}>Nombre completo</Text>
          <TextInput
            style={styles.input}
            placeholder="Juan Pérez"
            placeholderTextColor={colors.textMuted}
            value={nombre}
            onChangeText={setNombre}
            editable={!guardando}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={handleGuardar}
            disabled={guardando}
          >
            {guardando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Guardar cambios</Text>
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  avatarRow: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginTop: 14,
    marginBottom: 6,
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
