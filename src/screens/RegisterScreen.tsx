import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FunctionsHttpError } from '@supabase/supabase-js';
import * as Location from 'expo-location';
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
import DepartamentoSelector from '../components/DepartamentoSelector';
import {
  DEPARTAMENTO_POR_DEFECTO,
  departamentoMasCercano,
  type Departamento,
} from '../constants/departamentos';
import { RUBROS, type RubroId } from '../constants/rubros';
import { colors } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { esTelefonoValido, parsePrecio } from '../lib/validacion';
import type { AuthStackParamList } from '../navigation/types';
import type { TipoUsuario } from '../types/database';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

type ModoPerfil = 'manual' | 'ia';

const TEXTO_LIBRE_MIN = 10;
const TEXTO_LIBRE_MAX = 2000;

export default function RegisterScreen({ navigation }: Props) {
  const [tipoUsuario, setTipoUsuario] = useState<TipoUsuario>('trabajador');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telefono, setTelefono] = useState('');
  const [rubro, setRubro] = useState<RubroId | null>(null);
  const [precioOrientativo, setPrecioOrientativo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmarEmail, setConfirmarEmail] = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  const [modoPerfil, setModoPerfil] = useState<ModoPerfil>('manual');
  const [textoLibre, setTextoLibre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [departamento, setDepartamento] = useState<Departamento | null>(null);
  const [generandoIA, setGenerandoIA] = useState(false);
  const [iaError, setIaError] = useState<string | null>(null);
  const [iaGenerado, setIaGenerado] = useState(false);
  const [detectandoUbicacion, setDetectandoUbicacion] = useState(false);

  const detectarUbicacion = async () => {
    setDetectandoUbicacion(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const posicion = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setDepartamento(
        departamentoMasCercano(posicion.coords.latitude, posicion.coords.longitude)
      );
    } catch {
      // si falla, el usuario puede elegir el departamento manualmente
    } finally {
      setDetectandoUbicacion(false);
    }
  };

  const generarConIA = async () => {
    setIaError(null);

    const texto = textoLibre.trim();
    if (texto.length < TEXTO_LIBRE_MIN) {
      setIaError(`Contanos un poco más sobre tu trabajo (mínimo ${TEXTO_LIBRE_MIN} caracteres).`);
      return;
    }

    setGenerandoIA(true);

    const { data, error: fnError } = await supabase.functions.invoke<{
      rubro: RubroId;
      descripcion: string;
      departamento: Departamento | null;
    }>('generar-perfil', {
      body: { texto },
    });

    setGenerandoIA(false);

    if (fnError) {
      setIaError(await traducirErrorFuncion(fnError));
      return;
    }

    if (data) {
      setRubro(data.rubro);
      setDescripcion(data.descripcion);
      if (data.departamento) {
        setDepartamento(data.departamento);
      }
      setIaGenerado(true);
    }
  };

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
    if (telefono.trim() && !esTelefonoValido(telefono)) {
      setError('El teléfono no parece válido. Usá un formato como 099 123 456 o 2487 1234.');
      return;
    }
    if (!aceptaTerminos) {
      setError('Tenés que aceptar los Términos y Condiciones y la Política de Privacidad.');
      return;
    }

    let precio: number | null = null;
    if (tipoUsuario === 'trabajador') {
      if (!rubro) {
        setError('Elegí tu rubro principal.');
        return;
      }
      if (!departamento) {
        setError('Elegí el departamento donde trabajás.');
        return;
      }
      if (precioOrientativo.trim()) {
        precio = parsePrecio(precioOrientativo);
        if (precio === null || precio <= 0) {
          setError('El precio orientativo tiene que ser un número mayor a 0.');
          return;
        }
      }
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
        descripcion: tipoUsuario === 'trabajador' ? descripcion.trim() || null : null,
        departamento: tipoUsuario === 'trabajador' ? departamento : null,
        precio_orientativo: tipoUsuario === 'trabajador' ? precio : null,
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
          <Text style={styles.sectionHeader}>Datos de la cuenta</Text>

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
            placeholder="099 123 456"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            value={telefono}
            onChangeText={setTelefono}
            editable={!loading}
          />

          {tipoUsuario === 'trabajador' && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionHeader}>Tu perfil de trabajador</Text>

              <Text style={styles.label}>¿Cómo querés armar tu perfil?</Text>
              <View style={styles.toggleRow}>
                <Pressable
                  style={[styles.toggleButton, modoPerfil === 'manual' && styles.toggleButtonActive]}
                  onPress={() => setModoPerfil('manual')}
                >
                  <Text
                    style={[styles.toggleText, modoPerfil === 'manual' && styles.toggleTextActive]}
                  >
                    Completar a mano
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.toggleButton, modoPerfil === 'ia' && styles.toggleButtonActive]}
                  onPress={() => setModoPerfil('ia')}
                >
                  <Text style={[styles.toggleText, modoPerfil === 'ia' && styles.toggleTextActive]}>
                    Describir con IA
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.label}>Departamento</Text>
              <DepartamentoSelector
                departamento={departamento ?? DEPARTAMENTO_POR_DEFECTO}
                onSeleccionar={setDepartamento}
                onUsarUbicacion={detectarUbicacion}
                detectando={detectandoUbicacion}
              />

              <Text style={styles.label}>Precio orientativo por trabajo (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 800"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={precioOrientativo}
                onChangeText={setPrecioOrientativo}
                editable={!loading}
              />

              {modoPerfil === 'manual' ? (
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

                  <Text style={styles.label}>Descripción (opcional)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Contanos brevemente qué hacés y tu experiencia…"
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={4}
                    maxLength={600}
                    value={descripcion}
                    onChangeText={setDescripcion}
                    editable={!loading}
                  />
                </>
              ) : (
                <>
                  <Text style={styles.label}>Contanos qué hacés</Text>
                  <Text style={styles.helperText}>
                    Escribí (o dictá con el micrófono del teclado) una descripción libre: qué
                    hacés, tu experiencia y en qué zona trabajás. Por ejemplo: "Soy electricista,
                    hago instalaciones y arreglos, trabajo en Montevideo zona Pocitos y Malvín,
                    tengo 10 años de experiencia".
                  </Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Contanos sobre tu trabajo…"
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={4}
                    maxLength={TEXTO_LIBRE_MAX}
                    value={textoLibre}
                    onChangeText={setTextoLibre}
                    editable={!loading && !generandoIA}
                  />

                  {iaError ? <Text style={styles.errorText}>{iaError}</Text> : null}

                  <Pressable
                    style={[styles.aiButton, generandoIA && styles.aiButtonDisabled]}
                    onPress={generarConIA}
                    disabled={generandoIA || loading}
                  >
                    {generandoIA ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.aiButtonText}>✨ Generar perfil con IA</Text>
                    )}
                  </Pressable>

                  {iaGenerado && (
                    <View style={styles.revisionBox}>
                      <Text style={styles.revisionTitle}>Revisá y editá antes de confirmar</Text>

                      <Text style={styles.label}>Rubro</Text>
                      <View style={styles.rubroWrap}>
                        {RUBROS.map((r) => (
                          <Pressable
                            key={r.id}
                            style={[styles.chip, rubro === r.id && styles.chipActive]}
                            onPress={() => setRubro(r.id)}
                          >
                            <Text
                              style={[styles.chipText, rubro === r.id && styles.chipTextActive]}
                            >
                              {r.label}
                            </Text>
                          </Pressable>
                        ))}
                      </View>

                      <Text style={styles.label}>Descripción</Text>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        multiline
                        numberOfLines={4}
                        maxLength={600}
                        value={descripcion}
                        onChangeText={setDescripcion}
                        editable={!loading}
                      />
                    </View>
                  )}
                </>
              )}
            </>
          )}

          <View style={styles.checkboxRow}>
            <Pressable
              onPress={() => setAceptaTerminos((prev) => !prev)}
              style={[styles.checkbox, aceptaTerminos && styles.checkboxActivo]}
              hitSlop={8}
            >
              {aceptaTerminos && <Text style={styles.checkboxMarca}>✓</Text>}
            </Pressable>
            <Text style={styles.checkboxTexto}>
              Acepto los{' '}
              <Text style={styles.checkboxLink} onPress={() => navigation.navigate('Terminos')}>
                Términos y Condiciones
              </Text>{' '}
              y la{' '}
              <Text style={styles.checkboxLink} onPress={() => navigation.navigate('Privacidad')}>
                Política de Privacidad
              </Text>
            </Text>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              !aceptaTerminos && styles.buttonDisabled,
            ]}
            onPress={handleRegister}
            disabled={loading || !aceptaTerminos}
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

async function traducirErrorFuncion(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (typeof body?.error === 'string') {
        return body.error;
      }
    } catch {
      // el body no era JSON válido, seguimos con el mensaje genérico
    }
  }
  return 'No pudimos generar el perfil con IA. Probá de nuevo o completalo a mano.';
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
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: 20,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginTop: 14,
    marginBottom: 6,
  },
  helperText: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 10,
    lineHeight: 17,
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
    minHeight: 90,
    textAlignVertical: 'top',
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
  aiButton: {
    backgroundColor: colors.primaryDark,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  aiButtonDisabled: {
    opacity: 0.7,
  },
  aiButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  revisionBox: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  revisionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    marginTop: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 20,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxActivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxMarca: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxTexto: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 19,
  },
  checkboxLink: {
    color: colors.primary,
    fontWeight: '600',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonDisabled: {
    backgroundColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonPressed: {
    backgroundColor: colors.primaryDark,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
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
