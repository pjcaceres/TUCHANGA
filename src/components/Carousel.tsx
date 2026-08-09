import { useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '../constants/theme';

interface Props {
  urls: string[];
  aspectRatio?: number;
}

const ANCHO_INICIAL_ESTIMADO = Dimensions.get('window').width - 40;

export default function Carousel({ urls, aspectRatio = 4 / 5 }: Props) {
  const [indice, setIndice] = useState(0);
  const [ancho, setAncho] = useState(ANCHO_INICIAL_ESTIMADO);
  const scrollRef = useRef<ScrollView>(null);

  const hayVarias = urls.length > 1;

  const manejarScroll = (evento: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (ancho === 0) return;
    const nuevoIndice = Math.round(evento.nativeEvent.contentOffset.x / ancho);
    setIndice(nuevoIndice);
  };

  const irA = (nuevoIndice: number) => {
    if (nuevoIndice < 0 || nuevoIndice >= urls.length) return;
    setIndice(nuevoIndice);
    scrollRef.current?.scrollTo({ x: nuevoIndice * ancho, animated: true });
  };

  return (
    <View onLayout={(evento) => setAncho(evento.nativeEvent.layout.width)}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={manejarScroll}
        scrollEventThrottle={16}
      >
        {urls.map((url, i) => (
          <Image
            key={i}
            source={{ uri: url }}
            style={[styles.imagen, { width: ancho, aspectRatio }]}
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
    </View>
  );
}

const styles = StyleSheet.create({
  imagen: {
    backgroundColor: colors.background,
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
