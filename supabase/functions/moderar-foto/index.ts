// Edge Function: modera una foto antes de publicarla, usando la API de Claude
// (con capacidad de visión) para clasificarla como apropiada o no para una
// plataforma profesional de changas/oficios. Corre del lado del servidor —
// la ANTHROPIC_API_KEY nunca se expone al cliente (es la misma que usa
// "generar-perfil").
//
// Variable de entorno requerida (ya configurada como secreto de Supabase):
//   ANTHROPIC_API_KEY

import Anthropic from 'npm:@anthropic-ai/sdk@0.70.1';

const ANTHROPIC_MODEL = 'claude-haiku-4-5';

// Límite generoso para una foto de celular comprimida (quality: 0.7 en el
// picker del cliente); corta acá antes de mandarla a la API para no pagar
// por payloads gigantes ni pegarle a límites de tamaño de Anthropic.
const MAX_BASE64_LENGTH = 8_000_000; // ~6MB de imagen original

const MIME_TYPES_VALIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
type MimeTypeValido = (typeof MIME_TYPES_VALIDOS)[number];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODERACION_SCHEMA = {
  type: 'object',
  properties: {
    apropiada: { type: 'boolean' },
    motivo: { type: 'string' },
  },
  required: ['apropiada', 'motivo'],
  additionalProperties: false,
};

const PROMPT_MODERACION = `Sos un moderador de contenido para TuChanga, una plataforma uruguaya donde
trabajadores de oficio (plomeros, electricistas, pintores, jardineros, gasistas,
cerrajeros, personal de limpieza, mudanzas, etc.) publican fotos de trabajos
que realizaron, para mostrarle a potenciales clientes su trabajo.

Evaluá la imagen adjunta y decidí si es apropiada para publicarse en esa
plataforma profesional.

Marcala como NO apropiada si la imagen contiene, aunque sea parcialmente:
- Desnudos o contenido sexual.
- Violencia gráfica, sangre, heridas graves o armas.
- Contenido de odio, discriminación o símbolos ofensivos.
- Cualquier cosa que claramente no tenga relación con mostrar un trabajo de
  oficio realizado (por ejemplo: memes, capturas de pantalla de chats o redes
  sociales, publicidad ajena a la plataforma, selfies o fotos de personas sin
  ningún contexto de trabajo, imágenes en blanco o ilegibles).

Marcala como apropiada si muestra herramientas, materiales, espacios de
trabajo, el antes/durante/después de una reparación o instalación, o
cualquier imagen razonable en el contexto de una plataforma de servicios de
oficio — no hace falta que sea una foto profesional ni de gran calidad.

Ante la duda razonable, priorizá no bloquear fotos que parezcan
genuinamente relacionadas a un trabajo de oficio.`;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}

function esMimeTypeValido(valor: unknown): valor is MimeTypeValido {
  return typeof valor === 'string' && (MIME_TYPES_VALIDOS as readonly string[]).includes(valor);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método no permitido.' }, 405);
  }

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    console.error('Falta configurar la variable de entorno ANTHROPIC_API_KEY');
    return jsonResponse({ error: 'La función no está configurada en el servidor.' }, 500);
  }

  let imagenBase64: unknown;
  let mimeType: unknown;
  try {
    const body = await req.json();
    imagenBase64 = body?.imagenBase64;
    mimeType = body?.mimeType;
  } catch {
    return jsonResponse(
      { error: 'Body inválido: se espera JSON con { imagenBase64, mimeType }.' },
      400
    );
  }

  if (typeof imagenBase64 !== 'string' || imagenBase64.length === 0) {
    return jsonResponse({ error: 'Falta la imagen a moderar.' }, 400);
  }
  if (imagenBase64.length > MAX_BASE64_LENGTH) {
    return jsonResponse({ error: 'La foto es demasiado pesada para moderarla.' }, 400);
  }
  if (!esMimeTypeValido(mimeType)) {
    return jsonResponse({ error: 'Formato de imagen no soportado.' }, 400);
  }

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: imagenBase64 } },
            { type: 'text', text: PROMPT_MODERACION },
          ],
        },
      ],
      output_config: { format: { type: 'json_schema', schema: MODERACION_SCHEMA } },
    });

    if (response.stop_reason === 'refusal') {
      // Claude se negó a describir la imagen: tratamos eso como una señal
      // fuerte de contenido problemático y bloqueamos por las dudas.
      console.error('moderar-foto: la IA se negó a evaluar la imagen (posible contenido sensible)');
      return jsonResponse({ apropiada: false });
    }
    if (response.stop_reason === 'max_tokens') {
      return jsonResponse({ error: 'La respuesta se cortó. Probá de nuevo.' }, 502);
    }

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return jsonResponse({ error: 'La IA no devolvió una respuesta con el formato esperado.' }, 502);
    }

    const resultado = JSON.parse(textBlock.text) as { apropiada: boolean; motivo: string };

    if (!resultado.apropiada) {
      // El motivo se guarda solo en los logs del servidor: al cliente nunca
      // se le devuelve, para no darle pistas de cómo evadir el filtro.
      console.log('moderar-foto: foto marcada como no apropiada —', resultado.motivo);
    }

    return jsonResponse({ apropiada: resultado.apropiada });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return jsonResponse({ error: 'Estamos con mucha demanda, probá de nuevo en un momento.' }, 429);
    }
    if (err instanceof Anthropic.APIError) {
      console.error('Error de Anthropic:', err.status, err.message);
      return jsonResponse({ error: 'No pudimos moderar la foto en este momento.' }, 502);
    }
    console.error('Error inesperado en moderar-foto:', err);
    return jsonResponse({ error: 'Ocurrió un error inesperado.' }, 500);
  }
});
