import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { supabase } from './supabase';

export type FotoElegida = {
  uri: string;
  mimeType: string;
};

/**
 * Abre el selector de fotos del dispositivo (o el file picker en web) y
 * devuelve la imagen elegida, o null si el usuario canceló o no dio permiso.
 */
export async function elegirFotoDePerfil(): Promise<FotoElegida | null> {
  if (Platform.OS !== 'web') {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) return null;
  }

  const resultado = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (resultado.canceled || !resultado.assets[0]) return null;

  const asset = resultado.assets[0];
  return { uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg' };
}

function extensionDeMimeType(mimeType: string): string {
  if (mimeType.includes('png')) return 'png';
  if (mimeType.includes('webp')) return 'webp';
  return 'jpg';
}

/**
 * Sube la foto elegida al bucket "avatars", en la carpeta del propio usuario
 * (requisito de las políticas RLS de storage.objects), con un nombre único
 * por subida para no pisar la foto anterior hasta que se guarde el cambio.
 * Devuelve la URL pública para guardar en profiles.foto_url.
 */
export async function subirFotoDePerfil(
  userId: string,
  foto: FotoElegida
): Promise<{ url: string | null; error: string | null }> {
  try {
    const extension = extensionDeMimeType(foto.mimeType);
    const path = `${userId}/avatar-${Date.now()}.${extension}`;
    const archivo = await fetch(foto.uri).then((res) => res.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, archivo, { contentType: foto.mimeType });

    if (uploadError) {
      return { url: null, error: uploadError.message };
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return { url: data.publicUrl, error: null };
  } catch (error) {
    return { url: null, error: error instanceof Error ? error.message : 'No pudimos subir la foto.' };
  }
}
