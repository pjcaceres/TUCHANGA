import { FunctionsHttpError } from '@supabase/supabase-js';
import type { FotoElegida } from './avatar';
import { supabase } from './supabase';

const MENSAJE_FOTO_RECHAZADA =
  'Una de las fotos elegidas no puede subirse porque no cumple con las normas de contenido de TuChanga. Elegí otra foto y probá de nuevo.';
const MENSAJE_ERROR_GENERICO = 'No pudimos revisar las fotos. Probá de nuevo en un momento.';

/**
 * Convierte una foto elegida (uri local, sea file://, content://, blob: o
 * data:) a un string base64 puro, sin el prefijo "data:...;base64,". Usa el
 * mismo truco fetch+Blob+FileReader que funciona igual en RN nativo (que
 * trae su propio shim de Blob/FileReader) y en web, sin depender de
 * expo-file-system ni de Buffer (que no existe en el runtime de RN).
 */
async function convertirABase64(uri: string): Promise<string> {
  const respuesta = await fetch(uri);
  const blob = await respuesta.blob();

  return await new Promise<string>((resolve, reject) => {
    const lector = new FileReader();
    lector.onerror = () => reject(new Error('No pudimos leer la foto.'));
    lector.onload = () => {
      const resultado = lector.result;
      const base64 = typeof resultado === 'string' ? resultado.split(',')[1] : undefined;
      if (!base64) {
        reject(new Error('No pudimos leer la foto.'));
        return;
      }
      resolve(base64);
    };
    lector.readAsDataURL(blob);
  });
}

/**
 * Manda una foto a la Edge Function "moderar-foto" (que usa la API de
 * Claude con visión) y devuelve si es apropiada para publicarse. Nunca
 * expone al llamador el motivo detectado — solo apropiada/no — para no dar
 * pistas de cómo evadir el filtro.
 */
async function moderarFoto(foto: FotoElegida): Promise<{ apropiada: boolean; error: string | null }> {
  let imagenBase64: string;
  try {
    imagenBase64 = await convertirABase64(foto.uri);
  } catch {
    return { apropiada: false, error: MENSAJE_ERROR_GENERICO };
  }

  const { data, error: fnError } = await supabase.functions.invoke<{ apropiada: boolean }>(
    'moderar-foto',
    { body: { imagenBase64, mimeType: foto.mimeType } }
  );

  if (fnError) {
    if (fnError instanceof FunctionsHttpError) {
      // El body de un error de la función es { error: string }, pero ese
      // mensaje es para debugging nuestro (p.ej. "falta la API key"), no
      // algo que el trabajador deba ver — así que igual mostramos el
      // genérico en la UI en vez de reenviarlo tal cual.
      console.error('moderar-foto devolvió un error:', await fnError.context.json().catch(() => null));
    }
    return { apropiada: false, error: MENSAJE_ERROR_GENERICO };
  }

  return { apropiada: data?.apropiada ?? false, error: null };
}

/**
 * Modera una lista de fotos antes de publicarlas. Corta en la primera
 * foto problemática: si el motivo es una falla técnica (red, IA caída),
 * devuelve un mensaje para "probá de nuevo"; si la propia IA la marcó como
 * no apropiada, devuelve el mensaje de rechazo — nunca el motivo puntual
 * que detectó la IA, para no dar pistas de cómo evadir el filtro.
 */
export async function moderarFotos(fotos: FotoElegida[]): Promise<{ ok: boolean; error: string | null }> {
  for (const foto of fotos) {
    const { apropiada, error } = await moderarFoto(foto);
    if (error) {
      return { ok: false, error };
    }
    if (!apropiada) {
      return { ok: false, error: MENSAJE_FOTO_RECHAZADA };
    }
  }

  return { ok: true, error: null };
}
