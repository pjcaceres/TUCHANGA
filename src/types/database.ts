import type { Departamento } from '../constants/departamentos';
import type { RubroId } from '../constants/rubros';

export type TipoUsuario = 'trabajador' | 'cliente';

export type Profile = {
  id: string;
  tipo_usuario: TipoUsuario;
  nombre: string;
  telefono: string | null;
  barrio: string | null;
  rubros: RubroId[];
  descripcion: string | null;
  foto_url: string | null;
  es_premium: boolean;
  premium_hasta: string | null;
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
  cliente_id: string | null;
  cliente_nombre: string;
  trabajo_descripcion: string | null;
  calificacion: number;
  comentario: string | null;
  created_at: string;
};

export type Conversacion = {
  id: string;
  cliente_id: string;
  trabajador_id: string;
  created_at: string;
};

export type Mensaje = {
  id: string;
  conversacion_id: string;
  remitente_id: string;
  contenido: string;
  leido: boolean;
  created_at: string;
};

export type Publicacion = {
  id: string;
  trabajador_id: string;
  descripcion: string | null;
  created_at: string;
};

export type PublicacionFoto = {
  id: string;
  publicacion_id: string;
  imagen_url: string;
  orden: number;
  created_at: string;
};

export type PublicacionLike = {
  id: string;
  publicacion_id: string;
  usuario_id: string;
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
      conversaciones: {
        Row: Conversacion;
        Insert: Partial<Conversacion> & { cliente_id: string; trabajador_id: string };
        Update: Partial<Conversacion>;
        Relationships: [];
      };
      mensajes: {
        Row: Mensaje;
        Insert: Partial<Mensaje> & {
          conversacion_id: string;
          remitente_id: string;
          contenido: string;
        };
        Update: Partial<Mensaje>;
        Relationships: [];
      };
      publicaciones: {
        Row: Publicacion;
        Insert: Partial<Publicacion> & { trabajador_id: string };
        Update: Partial<Publicacion>;
        Relationships: [];
      };
      publicacion_fotos: {
        Row: PublicacionFoto;
        Insert: Partial<PublicacionFoto> & { publicacion_id: string; imagen_url: string };
        Update: Partial<PublicacionFoto>;
        Relationships: [];
      };
      publicacion_likes: {
        Row: PublicacionLike;
        Insert: Partial<PublicacionLike> & { publicacion_id: string; usuario_id: string };
        Update: Partial<PublicacionLike>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
