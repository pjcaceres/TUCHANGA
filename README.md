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
    MarkdownContent.tsx       Renderiza los documentos legales (títulos, negrita, listas)
    Avatar.tsx                Foto de perfil, o la inicial del nombre si no tiene una
    AvatarPicker.tsx          Avatar + control para elegir/subir una foto nueva
  constants/
    rubros.ts                Lista de rubros/oficios del MVP
    departamentos.ts          19 departamentos de Uruguay + detección por cercanía
    theme.ts                 Colores compartidos
  content/
    terminos.ts               Términos y Condiciones (copia embebida de tuchanga-terminos-y-condiciones.md)
    privacidad.ts              Política de Privacidad (copia embebida de tuchanga-politica-de-privacidad.md)
  contexts/
    AuthContext.tsx          Sesión de Supabase Auth disponible en toda la app
  lib/
    supabase.ts              Cliente de Supabase (usa variables de entorno EXPO_PUBLIC_*)
    geo.ts                    Distancia entre dos coordenadas (fórmula haversine)
    premium.ts                 Vigencia del plan premium (es_premium + premium_hasta)
    validacion.ts               Validación de teléfono del registro
    markdown.ts                 Parser markdown minimalista (headings, negrita, listas, itálica)
    chat.ts                     Obtener/crear conversación y chequear si un cliente ya contactó a un trabajador
    avatar.ts                   Elegir una foto y subirla al bucket "avatars" de Storage
  navigation/
    RootNavigator.tsx         Cambia entre stack de auth y stack de la app según la sesión
    types.ts                  Param lists de cada stack
  screens/
    LoginScreen.tsx
    RegisterScreen.tsx        Registro con selección de rol (trabajador/cliente), rubro/departamento por selector, validaciones y aceptación de términos
    WorkersListScreen.tsx      Listado de trabajadores: filtro por departamento + rubro, premium primero, ordenado por cercanía
    WorkerProfileScreen.tsx    Perfil completo: descripción, historial de trabajos, reseñas, botón "Contactar" y "Dejar reseña" (habilitado solo si ya lo contactó)
    PremiumScreen.tsx          Activar/renovar el plan premium (visibilidad + insignia) del propio perfil
    DejarResenaScreen.tsx      Formulario de reseña (estrellas + trabajo realizado + comentario) para clientes
    ConfiguracionScreen.tsx    Acceso a Editar perfil, Términos, Privacidad y Cerrar sesión
    EditarPerfilScreen.tsx     Edita el perfil de un trabajador ya registrado (foto, IA, etc.)
    EditarPerfilClienteScreen.tsx  Edita el perfil de un cliente ya registrado (solo nombre y foto)
    TerminosScreen.tsx         Términos y Condiciones con buen formato
    PrivacidadScreen.tsx       Política de Privacidad con buen formato
    MisChatsScreen.tsx         Lista de conversaciones del usuario (cliente o trabajador)
    ChatScreen.tsx             Chat de una conversación: burbujas, input y actualización en tiempo real (Supabase Realtime)
  types/
    database.ts               Tipos generados a mano del esquema de Supabase
supabase/
  migrations/
    0001_profiles.sql         Tabla `profiles` + políticas RLS
    0002_ubicacion_y_resenas.sql  Ubicación/departamento/calificación en profiles + tabla `resenas`
    0003_premium.sql           Vencimiento del plan premium (`premium_hasta`)
    0004_resenas_clientes.sql   Vincula reseñas a un cliente real + política de inserción
    0005_chat.sql               Tablas `conversaciones` y `mensajes` con RLS + Realtime
    0006_quitar_precio.sql      Elimina la columna `precio_orientativo` de `profiles`
    0007_perfil_automatico.sql  Trigger en auth.users que crea la fila de profiles automáticamente
    0008_avatars_storage.sql    Bucket público "avatars" + políticas de Storage por usuario
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
   - `supabase/migrations/0005_chat.sql`
   - `supabase/migrations/0006_quitar_precio.sql`
   - `supabase/migrations/0007_perfil_automatico.sql`
   - `supabase/migrations/0008_avatars_storage.sql`
   - `supabase/seed.sql` (opcional, carga trabajadores de prueba para ver el listado funcionando)
