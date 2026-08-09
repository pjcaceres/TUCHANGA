import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';

interface Props {
  visible: boolean;
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  destructivo?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export default function ConfirmDialog({
  visible,
  titulo,
  mensaje,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  destructivo,
  onConfirmar,
  onCancelar,
}: Props) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancelar}>
      <Pressable style={styles.backdrop} onPress={onCancelar}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.titulo}>{titulo}</Text>
          <Text style={styles.mensaje}>{mensaje}</Text>
          <View style={styles.botones}>
            <Pressable style={styles.botonCancelar} onPress={onCancelar}>
              <Text style={styles.textoCancelar}>{textoCancelar}</Text>
            </Pressable>
            <Pressable
              style={[styles.botonConfirmar, destructivo && styles.botonConfirmarDestructivo]}
              onPress={onConfirmar}
            >
              <Text style={styles.textoConfirmar}>{textoConfirmar}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  titulo: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  mensaje: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 19,
  },
  botones: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  botonCancelar: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  textoCancelar: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  botonConfirmar: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  botonConfirmarDestructivo: {
    backgroundColor: colors.error,
  },
  textoConfirmar: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
