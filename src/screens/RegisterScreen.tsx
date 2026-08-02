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
import { RUBROS, type RubroId } from '../constants/rubros';
import { colors } from '../constants/theme';
import { supabase } from '../lib/supabase';
import type { AuthStackParamList } from '../navigation/types';
import type { TipoUsuario } from '../types/database';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const [tipoUsuario, setTipoUsuario] = useState<TipoUsuario>('trabajador');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telefono, setTelefono] = useState('');
  const [rubro, setRubro] = useState<RubroId | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmarEmail, setConfirmarEmail] = useState(false);

  const handleRegister = async () => {
    setError(null);

    if (!nombre.trim() || !email.trim() || !password) {
      setError('Completá nombre, email y contraseña.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (tipoUsuario === 'trabajador' && !rubro) {
      setError('Elegí tu rubro principal.');
      return;
    }

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });

    if (signUpError) {
      setLoading(false);
      setError(traducirError(signUpError.message));
      return;
    }

    const userId = data.user?.id;

    if (userId && data.session) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        tipo_usuario: tipoUsuario,
        nombre: nombre.trim(),
        telefono: telefono.trim() || null,
        rubro: tipoUsuario === 'trabajador' ? rubro : null,
      });

      setLoading(false);

      if (profileError) {
        setError(`Cuenta creada, pero no pudimos guardar tu perfil: ${profileError.message}`);
        return;
      }
      return;
    }

    setLoading(false);
    setConfirmarEmail(true);
  };

  if (confirmarEmail) {
    return (
      <View style={styles.confirmContainer}>
        <Text style={styles.title}>Confirmá tu email</Text>
        <Text style={styles.subtitle}>
          Te enviamos un link de confirmación a {email}. Una vez confirmado, iniciá sesión para
          terminar de armar tu perfil.
        </Text>
        <Pressable style={styles.button} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.buttonText}>Ir a iniciar sesión</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Creá tu cuenta</Text>
        <Text style={styles.subtitle}>Elegí cómo vas a usar TuChanga</Text>

        <View style={styles.toggleRow}>
          <Pressable
            style={[styles.toggleButton, tipoUsuario === 'trabajador' && styles.toggleButtonActive]}
            onPress={() => setTipoUsuario('trabajador')}
          >
            <Text
              style={[styles.toggleText, tipoUsuario === 'trabajador' && styles.toggleTextActive]}
            >
              Soy trabajador
            </Text>
          </Pressable>
          <Pressable
            style={[styles.toggleButton, tipoUsuario === 'cliente' && styles.toggleButtonActive]}
            onPress={() => setTipoUsuario('cliente')}
          >
            <Text style={[styles.toggleText, tipoUsuario === 'cliente' && styles.toggleTextActive]}>
              Busco contratar
            </Text>
          </Pressable>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Nombre completo</Text>
          <TextInput
            style={styles.input}
            placeholder="Juan Pérez"
            placeholderTextColor={colors.textMuted}
            value={nombre}
            onChangeText={setNombre}
            editable={!loading}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="tu@email.com"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />

          <Text style={styles.label}>Teléfono (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="09X XXX XXX"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            value={telefono}
            onChangeText={setTelefono}
            editable={!loading}
          />

          {tipoUsuario === 'trabajador' && (
            <>
              <Text style={styles.label}>Rubro principal</Text>
              <View style={styles.rubroWrap}>
                {RUBROS.map((r) => (
                  <Pressable
                    key={r.id}
                    style={[styles.chip, rubro === r.id && styles.chipActive]}
                    onPress={() => setRubro(r.id)}
                  >
                    <Text style={[styles.chipText, rubro === r.id && styles.chipTextActive]}>
                      {r.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Crear cuenta</Text>
            )}
          </Pressable>

          <Pressable
            style={styles.linkContainer}
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
          >
            <Text style={styles.linkText}>
              ¿Ya tenés cuenta? <Text style={styles.linkTextBold}>Iniciá sesión</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function traducirError(message: string): string {
  if (message.toLowerCase().includes('already registered')) {
    return 'Ya existe una cuenta con ese email.';
  }
  return message;
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 48,
  },
  confirmContainer: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    justifyContent: 'center',
    gap: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  toggleTextActive: {
    color: '#fff',
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
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
  rubroWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: colors.text,
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
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
  linkContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  linkTextBold: {
    color: colors.primary,
    fontWeight: '600',
  },
});