3. Desplegá la Edge Function `generar-perfil` y configurá su secreto (ver sección siguiente).
4. Instalá dependencias y arrancá la app:

   ```bash
   npm install
   npm run start
   ```

   Luego abrí la app en Expo Go (Android/iOS) o `npm run web` para probar en el navegador.

## Registro y creación del perfil

`supabase.auth.signUp()` **no siempre devuelve una sesión activa** — si tu proyecto tiene
habilitada la confirmación de email por link (Authentication → Settings → "Confirm email"), la
sesión queda en `null` hasta que el usuario confirma. Por eso la fila de `profiles` **no** se crea
con un `insert` desde el cliente justo después del `signUp()`: si no hay sesión todavía, ese insert
corre sin autenticación real y la política RLS lo bloquea sin devolver ningún error visible en la
UI — la cuenta de `auth.users` queda creada, pero sin perfil, para siempre.

En cambio, los datos del formulario (`tipo_usuario`, `nombre`, `teléfono`, `rubro`, `descripción`,
`departamento`) se mandan como `options.data` de `signUp()`, que Supabase guarda de forma síncrona
en `auth.users.raw_user_meta_data` apenas se crea el usuario — con sesión o sin ella. Un trigger en
la base (`0007_perfil_automatico.sql`, función `handle_new_user()`) escucha los inserts en
`auth.users` y crea la fila de `profiles` a partir de esos metadatos, corriendo como
`security definer` (no lo bloquea RLS). Si esa creación falla por cualquier motivo, `signUp()`
devuelve el error directo al cliente (se muestra en el formulario y se loguea en consola) — ya no
puede quedar una cuenta de auth "huérfana" sin perfil.

