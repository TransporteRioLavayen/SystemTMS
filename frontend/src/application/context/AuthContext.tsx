import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useUser, useSession, useClerk } from '@clerk/clerk-react';
import { setAuthTokenGetter } from '../../infrastructure/api/client';
import apiClient from '../../infrastructure/api/client';
import { User } from '../../domain/models/User';

// Inactividad máxima antes de logout automático (30 minutos)
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Convierte el user de Clerk a nuestro modelo User.
 */
const clerkUserToModel = (clerkUser: ReturnType<typeof useUser>['user']): User | null => {
  if (!clerkUser) return null;
  return {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress || '',
    name: clerkUser.fullName || clerkUser.username || clerkUser.primaryEmailAddress?.emailAddress || '',
    bio: '',
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: clerkUser, isLoaded } = useUser();
  const { session } = useSession();
  const clerk = useClerk();
  
  const [user, setUser] = useState<User | null>(null);

  // Sincronizar el user de Clerk con nuestro estado y con Supabase
  useEffect(() => {
    if (!isLoaded || !clerkUser || !session) {
      setUser(null);
      return;
    }

    setUser(clerkUserToModel(clerkUser));

    // Sincronizar con Supabase en background (no bloqueante)
    apiClient.post('auth/sync-user').catch((err) => {
      console.warn('⚠️ No se pudo sincronizar usuario con Supabase:', err.message);
    });
  }, [isLoaded, clerkUser, session]);

  // Configurar el interceptor de Axios con el token de Clerk
  useEffect(() => {
    setAuthTokenGetter(async () => {
      return session?.getToken() ?? null;
    });
  }, [session]);

  // Logout con Clerk
  const logout = useCallback(async (): Promise<void> => {
    await clerk.signOut();
  }, [clerk]);

  // =============================================================================
  // AUTO-LOGOUT por inactividad (30 min)
  // =============================================================================
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetInactivityTimer = useCallback(() => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }
    logoutTimerRef.current = setTimeout(async () => {
      console.log('🔒 [Auth] Logout automático por inactividad (30 min)');
      await clerk.signOut();
    }, INACTIVITY_TIMEOUT_MS);
  }, [clerk]);

  useEffect(() => {
    if (!user?.id) return;

    // Reset timer on any user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'] as const;
    events.forEach((event) => window.addEventListener(event, resetInactivityTimer));
    resetInactivityTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetInactivityTimer));
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
    };
  }, [user?.id, resetInactivityTimer]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading: !isLoaded,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
