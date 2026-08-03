export const PREMIUM_DIAS = 30;

interface PerfilPremium {
  es_premium: boolean;
  premium_hasta: string | null;
}

export function esPremiumVigente(perfil: PerfilPremium): boolean {
  if (!perfil.es_premium) return false;
  if (!perfil.premium_hasta) return true;
  return new Date(perfil.premium_hasta).getTime() > Date.now();
}

export function proximoVencimientoPremium(): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + PREMIUM_DIAS);
  return fecha.toISOString();
}
