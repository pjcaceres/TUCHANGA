import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';

interface Props {
  esTrabajador: boolean;
  onPremium: () => void;
  onMisChats: () => void;
  onConfiguracion: () => void;
}

export default function HeaderMenu({ esTrabajador, onPremium, onMisChats, onConfiguracion }: Props) {
  const [visible, setVisible] = useState(false);

  const elegir = (accion: () => void) => {
    setVisible(false);
    accion();
  };

  return (
    <>
      <Pressable style={styles.boton} onPress={() => setVisible(true)} hitSlop={10}>
        <Text style={styles.icono}>⋮</Text>
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <Pressable style={styles.menu} onPress={(e) => e.stopPropagation()}>
            {esTrabajador && (
              <Pressable style={styles.item} onPress={() => elegir(onPremium)}>
                <Text style={styles.itemText}>⭐ Premium</Text>
              </Pressable>
            )}
            <Pressable style={styles.item} onPress={() => elegir(onMisChats)}>
              <Text style={styles.itemText}>💬 Mis chats</Text>
            </Pressable>
            <Pressable style={[styles.item, styles.itemUltimo]} onPress={() => elegir(onConfiguracion)}>
              <Text style={styles.itemText}>⚙️ Configuración</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  boton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icono: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  backdrop: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    top: 90,
    right: 20,
    minWidth: 180,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemUltimo: {
    borderBottomWidth: 0,
  },
  itemText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
});
