import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';
import { useMiPerfil } from '../contexts/ProfileContext';
import { supabase } from '../lib/supabase';
import type { AppStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'Configuracion'>;

export default function ConfiguracionScreen({ navigation }: Props) {
  const { perfil } = useMiPerfil();

  return (
    <View style={styles.container}>
      {perfil && (
        <Pressable
          style={styles.item}
          onPress={() =>
            navigation.navigate(
              perfil.tipo_usuario === 'trabajador' ? 'EditarPerfil' : 'EditarPerfilCliente'
            )
          }
        >
          <Text style={styles.itemText}>Editar perfil</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      )}
      <Pressable style={styles.item} onPress={() => navigation.navigate('Terminos')}>
        <Text style={styles.itemText}>Términos y Condiciones</Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
      <Pressable style={styles.item} onPress={() => navigation.navigate('Privacidad')}>
        <Text style={styles.itemText}>Política de Privacidad</Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
      <Pressable style={styles.item} onPress={() => supabase.auth.signOut()}>
        <Text style={styles.itemTextSalir}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
    gap: 12,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  itemText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  itemTextSalir: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.error,
  },
  chevron: {
    fontSize: 20,
    color: colors.textMuted,
  },
});
