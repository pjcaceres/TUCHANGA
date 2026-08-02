import type { Departamento } from '../constants/departamentos';
import type { RubroId } from '../constants/rubros';

export type TipoUsuario = 'trabajador' | 'cliente';

export type Profile = {
  id: string;
  tipo_usuario: TipoUsuario;
  nombre: string;
  telefono: string | null;
  barrio: string | null;
  rubro: RubroId | null;
  descripcion: string | null;
  precio_orientativo: number | null;
  foto_url: string | null;
  es_premium: boolean;
  departamento: Departamento | null;
  lat: number | null;
  lng: number | null;
  calificacion_promedio: number | null;
  cantidad_resenas: number;
  created_at: string;
};

export type Resena = {
  id: string;
  trabajador_id: string;
  cliente_nombre: string;
  trabajo_descripcion: string | null;
  calificacion: number;
  comentario: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; tipo_usuario: TipoUsuario; nombre: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      resenas: {
        Row: Resena;
        Insert: Partial<Resena> & {
          trabajador_id: string;
          cliente_nombre: string;
          calificacion: number;
        };
        Update: Partial<Resena>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
