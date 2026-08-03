export function esTelefonoValido(telefono: string): boolean {
  const limpio = telefono.replace(/[\s-]/g, '');
  return /^0?\d{8,9}$/.test(limpio);
}

export function parsePrecio(valor: string): number | null {
  const normalizado = valor.trim().replace(',', '.');
  if (!normalizado) return null;
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : null;
}
