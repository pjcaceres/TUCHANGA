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
assets/
  LogoTuchangaPng.png        Logo original de la app (ícono + wordmark, con glow, fondo transparente)
  logo-header.png            Recorte de LogoTuchangaPng.png sin el margen transparente del glow, usado en AppHeader.tsx
src/
  components/
    StarRating.tsx           Estrellas + promedio (usado en tarjeta y perfil)
    StarRatingInput.tsx       Estrellas tap-to-rate (usadas al dejar una reseña)
    WorkerCard.tsx            Tarjeta de trabajador en el listado
    DepartamentoSelector.tsx  Selector de departamento (modal + detección por GPS)
    MarkdownContent.tsx       Renderiza los documentos legales (títulos, negrita, listas)
    Avatar.tsx                Foto de perfil, o la inicial del nombre si no tiene una
    AvatarPicker.tsx          Avatar + control para elegir/subir una foto nueva
    RubroChipsSelector.tsx    Chips de selección múltiple de rubros
    RubroChipsList.tsx        Chips de solo lectura para mostrar los rubros de un trabajador
    MainTabs.tsx              Pestañas "Trabajadores" / "Publicaciones" / "Mi Perfil" (esta última solo trabajador)
    AppHeader.tsx             Header compartido (logo + HeaderMenu + MainTabs) para que no cambie entre pestañas
    HeaderMenu.tsx            Menú "⋮" desplegable con Premium (solo trabajador) / Mis chats / Configuración
    PublicacionCard.tsx       Tarjeta de una publicación del feed: carrusel de fotos, autor opcional, descripción, likes y fecha
    PublicacionesGrid.tsx     Cuadrícula estilo Instagram de miniaturas (usada en Mi Perfil), con badge de "varias fotos" y de likes
    Carousel.tsx              Carrusel deslizable de fotos con flechas ‹ › y contador "posición/total" (PublicacionCard y PublicacionesGrid)
    LikeButton.tsx            Botón de "me gusta" (corazón) + contador, con variante chica para el grid
    ConfirmDialog.tsx         Modal de confirmación genérico (usado para borrar una publicación)
  constants/
    rubros.ts                Lista de rubros/oficios del MVP
    departamentos.ts          19 departamentos de Uruguay + detección por cercanía
    theme.ts                 Colores compartidos
  content/
    terminos.ts               Términos y Condiciones (copia embebida de tuchanga-terminos-y-condiciones.md)
    privacidad.ts              Política de Privacidad (copia embebida de tuchanga-politica-de-privacidad.md)
  contexts/
    AuthContext.tsx          Sesión de Supabase Auth disponible en toda la app
    ProfileContext.tsx        Cachea el propio perfil (profiles) a nivel app, para que no se resetee al cambiar de pestaña
  hooks/
    useLikes.ts                Estado de likes (conteo + "¿ya likeé esto?") con toggle optimista, para el feed/perfil/grid
  lib/
    supabase.ts              Cliente de Supabase (usa variables de entorno EXPO_PUBLIC_*)
    geo.ts                    Distancia entre dos coordenadas (fórmula haversine)
    premium.ts                 Vigencia del plan premium (es_premium + premium_hasta)
    validacion.ts               Validación de teléfono del registro
    markdown.ts                 Parser markdown minimalista (headings, negrita, listas, itálica)
    chat.ts                     Obtener/crear conversación y chequear si un cliente ya contactó a un trabajador
    avatar.ts                   Elegir una foto y subirla al bucket "avatars" de Storage
    publicaciones.ts            Elegir/subir hasta 6 fotos de trabajo, borrar una publicación, traer las fotos de varias
    likes.ts                    Traer los likes de varias publicaciones, dar/quitar el propio
  navigation/
    RootNavigator.tsx         Cambia entre stack de auth y stack de la app según la sesión
    types.ts                  Param lists de cada stack
  screens/
    LoginScreen.tsx
    RegisterScreen.tsx        Registro con selección de rol (trabajador/cliente), rubros (selección múltiple)/departamento por selector, validaciones y aceptación de términos
    WorkersListScreen.tsx      Listado de trabajadores: filtro por departamento + rubro, premium primero, ordenado por cercanía
    WorkerProfileScreen.tsx    Perfil completo: descripción, calificación con estrellas, publicaciones, botón "Contactar" y "Dejar reseña" (habilitado solo si ya lo contactó)
    PremiumScreen.tsx          Activar/renovar el plan premium (visibilidad + insignia) del propio perfil
    DejarResenaScreen.tsx      Formulario de reseña (estrellas + trabajo realizado + comentario) para clientes
    ConfiguracionScreen.tsx    Acceso a Editar perfil, Términos, Privacidad y Cerrar sesión
    EditarPerfilScreen.tsx     Edita el perfil de un trabajador ya registrado (foto, IA, etc.)
    EditarPerfilClienteScreen.tsx  Edita el perfil de un cliente ya registrado (solo nombre y foto)
    TerminosScreen.tsx         Términos y Condiciones con buen formato
    PrivacidadScreen.tsx       Política de Privacidad con buen formato
    MisChatsScreen.tsx         Lista de conversaciones del usuario (cliente o trabajador)
    ChatScreen.tsx             Chat de una conversación: burbujas, input y actualización en tiempo real (Supabase Realtime)
    PublicacionesFeedScreen.tsx  Feed de fotos de trabajos de todos los trabajadores, más recientes primero
    PublicarTrabajoScreen.tsx    Formulario para que un trabajador publique una foto + descripción corta opcional
    MiPerfilScreen.tsx           Pestaña "Mi Perfil" (solo trabajador): foto, rubros, calificación, Editar perfil, Premium y grid de publicaciones propias
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
    0009_rubros_multiples.sql   Reemplaza `rubro` (uno) por `rubros` (array) + migra los datos existentes
    0010_publicaciones.sql      Tabla `publicaciones` (feed de trabajos) + bucket público "publicaciones-fotos"
    0011_publicaciones_borrado.sql  Política RLS para que un trabajador borre sus propias publicaciones
    0012_publicacion_fotos.sql  Tabla `publicacion_fotos` (varias fotos por publicación, límite 6) + migra `imagen_url` existente
    0013_publicacion_likes.sql  Tabla `publicacion_likes` ("me gusta" único por usuario y publicación)
  seed.sql                    Trabajadores ficticios de prueba repartidos en varios departamentos
  functions/
    generar-perfil/           Edge Function: arma rubros/descripción/departamento con Claude (Anthropic)
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
   - `supabase/migrations/0009_rubros_multiples.sql`
   - `supabase/migrations/0010_publicaciones.sql`
   - `supabase/migrations/0011_publicaciones_borrado.sql`
   - `supabase/migrations/0012_publicacion_fotos.sql`
   - `supabase/migrations/0013_publicacion_likes.sql`
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

