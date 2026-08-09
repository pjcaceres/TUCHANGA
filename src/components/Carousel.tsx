import { useRef, useState } from 'react';
import {
  Image,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors } from '../constants/theme';

interface Props {
  urls: string[];
  aspectRatio?: number;
  style?: StyleProp<ViewStyle>;
}

export default function Carousel({ urls, aspectRatio = 4 / 5, style }: Props) {
  const [indice, setIndice] = useState(0);
  const [ancho, setAncho] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const desplazandoRef = useRef(false);

  const hayVarias = urls.length > 1;

  const manejarScroll = (evento: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (ancho === 0 || desplazandoRef.current) return;
    const nuevoIndice = Math.round(evento.nativeEvent.contentOffset.x / ancho);
    setIndice(nuevoIndice);
  };

  const manejarFinDeDesplazamiento = () => {
    desplazandoRef.current = false;
  };

  const irA = (nuevoIndice: number) => {
    if (nuevoIndice < 0 || nuevoIndice >= urls.length || ancho === 0) return;
    desplazandoRef.current = true;
    setIndice(nuevoIndice);
    scrollRef.current?.scrollTo({ x: nuevoIndice * ancho, animated: true });
  };

  return (
    <View
      style={[styles.contenedor, { aspectRatio }, style]}
      onLayout={(evento) => setAncho(evento.nativeEvent.layout.width)}
    >
      {ancho > 0 && (
        <>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={manejarScroll}
            onMomentumScrollEnd={manejarFinDeDesplazamiento}
            scrollEventThrottle={16}
            style={styles.scroll}
          >
            {urls.map((url, i) => (
              <Image
                key={i}
                source={{ uri: url }}
                style={[styles.imagen, { width: ancho }]}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {hayVarias && (
            <>
              <View style={styles.contador}>
                <Text style={styles.contadorTexto}>
                  {indice + 1}/{urls.length}
                </Text>
              </View>

              {indice > 0 && (
                <Pressable
                  style={[styles.flecha, styles.flechaIzquierda]}
                  onPress={() => irA(indice - 1)}
                  hitSlop={8}
                >
                  <Text style={styles.flechaTexto}>‹</Text>
                </Pressable>
              )}

              {indice < urls.length - 1 && (
                <Pressable
                  style={[styles.flecha, styles.flechaDerecha]}
                  onPress={() => irA(indice + 1)}
                  hitSlop={8}
                >
                  <Text style={styles.flechaTexto}>›</Text>
                </Pressable>
              )}
            </>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    width: '100%',
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
  },
  imagen: {
    height: '100%',
  },
  contador: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  contadorTexto: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  flecha: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flechaIzquierda: {
    left: 0,
  },
  flechaDerecha: {
    right: 0,
  },
  flechaTexto: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
