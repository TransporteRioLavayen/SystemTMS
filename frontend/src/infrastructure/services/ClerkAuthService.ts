// =============================================================================
// CLERK AUTH SERVICE
// =============================================================================
// Infrastructure Layer - Servicio de autenticación con Clerk
// Reemplaza a MockAuthService con autenticación real
//
// NOTA: Este servicio se instancia DESPUÉS de que Clerk está cargado.
// Recibe el Clerk instance desde el hook useClerk() de un componente React.

import { AuthRepository } from '../../domain/repositories/AuthRepository';
import { User } from '../../domain/models/User';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ClerkInstance = any;

/**
 * Convierte un objeto de sesión de Clerk a nuestro modelo User.
 */
const clerkToUser = (clerk: ClerkInstance): User | null => {
  const user = clerk.user;
  if (!user) return null;

  return {
    id: user.id,
    email: user.primaryEmailAddress?.emailAddress || '',
    name: user.fullName || user.username || user.primaryEmailAddress?.emailAddress || '',
    bio: '',
  };
};

export class ClerkAuthService implements AuthRepository {
  private clerk: ClerkInstance;

  constructor(clerk: ClerkInstance) {
    this.clerk = clerk;
  }

  /**
   * Inicia sesión con email y password usando Clerk.
   */
  async login(email: string, password: string): Promise<User> {
    const result = await this.clerk.client.signIn.create({
      identifier: email,
      password,
    });

    if (result.status !== 'complete') {
      throw new Error('Credenciales inválidas');
    }

    // Activar la sesión
    await this.clerk.setActive({ session: result.createdSessionId });

    const user = clerkToUser(this.clerk);
    if (!user) {
      throw new Error('No se pudo obtener la información del usuario');
    }

    return user;
  }

  /**
   * Registra un nuevo usuario con Clerk.
   */
  async register(name: string, email: string, password: string): Promise<User> {
    const [firstName, ...lastNameParts] = name.split(' ');
    const lastName = lastNameParts.join(' ') || ' ';

    const result = await this.clerk.client.signUp.create({
      emailAddress: email,
      password,
      firstName,
      lastName,
    });

    if (result.status === 'missing_requirements') {
      throw new Error('Se requiere verificación de email. Revisá tu bandeja de entrada.');
    }

    if (result.status !== 'complete') {
      throw new Error('No se pudo crear la cuenta');
    }

    // Activar la sesión
    await this.clerk.setActive({ session: result.createdSessionId });

    const user = clerkToUser(this.clerk);
    if (!user) {
      throw new Error('No se pudo obtener la información del usuario');
    }

    return user;
  }

  /**
   * Cierra la sesión con Clerk.
   */
  async logout(): Promise<void> {
    await this.clerk.signOut();
  }

  /**
   * Obtiene el usuario actual de Clerk.
   */
  async getCurrentUser(): Promise<User | null> {
    return clerkToUser(this.clerk);
  }

  /**
   * Obtiene el token de sesión de Clerk para enviar al backend.
   */
  async getToken(): Promise<string | null> {
    return this.clerk.session?.getToken() ?? null;
  }
}