## Rubros múltiples

Un trabajador puede tener más de un rubro a la vez (por ejemplo, plomero y pintor). `profiles`
tiene una columna `rubros text[]` (no una tabla de relación aparte — para esta lista corta y fija
de oficios, un array alcanza y es más simple de consultar) con un índice GIN para que el filtro sea
rápido. La migración `0009_rubros_multiples.sql` reemplaza a la vieja columna `rubro` (un solo
valor): cada trabajador que ya tenía uno lo conserva como el primer elemento de su nueva lista, sin
perder datos.

`RubroChipsSelector.tsx` (en el registro y en "Editar perfil" del trabajador, tanto en modo manual
como en la caja de revisión de la IA) deja tocar varios chips a la vez — cada toque agrega o saca
ese rubro de la lista, no reemplaza la selección anterior. En el listado, la tarjeta y el perfil
muestran cada rubro del trabajador como un chip individual (`RubroChipsList.tsx`), en vez de un
texto separado por comas — así no se confunde con rubros que ya tienen "/" en su nombre (como
"Plomero / Sanitario").

El filtro por rubro del listado sigue siendo de un chip a la vez, pero ahora busca "¿este trabajador
tiene ese rubro entre los suyos?" en vez de "¿es exactamente ese?" — usa el operador `contains` de
PostgREST (`rubros=cs.{valor}`, equivalente a `@>` en Postgres), así que un trabajador con varios
rubros aparece en el filtro de cualquiera de ellos.

## Feed de trabajos (publicaciones)

