export function esTelefonoValido(telefono: string): boolean {
  const limpio = telefono.replace(/[\s-]/g, '');
  return /^0?\d{8,9}$/.test(limpio);
}
