// Debe mantenerse igual a src/constants/rubros.ts y src/constants/departamentos.ts
// (Deno no puede importar código fuera de supabase/functions al desplegar).

export const RUBROS_VALIDOS = [
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

export const DEPARTAMENTOS_VALIDOS = [
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
