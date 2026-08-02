// Edge Function: genera rubro / descripción / departamento a partir de un texto
// libre que escribe el trabajador al registrarse. Usa la API de Claude (Anthropic)
// del lado del servidor — la ANTHROPIC_API_KEY nunca se expone al cliente.
//
// Variable de entorno requerida (configurar como secreto de Supabase):
//   ANTHROPIC_API_KEY

import Anthropic from 'npm:@anthropic-ai/sdk@0.70.1';

// Debe reflejar src/constants/rubros.ts y src/constants/departamentos.ts.
// (Archivo autocontenido a propósito: se puede pegar entero en el editor de
// Supabase Dashboard sin depender de imports relativos a otras carpetas.)
const RUBROS_VALIDOS = [
  'electricista',
  'plomero',
  'jardineria',
  'limpieza',
  'pintura',
  'gasista',
  'cerrajero',
  'mudanzas',
  'otro',
] as const;

const DEPARTAMENTOS_VALIDOS = [
  'Artigas',
  'Canelones',
  'Cerro Largo',
  'Colonia',
  'Durazno',
  'Flores',
  'Florida',
  'Lavalleja',
  'Maldonado',
  'Montevideo',
  'Paysandú',
  'Río Negro',
  'Rivera',
  'Rocha',
  'Salto',
  'San José',
  'Soriano',
  'Tacuarembó',
  'Treinta y Tres',
] as const;

const ANTHROPIC_MODEL = 'claude-haiku-4-5';
const MAX_TEXTO_LENGTH = 2000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PERFIL_SCHEMA = {
  type: 'object',
  properties: {
    rubro: { type: 'string', enum: [...RUBROS_VALIDOS] },
    descripcion: { type: 'string' },
    departamento: {
      anyOf: [{ type: 'string', enum: [...DEPARTAMENTOS_VALIDOS] }, { type: 'null' }],
    },
  },
  required: ['rubro', 'descripcion', 'departamento'],
  additionalProperties: false,
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}

function buildPrompt(texto: string): string {
  return `Sos un asistente que ayuda a armar perfiles de trabajadores de oficio para TuChanga, una app de changas en Uruguay.

El trabajador escribió este texto libre contando lo que hace:
"""
${texto}
"""

Completá estos campos a partir del texto, sin inventar datos que no estén en él:
- rubro: el oficio principal. Tiene que ser exactamente uno de: ${RUBROS_VALIDOS.join(', ')}. Si el texto no coincide claramente con ninguno, usá "otro".
- descripcion: un párrafo breve (2 a 4 oraciones), en español, en primera persona, profesional y claro, resumiendo qué hace, su experiencia y su zona de trabajo si la menciona.
- departamento: si el texto permite identificar con confianza en qué departamento de Uruguay trabaja, elegí exactamente uno de: ${DEPARTAMENTOS_VALIDOS.join(', ')}. Si no se puede inferir con confianza, usá null.`;
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

  let texto: unknown;
  try {
    const body = await req.json();
    texto = body?.texto;
  } catch {
    return jsonResponse({ error: 'Body inválido: se espera JSON con { texto }.' }, 400);
  }

  if (typeof texto !== 'string' || texto.trim().length < 10) {
    return jsonResponse(
      { error: 'Contanos un poco más sobre tu trabajo (mínimo 10 caracteres).' },
      400
    );
  }
  if (texto.length > MAX_TEXTO_LENGTH) {
    return jsonResponse(
      { error: `El texto es demasiado largo (máximo ${MAX_TEXTO_LENGTH} caracteres).` },
      400
    );
  }

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 500,
      messages: [{ role: 'user', content: buildPrompt(texto) }],
      output_config: { format: { type: 'json_schema', schema: PERFIL_SCHEMA } },
    });

    if (response.stop_reason === 'refusal') {
      return jsonResponse(
        { error: 'No pudimos generar el perfil a partir de ese texto. Probá reformularlo.' },
        422
      );
    }
    if (response.stop_reason === 'max_tokens') {
      return jsonResponse(
        { error: 'La respuesta se cortó. Probá con un texto un poco más corto.' },
        502
      );
    }

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return jsonResponse({ error: 'La IA no devolvió una respuesta con el formato esperado.' }, 502);
    }

    const perfil = JSON.parse(textBlock.text) as {
      rubro: string;
      descripcion: string;
      departamento: string | null;
    };

    return jsonResponse({
      rubro: perfil.rubro,
      descripcion: perfil.descripcion.slice(0, 600),
      departamento: perfil.departamento,
    });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return jsonResponse({ error: 'Estamos con mucha demanda, probá de nuevo en un momento.' }, 429);
    }
    if (err instanceof Anthropic.APIError) {
      console.error('Error de Anthropic:', err.status, err.message);
      return jsonResponse({ error: 'No pudimos generar el perfil en este momento.' }, 502);
    }
    console.error('Error inesperado en generar-perfil:', err);
    return jsonResponse({ error: 'Ocurrió un error inesperado.' }, 500);
  }
});