La parte "red social" de la app: cada trabajador puede publicar fotos de changas ya hechas, con una
descripción corta opcional, y todos los usuarios (trabajador o cliente) ven ese feed en una pestaña
nueva. `MainTabs.tsx` alterna entre "🔨 Trabajadores" (el listado de siempre), "📸 Publicaciones" (el
feed) y, sólo para cuentas trabajador, "👤 Mi Perfil" — es un segmented control liviano sobre el stack
navigator existente, sin agregar una librería de bottom-tabs. `AppHeader.tsx` agrupa el logo (64px de
alto, centrado arriba de todo — el logo principal de la app, no un ícono chico al lado del menú; ver
`assets/logo-header.png` más abajo), `HeaderMenu.tsx` (el ícono "⋮" posicionado en la esquina, con
Premium/Mis chats/Configuración, ver más abajo) y `MainTabs.tsx` en un solo componente que usan
`WorkersListScreen.tsx`, `PublicacionesFeedScreen.tsx` y `MiPerfilScreen.tsx`, para que cambiar de
pestaña nunca haga desaparecer esos accesos.

`publicaciones` (`0010_publicaciones.sql`) tiene `trabajador_id`, `descripcion` (opcional) y
`created_at` — las fotos viven en una tabla aparte, ver la sección "Varias fotos por publicación"
más abajo. Cualquier usuario autenticado puede leer el feed completo (política de `select` abierta,
como `profiles`); solo puede insertar o borrar una fila el propio trabajador dueño
(`trabajador_id = auth.uid()`, y para insertar además su perfil debe ser de tipo `trabajador` —
`0011_publicaciones_borrado.sql` agrega la política de borrado). Las fotos viven en el bucket público
"publicaciones-fotos", con las mismas reglas que "avatars": lectura pública, escritura sólo en la
carpeta `<user_id>/...` de quien sube, y sólo si es una cuenta trabajador.

`PublicacionesFeedScreen.tsx` ordena por `created_at` descendente (el orden por premium queda para
otra etapa) y resuelve el nombre/foto de cada autor con una consulta aparte a `profiles` (mismo
patrón que `MisChatsScreen.tsx`, no hay relaciones anidadas vía PostgREST). El botón "+ Publicar un
trabajo" sólo se muestra si el perfil logueado es de tipo `trabajador`, y lleva a
`PublicarTrabajoScreen.tsx` (elegir fotos + descripción, sube con `lib/publicaciones.ts` y crea la
fila). `WorkerProfileScreen.tsx` reutiliza `PublicacionCard.tsx` sin el bloque de autor para mostrar,
en una sección "Trabajos publicados", sólo las fotos de ese trabajador.

`PublicacionCard.tsx` tiene las fotos (una o varias, ver más abajo) ocupando el ancho completo de la
tarjeta (relación 4:5, estilo Instagram) con el autor arriba y la descripción/fecha/likes abajo — ni
un cuadradito chico ni una foto a pantalla completa. En el feed (`PublicacionesFeedScreen.tsx`) se ve
igual para todos, sin ningún control de borrado especial aunque la publicación sea propia —
administrar (borrar) las propias publicaciones se hace desde "Mi Perfil" (ver más abajo), no desde
el feed. `WorkerProfileScreen.tsx` sí sigue pasándole `esPropia`/`onEliminar` cuando el propio
trabajador ve su perfil público, mostrando "Tu publicación" y un botón "Eliminar" ahí.

Borrar (desde donde sea) abre `ConfirmDialog.tsx` (un `Modal` propio, no `Alert.alert` de React
Native — en react-native-web esa API es un no-op y no muestra nada) para confirmar antes. Al
confirmar, `eliminarPublicacion()` en `lib/publicaciones.ts` hace `.delete().eq('id', …).select('id')`:
si la política RLS de borrado bloquea la fila (por ejemplo, si `0011_publicaciones_borrado.sql` no se
aplicó todavía contra el proyecto), PostgREST responde 200 sin ningún error aunque no haya borrado
nada — por eso se chequea que `data` tenga al menos una fila para considerarlo un éxito real, y si no,
se muestra un error visible y se revierte el borrado optimista en la UI (la fila no vuelve a
aparecer sola después de recargar por error, como pasaba antes de este chequeo).

## Varias fotos por publicación (carrusel)

