import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { DEPARTAMENTOS, type Departamento } from '../constants/departamentos';
import { colors } from '../constants/theme';

interface Props {
  departamento: Departamento;
  onSeleccionar: (departamento: Departamento) => void;
  onUsarUbicacion: () => void;
  detectando: boolean;
}

export default function DepartamentoSelector({
  departamento,
  onSeleccionar,
  onUsarUbicacion,
  detectando,
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Pressable style={styles.pill} onPress={() => setVisible(true)}>
        <Text style={styles.pillText}>📍 {departamento}</Text>
        <Text style={styles.pillCaret}>▾</Text>
      </Pressable>

      <Modal visible={visible} animationType="slide" transparent onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Elegí tu departamento</Text>

            <Pressable
              style={styles.ubicacionButton}
              onPress={() => {
                setVisible(false);
                onUsarUbicacion();
              }}
              disabled={detectando}
            >
              <Text style={styles.ubicacionText}>
                {detectando ? 'Detectando ubicación…' : '📍 Usar mi ubicación actual'}
              </Text>
            </Pressable>

            <FlatList
              data={DEPARTAMENTOS}
              keyExtractor={(item) => item.nombre}
              style={styles.list}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.option}
                  onPress={() => {
                    onSeleccionar(item.nombre);
                    setVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      item.nombre === departamento && styles.optionTextActive,
                    ]}
                  >
                    {item.nombre}
                  </Text>
                  {item.nombre === departamento && <Text style={styles.checkmark}>✓</Text>}
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  pillCaret: {
    fontSize: 12,
    color: colors.textMuted,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '75%',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  ubicacionButton: {
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  ubicacionText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  list: {
    flexGrow: 0,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionText: {
    fontSize: 15,
    color: colors.text,
  },
  optionTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  checkmark: {
    color: colors.primary,
    fontWeight: '700',
  },
});
