import { useState } from 'react';
import {
  Dimensions,
  Image,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
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

  const manejarScroll = (evento: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (ancho === 0) return;
    const nuevoIndice = Math.round(evento.nativeEvent.contentOffset.x / ancho);
    setIndice(nuevoIndice);
  };

  return (
    <View onLayout={(evento) => setAncho(evento.nativeEvent.layout.width)}>
      <ScrollView
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

      {urls.length > 1 && (
        <View style={styles.puntos}>
          {urls.map((_, i) => (
            <View key={i} style={[styles.punto, i === indice && styles.puntoActivo]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  imagen: {
    backgroundColor: colors.background,
  },
  puntos: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  punto: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  puntoActivo: {
    backgroundColor: '#fff',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