**Si ya tenés cuentas creadas antes de aplicar esta migración**, van a seguir sin perfil (los datos
originales del formulario nunca se guardaron en ningún lado, así que no hay forma de recuperarlos
automáticamente). Lo más simple es borrarlas desde el [Dashboard de Supabase](https://supabase.com/dashboard)
(Authentication → Users) y volver a registrarlas.

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

## Editar perfil

"Editar perfil" en "⚙️ Configuración" lleva a una pantalla distinta según el tipo de cuenta:
- **Trabajador** → `EditarPerfilScreen.tsx`, con nombre, teléfono, foto, departamento, rubro y
  descripción precargados desde su propia fila de `profiles`. Tiene la misma opción "Describir con
  IA" que el registro: escribe un texto libre, la Edge Function `generar-perfil` sugiere
  rubro/descripción (y departamento, si lo menciona), y el trabajador revisa/edita ese resultado
  antes de confirmar.
- **Cliente** → `EditarPerfilClienteScreen.tsx`, mucho más simple: solo nombre y foto.

En ambos casos "Guardar cambios" hace un `update` sobre la fila existente (`eq('id', userId)`) —
nunca inserta un perfil nuevo.

## Fotos de perfil

Las fotos (cara del trabajador o logo de su changa/empresa, foto del cliente) se guardan en el
bucket público `avatars` de Supabase Storage y su URL pública se guarda en `profiles.foto_url`
(columna que ya existía desde el registro inicial — no hizo falta agregar una nueva). Cada usuario
sólo puede subir/actualizar/borrar archivos dentro de su propia carpeta (`<user_id>/...`); la
lectura es pública para que se vea en el listado y en el perfil sin necesidad de estar logueado.
Cada subida usa un nombre de archivo único (`avatar-<timestamp>.<ext>`) en vez de pisar siempre el
mismo, así el cambio no se hace "visible" hasta que efectivamente se toca "Guardar cambios".

`AvatarPicker.tsx` (usado en el registro y en las dos pantallas de "Editar perfil") abre el
selector de imágenes del dispositivo (`expo-image-picker`, con recorte cuadrado incluido), sube el
archivo elegido y muestra una vista previa. `Avatar.tsx` es el componente de sólo lectura que se
usa en todos los lugares donde antes se mostraba el círculo con la inicial — listado, perfil del
trabajador y "Mis chats" — y si la imagen no carga (URL rota, sin conexión) cae de vuelta a esa
misma inicial en lugar de mostrar un espacio roto.

**Foto al registrarse**: solo se pide para trabajador (el cliente la agrega después desde "Editar
perfil"). Como `signUp()` puede no devolver una sesión activa todavía (ver "Registro y creación del
perfil" más arriba), la foto elegida en el formulario recién se sube si hay sesión disponible en el
mismo momento; si la confirmación de email está pendiente, se le avisa al trabajador que va a poder
terminar de subirla la primera vez que inicie sesión, en vez de intentarlo silenciosamente contra
una sesión que todavía no existe (mismo tipo de bug que ya rompió la creación del perfil una vez).

`Avatar.tsx` es solo la foto (o la inicial de respaldo) — no lleva ninguna insignia superpuesta. La
única señal visual de que un trabajador tiene el plan premium vigente (`esPremiumVigente`) sigue
siendo la insignia de texto "Destacado" junto a su nombre, tanto en el listado como en su perfil.

## Plan premium (freemium)

Un trabajador con plan premium vigente (`es_premium = true` y `premium_hasta` en el futuro, o sin
vencimiento) aparece primero en el listado —dentro del mismo departamento/rubro filtrado, antes que
los perfiles gratuitos, y ambos grupos se siguen ordenando por cercanía— y muestra la insignia
"Destacado" en su tarjeta y en su perfil. Un plan vencido deja de tener prioridad y de mostrar la
insignia automáticamente, sin necesidad de ningún job en el servidor: la vigencia se calcula al
vuelo comparando `premium_hasta` con la fecha actual (`src/lib/premium.ts`).

Desde el listado, un trabajador puede tocar "⭐ Premium" en el header para ir a la pantalla de
activación, que explica los beneficios y tiene un botón "Hacerme Premium por 30 días" (o "Renovar
30 días más" si ya está activo). **Todavía no hay cobro real**: el botón simplemente actualiza
`es_premium`/`premium_hasta` en su propio perfil (permitido por la política RLS de "editar mi
perfil" ya existente). Cuando se integre un medio de pago (Mercado Pago u otro), ese botón pasa a
iniciar el cobro y sólo al confirmarse se actualizan esos mismos campos. El link "⭐ Premium" solo
aparece si el usuario logueado es de tipo trabajador (no tiene sentido para un cliente); esa
verificación se reintenta cada vez que se vuelve al listado (`useFocusEffect`), no solo una vez al
entrar, para que un fallo puntual de red no la deje oculta indefinidamente. La consulta pide
`select('*')` (en vez de columnas puntuales) para no depender de que el cache de esquema de
PostgREST tenga al día alguna columna agregada por una migración reciente (p. ej. `premium_hasta`);
si de todas formas falla, el error queda logueado en la consola del navegador en vez de fallar en
silencio — si "⭐ Premium" no aparece para una cuenta de trabajador, lo primero a revisar es esa
consola y confirmar que las migraciones `0001` a `0006` estén todas aplicadas.

Mientras un trabajador no tenga el plan premium vigente, ve un banner descartable arriba del
listado ("⭐ Hacete Premium…") con los mismos beneficios y un acceso directo a la pantalla. Al
cerrarlo con la "✕" queda guardado en `AsyncStorage` (por usuario), así no vuelve a aparecer en
sesiones futuras; si en cambio se activa el plan, el banner deja de mostrarse solo.

## Chat interno

Desde el perfil de cualquier trabajador (o de cualquier otro usuario, si quien mira también es
trabajador) hay un botón "💬 Contactar" que busca la conversación existente entre ambos o la crea
(`src/lib/chat.ts` → `obtenerOCrearConversacion`) y navega directo a la pantalla de chat. La
conversación queda identificada por el par `(cliente_id, trabajador_id)` —"cliente_id" es siempre
quien inició el contacto, más allá de su `tipo_usuario`— con una restricción `unique` para no
duplicarla.

El chat (`ChatScreen.tsx`) muestra los mensajes en burbujas (propias a la derecha, ajenas a la
izquierda), un input abajo y hace scroll automático al último mensaje. Se suscribe a
`postgres_changes` sobre `mensajes` filtrando por `conversacion_id`, así que los mensajes nuevos
del otro usuario aparecen sin recargar la pantalla (Supabase Realtime). "💬 Mis chats" en el header
del listado lleva a `MisChatsScreen.tsx`, con todas las conversaciones del usuario (como cliente o
como trabajador) y el nombre del otro participante. Cuando todavía no tiene ninguna, el mensaje
vacío cambia según el tipo de usuario: a un cliente se lo invita a contactar a un trabajador, a un
trabajador se le explica que ahí va a ver los mensajes de los clientes que lo contacten.

RLS en `conversaciones`/`mensajes` restringe todo a los dos participantes de cada conversación, y
un mensaje solo puede insertarse con `remitente_id = auth.uid()`.

**Nota de testing**: el entorno de desarrollo de este sandbox bloquea la salida de red hacia
`*.supabase.co`, así que el envío/recepción de mensajes y el gate de reseñas se probaron con
Playwright contra rutas REST mockeadas; la recepción en tiempo real vía websocket (Realtime en sí)
no se pudo verificar end-to-end acá y conviene probarla con un dispositivo/backend real antes de
confiar en ella a ciegas.

## Reseñas desde el cliente

Un usuario tipo cliente ve un botón "✍️ Dejar reseña" en el perfil de cualquier trabajador (no en
el suyo propio), pero **solo si ya lo contactó** (existe al menos un mensaje suyo en esa
conversación — `haContactadoAlTrabajador` en `src/lib/chat.ts`); si todavía no lo contactó, ve un
aviso explicándoselo en su lugar. El formulario pide calificación (1 a 5 estrellas, tap para
elegir), qué trabajo le realizó y un comentario opcional. Al guardar se inserta una fila en
`resenas` asociada al trabajador y al cliente autenticado (`cliente_id = auth.uid()`, forzado por
RLS para que nadie pueda dejar una reseña en nombre de otro), el trigger existente recalcula
`calificacion_promedio` / `cantidad_resenas` del trabajador, y al volver a su perfil
(`useFocusEffect`) la reseña nueva ya aparece en el historial.

## Términos y Condiciones / Política de Privacidad

Los dos documentos legales (`tuchanga-terminos-y-condiciones.md` y
`tuchanga-politica-de-privacidad.md`, en la raíz del repo) están embebidos como constantes de
TypeScript en `src/content/` y se renderizan con un parser markdown minimalista propio
(`src/lib/markdown.ts` + `MarkdownContent.tsx`) que soporta títulos, negrita, itálica y listas —
alcanza para el subconjunto de markdown que usan estos documentos, sin agregar una librería nueva.

**Si editás alguno de los dos `.md` de la raíz, actualizá también su copia en `src/content/`** (no
hay build step que los sincronice automáticamente).

- En el registro, hay un checkbox obligatorio ("Acepto los Términos y Condiciones y la Política de
  Privacidad") con los dos nombres como links que abren esas pantallas; el botón "Crear cuenta"
  queda deshabilitado hasta marcarlo.
- Ya logueado, "⚙️ Configuración" en el header del listado lleva a una pantalla con acceso a ambos
  documentos en cualquier momento.

## Estado actual (MVP en progreso)

- [x] Estructura base del proyecto (Expo + TypeScript + Supabase)
- [x] Registro y login con Supabase Auth (email/contraseña)
- [x] Selección de rol al registrarse (trabajador / cliente), con rubro y departamento por
      selector (no texto libre) y validación de teléfono
- [x] Listado de trabajadores por departamento (detección por GPS + selección manual) y rubro,
      ordenado por cercanía real (lat/lng)
- [x] Perfil completo del trabajador con descripción, historial de trabajos y reseñas
- [x] Reseñas e historial de trabajos (calificación promedio se actualiza sola con un trigger)
- [x] Los clientes pueden dejar reseñas desde el perfil del trabajador, solo si ya lo contactaron por chat
- [x] Chat interno entre cliente y trabajador con Supabase Realtime, y pantalla "Mis chats"
- [x] Términos y Condiciones / Política de Privacidad integrados, con aceptación obligatoria al registrarse
- [x] Generación de perfil por IA a partir de texto libre al registrarse (con revisión/edición antes de guardar)
- [x] Plan premium: prioridad en el listado + insignia "Destacado" + pantalla de activación (sin cobro real todavía)
- [x] Perfil de trabajador y de cliente editables desde la app luego del registro (con la opción de IA para trabajador)
- [x] Foto de perfil (trabajador y cliente)
- [ ] Dictado por audio (hoy funciona vía el micrófono del teclado del sistema, no hay grabación propia)
- [ ] Cobro real del plan premium (Mercado Pago u otro medio) — hoy se activa sin costo para probar la lógica
