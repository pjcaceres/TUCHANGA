import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DepartamentoSelector from '../components/DepartamentoSelector';
import WorkerCard from '../components/WorkerCard';
import {
  DEPARTAMENTO_POR_DEFECTO,
  departamentoMasCercano,
  type Departamento,
} from '../constants/departamentos';
import { RUBROS, type RubroId } from '../constants/rubros';
import { colors } from '../constants/theme';
import { distanciaKm } from '../lib/geo';
import { supabase } from '../lib/supabase';
import type { AppStackParamList } from '../navigation/types';
import type { Profile } from '../types/database';

type Props = NativeStackScreenProps<AppStackParamList, 'WorkersList'>;

interface Coords {
  lat: number;
  lng: number;
}

export default function WorkersListScreen({ navigation }: Props) {
  const [departamento, setDepartamento] = useState<Departamento>(DEPARTAMENTO_POR_DEFECTO);
  const [rubroFiltro, setRubroFiltro] = useState<RubroId | null>(null);
  const [userCoords, setUserCoords] = useState<Coords | null>(null);
  const [detectando, setDetectando] = useState(false);
  const [ubicacionError, setUbicacionError] = useState<string | null>(null);

  const [trabajadores, setTrabajadores] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const detectarUbicacion = useCallback(async (aplicarDepartamento: boolean) => {
    setDetectando(true);
    setUbicacionError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setUbicacionError('No nos diste permiso de ubicación. Elegí tu departamento manualmente.');
        return;
      }

      const posicion = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords = { lat: posicion.coords.latitude, lng: posicion.coords.longitude };
      setUserCoords(coords);

      if (aplicarDepartamento) {
        setDepartamento(departamentoMasCercano(coords.lat, coords.lng));
      }
    } catch {
      setUbicacionError('No pudimos obtener tu ubicación. Elegí tu departamento manualmente.');
    } finally {
      setDetectando(false);
    }
  }, []);

  useEffect(() => {
    detectarUbicacion(true);
  }, [detectarUbicacion]);

  useEffect(() => {
    let cancelado = false;

    async function cargarTrabajadores() {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('profiles')
        .select('*')
        .eq('tipo_usuario', 'trabajador')
        .eq('departamento', departamento);

      if (rubroFiltro) {
        query = query.eq('rubro', rubroFiltro);
      }

      const { data, error: fetchError } = await query;

      if (cancelado) return;

      if (fetchError) {
        setError(fetchError.message);
        setTrabajadores([]);
      } else {
        setTrabajadores(data ?? []);
      }
      setLoading(false);
    }

    cargarTrabajadores();

    return () => {
      cancelado = true;
    };
  }, [departamento, rubroFiltro]);

  const trabajadoresOrdenados = useMemo(() => {
    const conDistancia = trabajadores.map((trabajador) => ({
      trabajador,
      distancia:
        userCoords && trabajador.lat !== null && trabajador.lng !== null
          ? distanciaKm(userCoords.lat, userCoords.lng, trabajador.lat, trabajador.lng)
          : null,
    }));

    conDistancia.sort((a, b) => {
      if (a.distancia !== null && b.distancia !== null) return a.distancia - b.distancia;
      if (a.distancia !== null) return -1;
      if (b.distancia !== null) return 1;
      return (b.trabajador.calificacion_promedio ?? 0) - (a.trabajador.calificacion_promedio ?? 0);
    });

    return conDistancia;
  }, [trabajadores, userCoords]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>TuChanga</Text>
        <Pressable onPress={() => supabase.auth.signOut()}>
          <Text style={styles.logout}>Salir</Text>
        </Pressable>
      </View>

      <View style={styles.filtersSection}>
        <DepartamentoSelector
          departamento={departamento}
          onSeleccionar={setDepartamento}
          onUsarUbicacion={() => detectarUbicacion(true)}
          detectando={detectando}
        />
        {ubicacionError && <Text style={styles.ubicacionError}>{ubicacionError}</Text>}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rubroRow}
        >
          <Pressable
            style={[styles.chip, rubroFiltro === null && styles.chipActive]}
            onPress={() => setRubroFiltro(null)}
          >
            <Text style={[styles.chipText, rubroFiltro === null && styles.chipTextActive]}>
              Todos
            </Text>
          </Pressable>
          {RUBROS.filter((r) => r.id !== 'otro').map((r) => (
            <Pressable
              key={r.id}
              style={[styles.chip, rubroFiltro === r.id && styles.chipActive]}
              onPress={() => setRubroFiltro(r.id)}
            >
              <Text style={[styles.chipText, rubroFiltro === r.id && styles.chipTextActive]}>
                {r.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : trabajadoresOrdenados.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>
            No encontramos trabajadores en {departamento}
            {rubroFiltro ? ' para ese rubro' : ''}. Probá con otro departamento o rubro.
          </Text>
        </View>
      ) : (
        <FlatList
          data={trabajadoresOrdenados}
          keyExtractor={(item) => item.trabajador.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <WorkerCard
              trabajador={item.trabajador}
              distanciaKm={item.distancia}
              onPress={() =>
                navigation.navigate('WorkerProfile', {
                  workerId: item.trabajador.id,
                  nombre: item.trabajador.nombre,
                })
              }
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
  },
  logout: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  filtersSection: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 10,
  },
  ubicacionError: {
    fontSize: 12,
    color: colors.error,
  },
  rubroRow: {
    gap: 8,
    paddingRight: 20,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
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
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  separator: {
    height: 10,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 14,
  },
});
