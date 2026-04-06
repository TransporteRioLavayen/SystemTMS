import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSignUp, useClerk } from '@clerk/clerk-react';
import apiClient from '../../infrastructure/api/client';

export default function Register() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const clerk = useClerk();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Email verification code state
  const [needsVerification, setNeedsVerification] = useState(false);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  
  const navigate = useNavigate();

  // Helper: sync user with backend after Clerk session is active
  const syncUserWithBackend = async () => {
    const session = clerk.session;
    const token = session ? await session.getToken() : null;
    if (token) {
      await apiClient.post('auth/sync-user', {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  };

  // ── Step 1: Create account ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!isLoaded) return;

      const [firstName, ...lastNameParts] = name.split(' ');
      const lastName = lastNameParts.join(' ') || ' ';

      // 1. Crear la cuenta con Clerk
      const result = await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName,
      });

      // 2. Evaluar el resultado
      if (result.status === 'complete') {
        // Sin verificación requerida — activar sesión directamente
        await setActive({ session: result.createdSessionId });
        await syncUserWithBackend();
        navigate('/dashboard');
      } else if (result.verifications?.emailAddress?.status === 'verified') {
        // Ya verificado pero faltan otros campos
        await setActive({ session: result.createdSessionId });
        await syncUserWithBackend();
        navigate('/dashboard');
      } else {
        setError('No se pudo crear la cuenta. Intentá de nuevo.');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify email code ──
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setVerifying(true);

    try {
      if (!isLoaded) return;

      const result = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        await syncUserWithBackend();
        navigate('/dashboard');
      } else {
        setError('Verificación incompleta. Contactá soporte si el problema persiste.');
      }
    } catch (err: any) {
      if (err.errors?.[0]?.code === 'code_incorrect') {
        setError('El código es incorrecto. Revisá el email e intentá de nuevo.');
      } else if (err.errors?.[0]?.code === 'code_expired') {
        setError('El código expiró. Solicitá uno nuevo.');
      } else {
        setError(extractErrorMessage(err));
      }
    } finally {
      setVerifying(false);
    }
  };

  // ── Resend verification code ──
  const handleResendCode = async () => {
    setError('');
    try {
      if (!isLoaded) return;
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setError('');
    } catch {
      setError('No se pudo reenviar el código. Intentá de nuevo.');
    }
  };

  // ── Cancel and go back ──
  const handleCancel = () => {
    setNeedsVerification(false);
    setCode('');
    setError('');
  };

  // ── Verification step UI ──
  if (needsVerification) {
    return (
      <div className="min-h-screen flex">
        <div className="flex-1 flex items-center justify-center bg-white px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">A</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Verificá tu email</h1>
              <p className="text-gray-500 mt-2 text-sm">
                Te enviamos un código a <strong>{email}</strong>
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyCode} className="space-y-5">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Código de verificación
                </label>
                <input
                  id="code"
                  type="text"
                  required
                  autoComplete="one-time-code"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-center text-2xl tracking-widest"
                  placeholder="123456"
                  maxLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={verifying || code.length < 4}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-all disabled:opacity-70 mt-2"
              >
                {verifying ? 'Verificando...' : 'Verificar'}
              </button>
            </form>

            <div className="mt-6 space-y-3 text-center">
              <button
                type="button"
                onClick={handleResendCode}
                className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Reenviar código
              </button>
              <div>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ← Volver al registro
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:block lg:flex-1 relative bg-indigo-900">
          <img
            src="https://picsum.photos/seed/trucks/1920/1080"
            alt="Logística de transporte"
            className="absolute inset-0 w-full h-full object-cover opacity-50"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="text-white max-w-lg text-center">
              <h2 className="text-4xl font-bold mb-6">Únete a nuestra plataforma</h2>
              <p className="text-lg text-indigo-100">Llevá el control total de tus cargas, choferes y unidades con nuestra solución integral.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Registration step UI ──
  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">A</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Crear una cuenta</h1>
            <p className="text-gray-500 mt-2 text-sm">Comenzá a gestionar tu flota hoy</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                Nombre completo
              </label>
              <input
                id="name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="Juan Pérez"
              />
            </div>
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
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                minLength={8}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !isLoaded}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-all disabled:opacity-70 mt-2"
            >
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-600">
            ¿Ya tenés una cuenta?{' '}
            <Link to="/login" className="text-indigo-600 font-medium hover:text-indigo-500">
              Iniciar Sesión
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block lg:flex-1 relative bg-indigo-900">
        <img
          src="https://picsum.photos/seed/trucks/1920/1080"
          alt="Logística de transporte"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-white max-w-lg text-center">
            <h2 className="text-4xl font-bold mb-6">Únete a nuestra plataforma</h2>
            <p className="text-lg text-indigo-100">Llevá el control total de tus cargas, choferes y unidades con nuestra solución integral.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──
function extractErrorMessage(err: any): string {
  if (err.errors?.[0]) {
    const clerkError = err.errors[0];
    if (clerkError.code === 'form_identifier_exists') {
      return 'Ya existe una cuenta con ese correo electrónico.';
    }
    if (clerkError.code === 'form_password_length_too_short') {
      return 'La contraseña debe tener al menos 8 caracteres.';
    }
    if (clerkError.code === 'form_password_pwned') {
      return 'Esta contraseña es demasiado común. Elegí una más segura.';
    }
    if (clerkError.longMessage) {
      return clerkError.longMessage;
    }
    return clerkError.message || 'Error al crear la cuenta';
  }
  return 'No se pudo crear la cuenta. Verificá tu conexión e intentá de nuevo.';
}
