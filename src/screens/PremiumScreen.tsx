import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { esPremiumVigente, proximoVencimientoPremium } from '../lib/premium';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';

export default function PremiumScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [perfil, setPerfil] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activando, setActivando] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      if (!userId) return;
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (cancelado) return;

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setPerfil(data);
      }
      setLoading(false);
    }

    cargar();

    return () => {
      cancelado = true;
    };
  }, [userId]);

  const activarPremium = async () => {
    if (!userId) return;

    setActivando(true);
    setError(null);

    const premiumHasta = proximoVencimientoPremium();

    const { data, error: updateError } = await supabase
      .from('profiles')
      .update({ es_premium: true, premium_hasta: premiumHasta })
      .eq('id', userId)
      .select()
      .single();

    setActivando(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setPerfil(data);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error || !perfil) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'No pudimos cargar tu perfil.'}</Text>
      </View>
    );
  }

  if (perfil.tipo_usuario !== 'trabajador') {
    return (
      <View style={styles.centered}>
        <Text style={styles.infoText}>
          Premium es para perfiles de trabajador. Registrate como trabajador para poder activarlo.
        </Text>
      </View>
    );
  }

  const vigente = esPremiumVigente(perfil);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.statusCard}>
        {vigente ? (
          <>
            <Text style={styles.statusBadge}>⭐ Destacado activo</Text>
            <Text style={styles.statusText}>
              Tu perfil aparece primero en los resultados hasta el{' '}
              {formatearFecha(perfil.premium_hasta)}.
            </Text>
          </>
        ) : (
          <Text style={styles.statusText}>Todavía no sos Premium.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>¿Qué gana un perfil Premium?</Text>
        <View style={styles.beneficio}>
          <Text style={styles.beneficioIcono}>📈</Text>
          <Text style={styles.beneficioTexto}>
            Mayor visibilidad: aparecés primero en los resultados de tu departamento y rubro,
            antes que los perfiles gratuitos.
          </Text>
        </View>
        <View style={styles.beneficio}>
          <Text style={styles.beneficioIcono}>⭐</Text>
          <Text style={styles.beneficioTexto}>
            Insignia "Destacado" visible en tu tarjeta y en tu perfil, para que los clientes te
            identifiquen fácilmente.
          </Text>
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable
        style={[styles.button, activando && styles.buttonDisabled]}
        onPress={activarPremium}
        disabled={activando}
      >
        {activando ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {vigente ? 'Renovar 30 días más' : 'Hacerme Premium por 30 días'}
          </Text>
        )}
      </Pressable>

      <Text style={styles.disclaimer}>
        Versión de prueba: por ahora se activa sin costo. Pronto vas a poder pagar con Mercado
        Pago u otro medio.
      </Text>
    </ScrollView>
  );
}

function formatearFecha(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-UY', { day: 'numeric', month: 'short', year: 'numeric' });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
  },
  infoText: {
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 15,
  },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 6,
  },
  statusBadge: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8A5A00',
  },
  statusText: {
    fontSize: 14,
    color: colors.text,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  beneficio: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  beneficioIcono: {
    fontSize: 18,
  },
  beneficioTexto: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
