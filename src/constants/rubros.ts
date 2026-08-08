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

export function rubroLabel(id: RubroId | null): string {
  return RUBROS.find((r) => r.id === id)?.label ?? 'Oficio no especificado';
}

export function rubrosLabel(ids: RubroId[]): string {
  if (ids.length === 0) return 'Oficio no especificado';
  return ids.map((id) => rubroLabel(id)).join(', ');
}
