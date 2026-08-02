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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
