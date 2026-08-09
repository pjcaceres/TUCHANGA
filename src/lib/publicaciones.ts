import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { extensionDeMimeType, type FotoElegida } from './avatar';
import { supabase } from './supabase';
import type { PublicacionFoto } from '../types/database';

export const MAX_FOTOS_POR_PUBLICACION = 6;

/**
 * Abre el selector de fotos del dispositivo (o el file picker en web,
 * habilitado para elegir varias a la vez) y devuelve hasta `maxFotos`
 * imágenes elegidas, o un array vacío si el usuario canceló o no dio
 * permiso. En web, `selectionLimit` no lo aplica el navegador (el picker
 * nativo del sistema no tiene tope), así que igual recortamos el resultado
 * acá para respetar el límite en todas las plataformas.
 */
export async function elegirFotosDeTrabajo(maxFotos: number): Promise<FotoElegida[]> {
  if (Platform.OS !== 'web') {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) return [];
  }

  const resultado = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    allowsMultipleSelection: true,
    selectionLimit: maxFotos,
    quality: 0.7,
  });

  if (resultado.canceled) return [];

  return resultado.assets.slice(0, maxFotos).map((asset) => ({
    uri: asset.uri,
    mimeType: asset.mimeType ?? 'image/jpeg',
  }));
}

/**
 * Sube una foto de trabajo al bucket "publicaciones-fotos", en la carpeta
 * del propio trabajador (requisito de las políticas RLS de storage.objects).
 * El nombre incluye un componente al azar, no solo `Date.now()`, porque al
 * subir varias fotos de una misma publicación en un loop rápido dos podrían
 * caer en el mismo milisegundo y pisarse. Devuelve la URL pública para
 * guardar en publicacion_fotos.imagen_url.
 */
export async function subirFotoDeTrabajo(
  trabajadorId: string,
  foto: FotoElegida
): Promise<{ url: string | null; error: string | null }> {
  try {
    const extension = extensionDeMimeType(foto.mimeType);
    const sufijo = Math.random().toString(36).slice(2, 8);
    const path = `${trabajadorId}/trabajo-${Date.now()}-${sufijo}.${extension}`;
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
 * Sube varias fotos de trabajo en orden, una por una (no en paralelo, para
 * no saturar la conexión ni perder el orden al insertarlas después). Si
 * alguna falla, corta ahí y devuelve las URLs subidas hasta ese punto junto
 * con el error, para que quien llama decida si limpiar lo ya subido.
 */
export async function subirFotosDeTrabajo(
  trabajadorId: string,
  fotos: FotoElegida[]
): Promise<{ urls: string[]; error: string | null }> {
  const urls: string[] = [];

  for (const foto of fotos) {
    const { url, error } = await subirFotoDeTrabajo(trabajadorId, foto);
    if (error || !url) {
      return { urls, error: error ?? 'No pudimos subir una de las fotos.' };
    }
    urls.push(url);
  }

  return { urls, error: null };
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

/**
 * Trae, para un conjunto de publicaciones, todas sus fotos ordenadas —
 * agrupadas en un Map para que cada pantalla arme su propia lista de
 * `PublicacionCard`/`PublicacionesGrid` sin repetir esta consulta.
 */
export async function obtenerFotosDePublicaciones(
  publicacionIds: string[]
): Promise<Map<string, PublicacionFoto[]>> {
  const mapa = new Map<string, PublicacionFoto[]>();
  if (publicacionIds.length === 0) return mapa;

  const { data } = await supabase
    .from('publicacion_fotos')
    .select('*')
    .in('publicacion_id', publicacionIds)
    .order('orden', { ascending: true });

  for (const foto of data ?? []) {
    const lista = mapa.get(foto.publicacion_id) ?? [];
    lista.push(foto);
    mapa.set(foto.publicacion_id, lista);
  }

  return mapa;
}
