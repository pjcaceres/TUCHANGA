import { distanciaKm } from '../lib/geo';

export const DEPARTAMENTOS = [
  { nombre: 'Artigas', lat: -30.4, lng: -56.4667 },
  { nombre: 'Canelones', lat: -34.5333, lng: -56.2833 },
  { nombre: 'Cerro Largo', lat: -32.3667, lng: -54.1667 },
  { nombre: 'Colonia', lat: -34.4722, lng: -57.8433 },
  { nombre: 'Durazno', lat: -33.3667, lng: -56.5167 },
  { nombre: 'Flores', lat: -33.6833, lng: -56.8833 },
  { nombre: 'Florida', lat: -34.1, lng: -56.2167 },
  { nombre: 'Lavalleja', lat: -34.3667, lng: -55.2333 },
  { nombre: 'Maldonado', lat: -34.9011, lng: -54.9578 },
  { nombre: 'Montevideo', lat: -34.9011, lng: -56.1645 },
  { nombre: 'Paysandú', lat: -32.3214, lng: -58.0756 },
  { nombre: 'Río Negro', lat: -33.1333, lng: -58.3167 },
  { nombre: 'Rivera', lat: -30.9, lng: -55.55 },
  { nombre: 'Rocha', lat: -34.4833, lng: -54.3333 },
  { nombre: 'Salto', lat: -31.3833, lng: -57.9667 },
  { nombre: 'San José', lat: -34.3389, lng: -56.7125 },
  { nombre: 'Soriano', lat: -33.2833, lng: -58.05 },
  { nombre: 'Tacuarembó', lat: -31.7167, lng: -55.9833 },
  { nombre: 'Treinta y Tres', lat: -33.2333, lng: -54.3833 },
] as const;

export type Departamento = (typeof DEPARTAMENTOS)[number]['nombre'];

export const DEPARTAMENTO_POR_DEFECTO: Departamento = 'Montevideo';

export function departamentoMasCercano(lat: number, lng: number): Departamento {
  let masCercano: Departamento = DEPARTAMENTO_POR_DEFECTO;
  let distanciaMinima = Infinity;

  for (const departamento of DEPARTAMENTOS) {
    const distancia = distanciaKm(lat, lng, departamento.lat, departamento.lng);
    if (distancia < distanciaMinima) {
      distanciaMinima = distancia;
      masCercano = departamento.nombre;
    }
  }

  return masCercano;
}
