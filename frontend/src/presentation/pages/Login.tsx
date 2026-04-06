import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSignIn, useClerk } from '@clerk/clerk-react';
import apiClient from '../../infrastructure/api/client';

export default function Login() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const clerk = useClerk();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!isLoaded) return;

      // 1. Autenticar con Clerk
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        // 2. Activar la sesión en Clerk
        await setActive({ session: result.createdSessionId });

        // 3. Obtener el token de la sesión recién activada
        const session = clerk.session;
        const token = session ? await session.getToken() : null;

        // 4. Sincronizar usuario con Supabase (backend) con token explícito
        if (token) {
          await apiClient.post('auth/sync-user', {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }

        navigate('/dashboard');
      } else {
        console.log('Sign-in status:', result.status);
        setError('Se requiere un paso adicional. Revisá tu email.');
      }
    } catch (err: any) {
      if (err.errors?.[0]) {
        const clerkError = err.errors[0];
        if (clerkError.code === 'form_password_incorrect') {
          setError('La contraseña es incorrecta. Intentá de nuevo.');
        } else if (clerkError.code === 'form_identifier_not_found') {
          setError('No existe una cuenta con ese correo electrónico.');
        } else if (clerkError.longMessage) {
          setError(clerkError.longMessage);
        } else {
          setError(clerkError.message || 'Error al iniciar sesión');
        }
      } else {
        setError('No se pudo iniciar sesión. Verificá tu conexión e intentá de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">A</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Bienvenido de vuelta</h1>
            <p className="text-gray-500 mt-2 text-sm">Ingresá tus datos para acceder a tu cuenta</p>
          </div>
          
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100" role="alert">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Correo electrónico
              </label>
              <input 
                id="email"
                type="email" 
                required 
                autoComplete="email"
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
                placeholder="tu@ejemplo.com" 
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <a href="#" className="text-xs text-indigo-600 hover:text-indigo-500 font-medium">¿Olvidaste tu contraseña?</a>
              </div>
              <input 
                id="password"
                type="password" 
                required 
                autoComplete="current-password"
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
                placeholder="••••••••" 
              />
            </div>
            <button 
              type="submit" 
              disabled={loading || !isLoaded}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-all disabled:opacity-70"
            >
              {loading ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>
          </form>
          
          <p className="mt-8 text-center text-sm text-gray-600">
            ¿No tenés una cuenta?{' '}
            <Link to="/register" className="text-indigo-600 font-medium hover:text-indigo-500">
              Registrate
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block lg:flex-1 relative bg-indigo-900">
        <img 
          src="https://picsum.photos/seed/logistics/1920/1080" 
          alt="Logística de transporte" 
          className="absolute inset-0 w-full h-full object-cover opacity-50"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-white max-w-lg text-center">
            <h2 className="text-4xl font-bold mb-6">Gestión de Flota y Logística</h2>
            <p className="text-lg text-indigo-100">Optimizá tus rutas, administrá tus unidades y controlá tus planillas de viaje en un solo lugar.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