Una publicación ya no tiene una sola foto: `publicacion_fotos` (`0012_publicacion_fotos.sql`) guarda
`publicacion_id`, `imagen_url` y `orden`, con hasta 6 filas por publicación. El límite se refuerza en
el propio Postgres (no solo en la UI): un trigger `before insert` cuenta las fotos que ya tiene esa
publicación y rechaza la fila si ya llegó a 6 — como corre fila por fila dentro de la misma
transacción, también funciona si se insertan varias de una sola vez. Las publicaciones que ya
existían (con la vieja columna `publicaciones.imagen_url`) se migran automáticamente a esta tabla
nueva como su primera foto (`orden = 0`) antes de borrar esa columna, así que no perdieron nada.

En "Publicar un trabajo" (`PublicarTrabajoScreen.tsx`), `elegirFotosDeTrabajo()` en
`lib/publicaciones.ts` abre el picker con `allowsMultipleSelection` — se pueden elegir varias fotos
de una sola vez, o ir tocando "+ Agregar" para sumar más hasta llegar a 6 (el contador "X/6" se
actualiza en cada paso, y cada foto elegida se puede sacar individualmente antes de publicar). En
web, `selectionLimit` no lo aplica el navegador (el picker nativo del sistema no tiene tope), así
que el límite también se recorta en el cliente para que valga en todas las plataformas. Al publicar,
`subirFotosDeTrabajo()` sube cada foto en orden (no en paralelo, para no perder el orden ni saturar
la conexión) y después se insertan todas las filas de `publicacion_fotos` de una vez.

`Carousel.tsx` es el componente que muestra esas fotos: un `ScrollView` horizontal con paginado, un
contador "posición/total" (por ejemplo "2/6") arriba a la derecha que se actualiza solo con el
scroll, y dos flechas ‹ › superpuestas sobre la foto para cambiar de una sin necesidad de deslizar —
pensadas para cuando se prueba desde un navegador de escritorio, donde no hay gestos táctiles. La
flecha izquierda no aparece en la primera foto ni la derecha en la última (no da la vuelta), y un
ref (`desplazandoRef`) evita que el `onScroll` pise el índice mientras corre el `scrollTo()` animado
de una flecha — sin eso, el contador parpadeaba un instante al valor anterior antes de asentarse en
el correcto. El tamaño del contenedor se fija con la propiedad de estilo `aspectRatio` (Yoga la
calcula en el mismo layout, sin esperar a un `onLayout` de ida y vuelta), y el ancho real de cada
foto individual sí se mide con `onLayout` para el cálculo de paginado — así el carrusel puede usarse
tanto en `PublicacionCard.tsx` (feed y perfil del trabajador, con `aspectRatio` 4:5) como en la
cuadrícula cuadrada de "Mis publicaciones" (`PublicacionesGrid.tsx`, con `aspectRatio` 1), con la
misma navegación por flechas/swipe y el mismo contador en los tres lugares.

## Me gusta en publicaciones

`publicacion_likes` (`0013_publicacion_likes.sql`) tiene `publicacion_id` y `usuario_id`, con un
`unique (publicacion_id, usuario_id)` — eso es lo que hace que dar like sea, literalmente, un
`insert`, y sacarlo sea un `delete`: la restricción única es la que garantiza "una vez por usuario
por publicación", no una validación aparte. Cualquier usuario logueado (cliente o trabajador) puede
dar like a cualquier publicación.

`hooks/useLikes.ts` centraliza el estado de likes (usado igual en el feed, en el perfil de un
trabajador y en la cuadrícula de "Mi Perfil"): trae de una sola consulta los likes de todas las
publicaciones visibles, calcula el conteo de cada una y si el propio usuario ya la likeó, y expone
un `alternar()` que cambia la UI al toque (optimista) antes de que responda el servidor. Si el
pedido falla, revierte ese cambio — igual que con el borrado de una publicación, `quitarLike()` en
`lib/likes.ts` chequea que el `.delete().select('id')` haya devuelto una fila antes de darlo por
bueno, para no confundir "la política RLS bloqueó el borrado" con "se sacó el like de verdad".
`LikeButton.tsx` (corazón 🤍/❤️ + contador) tiene una variante chica para el badge de la cuadrícula.

## Mi Perfil y el menú "⋮" del header

