import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { extensionDeMimeType, type FotoElegida } from './avatar';
import { supabase } from './supabase';

/**
 * Abre el selector de fotos del dispositivo (o el file picker en web) y
 * devuelve la foto de un trabajo elegida, o null si el usuario canceló o no
 * dio permiso.
 */
export async function elegirFotoDeTrabajo(): Promise<FotoElegida | null> {
  if (Platform.OS !== 'web') {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) return null;
  }

  const resultado = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    allowsEditing: true,
    quality: 0.7,
  });

  if (resultado.canceled || !resultado.assets[0]) return null;

  const asset = resultado.assets[0];
  return { uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg' };
}

/**
 * Sube la foto elegida al bucket "publicaciones-fotos", en la carpeta del
 * propio trabajador (requisito de las políticas RLS de storage.objects).
 * Devuelve la URL pública para guardar en publicaciones.imagen_url.
 */
export async function subirFotoDeTrabajo(
  trabajadorId: string,
  foto: FotoElegida
): Promise<{ url: string | null; error: string | null }> {
  try {
    const extension = extensionDeMimeType(foto.mimeType);
    const path = `${trabajadorId}/trabajo-${Date.now()}.${extension}`;
    const archivo = await fetch(foto.uri).then((res) => res.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('publicaciones-fotos')
      .upload(path, archivo, { contentType: foto.mimeType });

    if (uploadError) {
      return { url: null, error: uploadError.message };
    }

    const { data } = supabase.storage.from('publicaciones-fotos').getPublicUrl(path);
    return { url: data.publicUrl, error: null };
  } catch (error) {
    return { url: null, error: error instanceof Error ? error.message : 'No pudimos subir la foto.' };
  }
}

/**
 * Borra una publicación propia. Si la política RLS de borrado no está
 * aplicada (o la publicación no es del usuario), Postgres/PostgREST no
 * devuelve ningún error: simplemente no borra ninguna fila. Por eso
 * pedimos `.select('id')` de lo borrado y tratamos "cero filas" como un
 * error visible, en vez de asumir éxito solo porque no hubo excepción.
 */
export async function eliminarPublicacion(
  publicacionId: string
): Promise<{ error: string | null }> {
  const { data, error } = await supabase
    .from('publicaciones')
    .delete()
    .eq('id', publicacionId)
    .select('id');

  if (error) {
    return { error: error.message };
  }

  if (!data || data.length === 0) {
    return {
      error: 'No pudimos borrar la publicación: no tenés permiso o ya fue borrada. Probá de nuevo.',
    };
  }

  return { error: null };
}
