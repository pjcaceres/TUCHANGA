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
  navigation/
    RootNavigator.tsx         Cambia entre stack de auth y stack de la app según la sesión
    types.ts                  Param lists de cada stack
  screens/
    LoginScreen.tsx
    RegisterScreen.tsx        Registro con selección de rol (trabajador/cliente) y rubro
    WorkersListScreen.tsx      Listado de trabajadores: filtro por departamento + rubro, ordenado por cercanía
    WorkerProfileScreen.tsx    Perfil completo: descripción, historial de trabajos y reseñas
  types/
    database.ts               Tipos generados a mano del esquema de Supabase
supabase/
  migrations/
    0001_profiles.sql         Tabla `profiles` + políticas RLS
    0002_ubicacion_y_resenas.sql  Ubicación/departamento/calificación en profiles + tabla `resenas`
  seed.sql                    Trabajadores ficticios de prueba repartidos en varios departamentos
```

## Setup

1. Creá un proyecto en [supabase.com](https://supabase.com) y copiá `.env.example` a `.env`,
   completando `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` (Project Settings → API).
2. Corré, en orden, en el SQL editor de tu proyecto (o vía `supabase db push`/`supabase db reset`
   si usás el CLI de Supabase):
   - `supabase/migrations/0001_profiles.sql`
   - `supabase/migrations/0002_ubicacion_y_resenas.sql`
   - `supabase/seed.sql` (opcional, carga trabajadores de prueba para ver el listado funcionando)
3. Instalá dependencias y arrancá la app:

   ```bash
   npm install
   npm run start
   ```

   Luego abrí la app en Expo Go (Android/iOS) o `npm run web` para probar en el navegador.

## Estado actual (MVP en progreso)

- [x] Estructura base del proyecto (Expo + TypeScript + Supabase)
- [x] Registro y login con Supabase Auth (email/contraseña)
- [x] Selección de rol al registrarse (trabajador / cliente) y rubro para trabajadores
- [x] Listado de trabajadores por departamento (detección por GPS + selección manual) y rubro,
      ordenado por cercanía real (lat/lng)
- [x] Perfil completo del trabajador con descripción, historial de trabajos y reseñas
- [x] Reseñas e historial de trabajos (calificación promedio se actualiza sola con un trigger)
- [ ] Perfil de trabajador editable desde la app (foto, descripción, precio orientativo)
- [ ] Generación de perfil por IA a partir de texto/audio libre
- [ ] Plan premium (visibilidad destacada) — el campo `es_premium` ya existe y se muestra en la tarjeta
