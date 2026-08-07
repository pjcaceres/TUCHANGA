import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FunctionsHttpError } from '@supabase/supabase-js';
import * as Location from 'expo-location';
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
import DepartamentoSelector from '../components/DepartamentoSelector';
import {
  DEPARTAMENTO_POR_DEFECTO,
  departamentoMasCercano,
  type Departamento,
} from '../constants/departamentos';
import { RUBROS, type RubroId } from '../constants/rubros';
import { colors } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { esTelefonoValido } from '../lib/validacion';
import type { AppStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'EditarPerfil'>;

type ModoPerfil = 'manual' | 'ia';

const TEXTO_LIBRE_MIN = 10;
const TEXTO_LIBRE_MAX = 2000;

export default function EditarPerfilScreen({ navigation }: Props) {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [cargando, setCargando] = useState(true);
  const [cargaError, setCargaError] = useState<string | null>(null);

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [rubro, setRubro] = useState<RubroId | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [departamento, setDepartamento] = useState<Departamento | null>(null);

  const [modoPerfil, setModoPerfil] = useState<ModoPerfil>('manual');
  const [textoLibre, setTextoLibre] = useState('');
  const [generandoIA, setGenerandoIA] = useState(false);
  const [iaError, setIaError] = useState<string | null>(null);
  const [iaGenerado, setIaGenerado] = useState(false);
  const [detectandoUbicacion, setDetectandoUbicacion] = useState(false);

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      // si falla, el trabajador puede elegir el departamento manualmente
    } finally {
      setDetectandoUbicacion(false);
    }
  };

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
        setTelefono(data.telefono ?? '');
        setRubro(data.rubro);
        setDescripcion(data.descripcion ?? '');
        setDepartamento(data.departamento);
      }
      setCargando(false);
    }

    cargar();

    return () => {
      cancelado = true;
    };
  }, [userId]);

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

  const handleGuardar = async () => {
    setError(null);

    if (!userId) return;

    if (!nombre.trim()) {
      setError('Completá tu nombre.');
      return;
    }
    if (telefono.trim() && !esTelefonoValido(telefono)) {
      setError('El teléfono no parece válido. Usá un formato como 099 123 456 o 2487 1234.');
      return;
    }
    if (!rubro) {
      setError('Elegí tu rubro principal.');
      return;
    }
    if (!departamento) {
      setError('Elegí el departamento donde trabajás.');
      return;
    }

    setGuardando(true);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        nombre: nombre.trim(),
        telefono: telefono.trim() || null,
        rubro,
        descripcion: descripcion.trim() || null,
        departamento,
      })
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

          <Text style={styles.label}>Nombre completo</Text>
          <TextInput
            style={styles.input}
            placeholder="Juan Pérez"
            placeholderTextColor={colors.textMuted}
            value={nombre}
            onChangeText={setNombre}
            editable={!guardando}
          />

          <Text style={styles.label}>Teléfono (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="099 123 456"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            value={telefono}
            onChangeText={setTelefono}
            editable={!guardando}
          />

          <View style={styles.divider} />
          <Text style={styles.sectionHeader}>Tu perfil de trabajador</Text>

          <Text style={styles.label}>¿Cómo querés actualizar tu perfil?</Text>
          <View style={styles.toggleRow}>
            <Pressable
              style={[styles.toggleButton, modoPerfil === 'manual' && styles.toggleButtonActive]}
              onPress={() => setModoPerfil('manual')}
            >
              <Text style={[styles.toggleText, modoPerfil === 'manual' && styles.toggleTextActive]}>
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
                editable={!guardando}
              />
            </>
          ) : (
            <>
              <Text style={styles.label}>Contanos qué hacés</Text>
              <Text style={styles.helperText}>
                Escribí una descripción libre: qué hacés, tu experiencia y en qué zona trabajás.
                Por ejemplo: "Soy electricista, hago instalaciones y arreglos, trabajo en
                Montevideo zona Pocitos y Malvín, tengo 10 años de experiencia".
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
                editable={!guardando && !generandoIA}
              />

              {iaError ? <Text style={styles.errorText}>{iaError}</Text> : null}

              <Pressable
                style={[styles.aiButton, generandoIA && styles.aiButtonDisabled]}
                onPress={generarConIA}
                disabled={generandoIA || guardando}
              >
                {generandoIA ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.aiButtonText}>✨ Generar perfil con IA</Text>
                )}
              </Pressable>

              {iaGenerado && (
                <View style={styles.revisionBox}>
                  <Text style={styles.revisionTitle}>Revisá y editá antes de guardar</Text>

                  <Text style={styles.label}>Rubro</Text>
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

                  <Text style={styles.label}>Descripción</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    multiline
                    numberOfLines={4}
                    maxLength={600}
                    value={descripcion}
                    onChangeText={setDescripcion}
                    editable={!guardando}
                  />
                </View>
              )}
            </>
          )}

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
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
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
