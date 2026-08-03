# TuChanga

Marketplace móvil (iOS/Android) que conecta trabajadores de oficio (electricista, plomero,
jardinería, limpieza, pintura, gasista, cerrajero, mudanzas, etc.) con clientes en Uruguay.

## Stack

- **App**: React Native + [Expo](https://docs.expo.dev/) (TypeScript)
- **Backend**: [Supabase](https://supabase.com/) (Auth + Postgres + Row Level Security)
- **Navegación**: React Navigation (native stack)

## Estructura

```
App.tsx                     Entry point: providers + navegación
src/
  components/
    StarRating.tsx           Estrellas + promedio (usado en tarjeta y perfil)
    StarRatingInput.tsx       Estrellas tap-to-rate (usadas al dejar una reseña)
    WorkerCard.tsx            Tarjeta de trabajador en el listado
    DepartamentoSelector.tsx  Selector de departamento (modal + detección por GPS)
  constants/
    rubros.ts                Lista de rubros/oficios del MVP
    departamentos.ts          19 departamentos de Uruguay + detección por cercanía
    theme.ts                 Colores compartidos
  contexts/
    AuthContext.tsx          Sesión de Supabase Auth disponible en toda la app
  lib/
    supabase.ts              Cliente de Supabase (usa variables de entorno EXPO_PUBLIC_*)
    geo.ts                    Distancia entre dos coordenadas (fórmula haversine)
    premium.ts                 Vigencia del plan premium (es_premium + premium_hasta)
    validacion.ts               Validación de teléfono y precio orientativo del registro
  navigation/
    RootNavigator.tsx         Cambia entre stack de auth y stack de la app según la sesión
    types.ts                  Param lists de cada stack
  screens/
    LoginScreen.tsx
    RegisterScreen.tsx        Registro con selección de rol (trabajador/cliente), rubro/departamento por selector y validaciones
    WorkersListScreen.tsx      Listado de trabajadores: filtro por departamento + rubro, premium primero, ordenado por cercanía
    WorkerProfileScreen.tsx    Perfil completo: descripción, historial de trabajos, reseñas y botón para dejar una reseña
    PremiumScreen.tsx          Activar/renovar el plan premium (visibilidad + insignia) del propio perfil
    DejarResenaScreen.tsx      Formulario de reseña (estrellas + trabajo realizado + comentario) para clientes
  types/
    database.ts               Tipos generados a mano del esquema de Supabase
supabase/
  migrations/
    0001_profiles.sql         Tabla `profiles` + políticas RLS
    0002_ubicacion_y_resenas.sql  Ubicación/departamento/calificación en profiles + tabla `resenas`
    0003_premium.sql           Vencimiento del plan premium (`premium_hasta`)
    0004_resenas_clientes.sql   Vincula reseñas a un cliente real + política de inserción
  seed.sql                    Trabajadores ficticios de prueba repartidos en varios departamentos
  functions/
    generar-perfil/           Edge Function: arma rubro/descripción/departamento con Claude (Anthropic)
```

## Setup

1. Creá un proyecto en [supabase.com](https://supabase.com) y copiá `.env.example` a `.env`,
   completando `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` (Project Settings → API).
2. Corré, en orden, en el SQL editor de tu proyecto (o vía `supabase db push`/`supabase db reset`
   si usás el CLI de Supabase):
   - `supabase/migrations/0001_profiles.sql`
   - `supabase/migrations/0002_ubicacion_y_resenas.sql`
   - `supabase/migrations/0003_premium.sql`
   - `supabase/migrations/0004_resenas_clientes.sql`
   - `supabase/seed.sql` (opcional, carga trabajadores de prueba para ver el listado funcionando)
3. Desplegá la Edge Function `generar-perfil` y configurá su secreto (ver sección siguiente).
4. Instalá dependencias y arrancá la app:

   ```bash
   npm install
   npm run start
   ```

   Luego abrí la app en Expo Go (Android/iOS) o `npm run web` para probar en el navegador.

## Perfil de trabajador generado por IA

En el registro de trabajador hay una opción "Describir con IA": el trabajador escribe (o dicta)
un texto libre contando lo que hace, y la Edge Function `generar-perfil` le pide a Claude (Anthropic)
que devuelva rubro / descripción / departamento en JSON estructurado. El trabajador siempre revisa
y puede editar ese resultado antes de confirmar — nunca se guarda directo.

Para habilitarlo desde el [Dashboard de Supabase](https://supabase.com/dashboard) (sin CLI):

1. **Configurar el secreto**: en tu proyecto → *Edge Functions* → *Manage secrets* (o *Settings →
   Edge Functions*) → agregá una variable `ANTHROPIC_API_KEY` con tu clave de API de Claude. Nunca
   se expone al cliente, solo la lee la función del lado del servidor.
2. **Crear la función**: en *Edge Functions* → *Deploy a new function* → nombrala exactamente
   `generar-perfil` (tiene que coincidir con el nombre que usa la app) → pegá el contenido completo
   de `supabase/functions/generar-perfil/index.ts` en el editor → *Deploy*.

   El archivo es autocontenido (no depende de otros archivos del repo), así que un copy-paste
   directo alcanza.

También se puede hacer con el [CLI de Supabase](https://supabase.com/docs/guides/cli):
`supabase secrets set ANTHROPIC_API_KEY=sk-ant-...` y después `supabase functions deploy generar-perfil`.

La app la invoca vía `supabase.functions.invoke('generar-perfil', { body: { texto } })` usando el
anon key normal — no hace falta ninguna variable de entorno adicional del lado del cliente.

## Plan premium (freemium)

Un trabajador con plan premium vigente (`es_premium = true` y `premium_hasta` en el futuro, o sin
vencimiento) aparece primero en el listado —dentro del mismo departamento/rubro filtrado, antes que
los perfiles gratuitos, y ambos grupos se siguen ordenando por cercanía— y muestra la insignia
"Destacado" en su tarjeta y en su perfil. Un plan vencido deja de tener prioridad y de mostrar la
insignia automáticamente, sin necesidad de ningún job en el servidor: la vigencia se calcula al
vuelo comparando `premium_hasta` con la fecha actual (`src/lib/premium.ts`).

Desde el listado, cualquier trabajador puede tocar "⭐ Premium" en el header para ir a la pantalla
de activación, que explica los beneficios y tiene un botón "Hacerme Premium por 30 días" (o
"Renovar 30 días más" si ya está activo). **Todavía no hay cobro real**: el botón simplemente
actualiza `es_premium`/`premium_hasta` en su propio perfil (permitido por la política RLS de
"editar mi perfil" ya existente). Cuando se integre un medio de pago (Mercado Pago u otro), ese
botón pasa a iniciar el cobro y sólo al confirmarse se actualizan esos mismos campos.

## Reseñas desde el cliente

Un usuario tipo cliente ve un botón "✍️ Dejar reseña" en el perfil de cualquier trabajador (no en
el suyo propio). El formulario pide calificación (1 a 5 estrellas, tap para elegir), qué trabajo le
realizó y un comentario opcional. Al guardar se inserta una fila en `resenas` asociada al
trabajador y al cliente autenticado (`cliente_id = auth.uid()`, forzado por RLS para que nadie
pueda dejar una reseña en nombre de otro), el trigger existente recalcula `calificacion_promedio` /
`cantidad_resenas` del trabajador, y al volver a su perfil (`useFocusEffect`) la reseña nueva ya
aparece en el historial.

## Estado actual (MVP en progreso)

- [x] Estructura base del proyecto (Expo + TypeScript + Supabase)
- [x] Registro y login con Supabase Auth (email/contraseña)
- [x] Selección de rol al registrarse (trabajador / cliente), con rubro y departamento por
      selector (no texto libre) y validación de teléfono/precio
- [x] Listado de trabajadores por departamento (detección por GPS + selección manual) y rubro,
      ordenado por cercanía real (lat/lng)
- [x] Perfil completo del trabajador con descripción, historial de trabajos y reseñas
- [x] Reseñas e historial de trabajos (calificación promedio se actualiza sola con un trigger)
- [x] Los clientes pueden dejar reseñas desde el perfil del trabajador
- [x] Generación de perfil por IA a partir de texto libre al registrarse (con revisión/edición antes de guardar)
- [x] Plan premium: prioridad en el listado + insignia "Destacado" + pantalla de activación (sin cobro real todavía)
- [ ] Perfil de trabajador editable desde la app luego del registro (foto, precio orientativo)
- [ ] Dictado por audio (hoy funciona vía el micrófono del teclado del sistema, no hay grabación propia)
- [ ] Cobro real del plan premium (Mercado Pago u otro medio) — hoy se activa sin costo para probar la lógica