`HeaderMenu.tsx` reemplaza los links sueltos que antes vivían en el header (⭐ Premium / 💬 Mis
chats / ⚙️ Configuración) por un único ícono "⋮" arriba a la derecha que despliega un menú chico
(un `Modal` con el contenido posicionado como un dropdown, no una librería de menús). El contenido
del menú depende del tipo de cuenta: un trabajador ve las tres opciones; un cliente sólo ve "Mis
chats" y "Configuración" (nunca vio "Editar perfil" ahí — ya lo tiene dentro de Configuración). La
pantalla de Configuración en sí (`ConfiguracionScreen.tsx`) sigue teniendo Editar perfil, Términos
y Condiciones, Política de Privacidad y Cerrar sesión; lo que cambió fue de dónde saca
`tipo_usuario` para decidir si mostrar "Editar perfil": antes lo buscaba con su propio
`useFocusEffect` + `useState` (arrancando en `null` cada vez que se entraba a la pantalla, así que
el ítem tardaba un instante en aparecer — un parpadeo visible), ahora usa `useMiPerfil()` del
`ProfileContext.tsx` ya resuelto a nivel de toda la app, igual que `WorkersListScreen.tsx` y
`PublicacionesFeedScreen.tsx`, así que aparece de entrada sin ese salto.

La tercera pestaña "👤 Mi Perfil" (`MiPerfilScreen.tsx`) sólo aparece en `MainTabs.tsx` cuando el
usuario logueado es trabajador — un cliente sigue viendo nada más que "Trabajadores" y
"Publicaciones", porque ya tiene su propio "Editar perfil" en Configuración y no le hace falta un
perfil público con feed de trabajos. Muestra la misma cabecera que `WorkerProfileScreen.tsx` (foto,
nombre, `RubroChipsList.tsx`, calificación) más un botón "Editar perfil" y el estado de Premium
(vigente o no, con acceso directo a `PremiumScreen.tsx`), y abajo todas las publicaciones propias en
`PublicacionesGrid.tsx` — una cuadrícula de celdas cuadradas de 3 columnas, estilo Instagram,
distinta del layout de tarjeta completa que usa el feed. Cada celda es el mismo `Carousel.tsx` que
usa el feed (con `aspectRatio={1}`), así que también se puede navegar entre sus fotos con flechas o
swipe ahí mismo, sin necesidad de abrir la publicación en otro lado. El corazón de "me gusta" queda
abajo a la izquierda y una "✕" abajo a la derecha para borrarla (con la misma confirmación de
`ConfirmDialog.tsx`); es el único lugar de la pestaña de publicaciones donde un trabajador puede
administrar sus propias fotos.

`WorkersListScreen.tsx` y `PublicacionesFeedScreen.tsx` son rutas de un mismo stack navigator (no un
tab navigator real), así que React Navigation las mantiene montadas de fondo — pero cada una tenía su
propio `useState` + fetch de `tipo_usuario` para decidir si mostrar "Mi Perfil", arrancando en `false`
cada vez que se volvía a esa pantalla. Como ese fetch tarda un instante en resolver, la pestaña
"Mi Perfil" se ocultaba y volvía a aparecer — un parpadeo visible al cambiar entre "Trabajadores" y
"Publicaciones" (no pasaba entrando directo a "Mi Perfil", porque esa pantalla no depende de ningún
fetch para saber que el usuario es trabajador). La solución fue sacar ese dato de cada pantalla:
`ProfileContext.tsx` guarda el propio perfil una sola vez a nivel de toda la app (con un `refrescar()`
que las pantallas siguen llamando al enfocarse, para que el estado de Premium se mantenga al día), así
que `tipo_usuario` — que nunca cambia durante la sesión — está disponible de entrada sin importar
cuántas veces React Navigation vuelva a montar la pantalla.

Ese contexto por sí solo no alcanza para una recarga completa de página (F5): ahí `ProfileContext`
tiene que resolver todo desde cero, igual que al abrir la app por primera vez. Hay dos partes de ese
arranque que hay que cuidar:

- **`MainTabs.tsx` recibe una prop `cargando`** (de `ProfileContext.cargando`, reenviada por
  `AppHeader.tsx`) y, mientras esté en `true`, muestra un placeholder gris del mismo alto que el
  segmented control en vez de decidir a las apuradas si hay que mostrar 2 o 3 pestañas — así el
  cambio de "no sé todavía" a "esta cuenta es trabajador/cliente" pasa una sola vez, prolijo, en vez
  de un salto brusco.
