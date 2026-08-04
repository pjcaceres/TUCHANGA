import { supabase } from './supabase';

type ResultadoConversacion = { id: string } | null;

/**
 * Devuelve la conversación entre un cliente y un trabajador si ya existe,
 * o la crea si es la primera vez que se contactan.
 */
export async function obtenerOCrearConversacion(
  clienteId: string,
  trabajadorId: string
): Promise<{ conversacionId: string | null; error: string | null }> {
  const { data: existente, error: errorBusqueda } = await supabase
    .from('conversaciones')
    .select('id')
    .eq('cliente_id', clienteId)
    .eq('trabajador_id', trabajadorId)
    .maybeSingle();

  if (errorBusqueda) {
    return { conversacionId: null, error: errorBusqueda.message };
  }

  if (existente) {
    return { conversacionId: existente.id, error: null };
  }

  const { data: creada, error: errorCreacion } = await supabase
    .from('conversaciones')
    .insert({ cliente_id: clienteId, trabajador_id: trabajadorId })
    .select('id')
    .single();

  if (errorCreacion) {
    // Puede haberse creado en paralelo (constraint unique) — reintentamos la búsqueda.
    const { data: reintento, error: errorReintento } = await supabase
      .from('conversaciones')
      .select('id')
      .eq('cliente_id', clienteId)
      .eq('trabajador_id', trabajadorId)
      .maybeSingle();

    if (errorReintento || !reintento) {
      return { conversacionId: null, error: errorCreacion.message };
    }

    return { conversacionId: reintento.id, error: null };
  }

  return { conversacionId: (creada as ResultadoConversacion)?.id ?? null, error: null };
}

/**
 * Un cliente puede dejar una reseña sólo si ya le envió al menos un mensaje
 * a ese trabajador (es decir, ya lo contactó).
 */
export async function haContactadoAlTrabajador(
  clienteId: string,
  trabajadorId: string
): Promise<boolean> {
  const { data: conversacion } = await supabase
    .from('conversaciones')
    .select('id')
    .eq('cliente_id', clienteId)
    .eq('trabajador_id', trabajadorId)
    .maybeSingle();

  if (!conversacion) return false;

  const { count } = await supabase
    .from('mensajes')
    .select('id', { count: 'exact', head: true })
    .eq('conversacion_id', conversacion.id)
    .eq('remitente_id', clienteId);

  return (count ?? 0) > 0;
}
