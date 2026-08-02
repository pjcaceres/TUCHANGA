export const RUBROS = [
  { id: 'electricista', label: 'Electricista' },
  { id: 'plomero', label: 'Plomero / Sanitario' },
  { id: 'jardineria', label: 'Jardinería / Corte de pasto' },
  { id: 'limpieza', label: 'Limpieza' },
  { id: 'pintura', label: 'Pintura' },
  { id: 'gasista', label: 'Gasista' },
  { id: 'cerrajero', label: 'Cerrajero' },
  { id: 'mudanzas', label: 'Mudanzas / Fletes' },
  { id: 'otro', label: 'Otro oficio' },
] as const;

export type RubroId = (typeof RUBROS)[number]['id'];