- **`ProfileContext.tsx` espera a que `AuthContext.loading` termine** antes de decidir nada. Sin ese
  chequeo, justo después de un F5 `session` vale `null` por un instante (todavía no se resolvió
  `supabase.auth.getSession()`), indistinguible de "no hay usuario logueado" — el contexto tomaba esa
  ausencia momentánea como definitiva, resolvía `cargando=false` con `perfil=null`, y un instante
  después, apenas aparecía la sesión real, volvía a `cargando=true` para recién ahí buscar el perfil
  de verdad. Ese doble salto (cargando→no cargando→cargando de nuevo) era el parpadeo real detrás de
  la recarga completa; esperar a que `AuthContext` termine de resolver la sesión antes de tocar
  `cargando` lo elimina de raíz.

## Perfil de trabajador generado por IA

En el registro de trabajador hay una opción "Describir con IA": el trabajador escribe (o dicta)
un texto libre contando lo que hace, y la Edge Function `generar-perfil` le pide a Claude (Anthropic)
que devuelva rubros / descripción / departamento en JSON estructurado. El campo `rubros` es un
array (mínimo un elemento): si el texto menciona más de un oficio —por ejemplo "hago pintura y
trabajos de plomería"— el prompt le pide a la IA que los detecte todos, no solo el primero. El
trabajador siempre revisa y puede editar ese resultado (incluyendo tocar o destocar chips de rubro)
antes de confirmar — nunca se guarda directo.

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
- **Trabajador** → `EditarPerfilScreen.tsx`, con nombre, teléfono, foto, departamento, rubros y
  descripción precargados desde su propia fila de `profiles`. Tiene la misma opción "Describir con
  IA" que el registro: escribe un texto libre, la Edge Function `generar-perfil` sugiere
  rubros/descripción (y departamento, si lo menciona), y el trabajador revisa/edita ese resultado
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
conversación — `haContactadoAlTrabajador` en `src/lib/chat.ts`); si todavía no lo contactó, el
botón simplemente no aparece (sin aviso explicándolo — el botón "💬 Contactar" ya está justo
arriba, así que resultaba redundante). El formulario pide calificación (1 a 5 estrellas, tap para
elegir), qué trabajo le realizó y un comentario opcional. Al guardar se inserta una fila en
`resenas` asociada al trabajador y al cliente autenticado (`cliente_id = auth.uid()`, forzado por
RLS para que nadie pueda dejar una reseña en nombre de otro), el trigger existente recalcula
`calificacion_promedio` / `cantidad_resenas` del trabajador, y al volver a su perfil
(`useFocusEffect`) la nueva calificación ya se refleja en las estrellas de arriba.
`WorkerProfileScreen.tsx` no lista las reseñas una por una (esa sección, "Historial de trabajos",
se sacó porque las publicaciones ya muestran el trabajo hecho con fotos) — solo la calificación
promedio agregada, arriba del perfil.

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
- [x] Selección de rol al registrarse (trabajador / cliente), con rubros (uno o varios) y
      departamento por selector (no texto libre) y validación de teléfono
- [x] Listado de trabajadores por departamento (detección por GPS + selección manual) y rubro,
      ordenado por cercanía real (lat/lng)
- [x] Perfil completo del trabajador con descripción, calificación con estrellas y publicaciones
- [x] Reseñas de clientes (calificación promedio se actualiza sola con un trigger)
- [x] Los clientes pueden dejar reseñas desde el perfil del trabajador, solo si ya lo contactaron por chat
- [x] Chat interno entre cliente y trabajador con Supabase Realtime, y pantalla "Mis chats"
- [x] Términos y Condiciones / Política de Privacidad integrados, con aceptación obligatoria al registrarse
- [x] Generación de perfil por IA a partir de texto libre al registrarse (con revisión/edición antes de guardar)
- [x] Plan premium: prioridad en el listado + insignia "Destacado" + pantalla de activación (sin cobro real todavía)
- [x] Perfil de trabajador y de cliente editables desde la app luego del registro (con la opción de IA para trabajador)
- [x] Foto de perfil (trabajador y cliente)
- [x] Un trabajador puede tener más de un rubro, con filtro y detección por IA acordes
- [ ] Dictado por audio (hoy funciona vía el micrófono del teclado del sistema, no hay grabación propia)
- [ ] Cobro real del plan premium (Mercado Pago u otro medio) — hoy se activa sin costo para probar la lógica
