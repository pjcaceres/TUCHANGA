import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';
import { useAuth } from './AuthContext';

interface ProfileContextValue {
  perfil: Profile | null;
  cargando: boolean;
  refrescar: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

/**
 * Cachea el propio perfil (profiles) del usuario logueado, compartido por
 * toda la app. Existe para que `tipo_usuario` (que nunca cambia durante la
 * sesión) esté disponible de entrada en cualquier pantalla — si cada
 * pantalla lo buscara por su cuenta, cada vez que React Navigation la
 * vuelve a montar (por ejemplo al ir y volver entre las pestañas
 * "Trabajadores" y "Publicaciones") el valor arrancaría en null hasta que
 * termine el fetch, y elementos condicionados a él (como la pestaña
 * "Mi Perfil") parpadearían.
 */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [perfil, setPerfil] = useState<Profile | null>(null);
  const [cargando, setCargando] = useState(true);

  const refrescar = useCallback(async () => {
    if (!userId) {
      setPerfil(null);
      setCargando(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!error) {
      setPerfil(data ?? null);
    }
    setCargando(false);
  }, [userId]);

  useEffect(() => {
    setCargando(true);
    refrescar();
  }, [refrescar]);

  const value = useMemo(() => ({ perfil, cargando, refrescar }), [perfil, cargando, refrescar]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useMiPerfil() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useMiPerfil debe usarse dentro de un ProfileProvider');
  }
  return context;
}
