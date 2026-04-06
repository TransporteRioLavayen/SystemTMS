/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-react';
import { AuthProvider, useAuth } from './application/context/AuthContext';
import { NotificationsProvider } from './application/context/NotificationsContext';
import { ToastProvider } from './application/context/ToastContext';
import { PlanillasProvider } from './application/context/PlanillasContext';
import { FlotaProvider } from './application/context/FlotaContext';
import { TercerosProvider } from './application/context/TercerosContext';
import { HojasDeRutaProvider } from './application/context/HojasDeRutaContext';
import { RealtimeProvider } from './application/context/RealtimeContext';
import Login from './presentation/pages/Login';
import Register from './presentation/pages/Register';
import DashboardLayout from './presentation/layouts/DashboardLayout';
import Dashboard from './presentation/pages/Dashboard';
import Profile from './presentation/pages/Profile';
import GestionPlanillas from './presentation/pages/GestionPlanillas';
import GestionCargas from './presentation/pages/GestionCargas';
import GestionHojas from './presentation/pages/GestionHojas';
import GestionDepositos from './presentation/pages/GestionDepositos';
import GestionUnidades from './presentation/pages/GestionUnidades';
import GestionChoferes from './presentation/pages/GestionChoferes';
import GestionTerceros from './presentation/pages/GestionTerceros';
import ChoferView from './presentation/pages/ChoferView';
import LandingPage from './presentation/pages/LandingPage';
import TrackingPage from './presentation/pages/TrackingPage';

// =============================================================================
// CLERK PUBLISHABLE KEY
// =============================================================================
// Esta variable DEBE estar definida en tu .env como VITE_CLERK_PUBLISHABLE_KEY
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error(
    'Falta VITE_CLERK_PUBLISHABLE_KEY en el .env.\n' +
    'Obtené tu clave en: https://dashboard.clerk.com > API Keys'
  );
}

// =============================================================================
// ROUTE GUARDS
// =============================================================================

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// =============================================================================
// DASHBOARD PROVIDERS — Solo se montan cuando el usuario está autenticado
// =============================================================================
// Esto evita que los Contexts hagan llamadas a la API antes del login.
function DashboardProviders({ children }: { children: React.ReactNode }) {
  return (
    <RealtimeProvider>
      <NotificationsProvider>
        <PlanillasProvider>
          <FlotaProvider>
            <TercerosProvider>
              <HojasDeRutaProvider>
                {children}
              </HojasDeRutaProvider>
            </TercerosProvider>
          </FlotaProvider>
        </PlanillasProvider>
      </NotificationsProvider>
    </RealtimeProvider>
  );
}

// =============================================================================
// APP ROUTES
// =============================================================================

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/chofer" element={<ChoferView />} />
      <Route path="/tracking" element={<TrackingPage />} />
      <Route path="/tracking/:code" element={<TrackingPage />} />
      
      <Route path="/dashboard" element={<ProtectedRoute><DashboardProviders><DashboardLayout /></DashboardProviders></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="planillas" element={<GestionPlanillas />} />
        <Route path="cargas" element={<GestionCargas />} />
        <Route path="hojas" element={<GestionHojas />} />
        <Route path="depositos" element={<GestionDepositos />} />
        <Route path="flota/unidades" element={<GestionUnidades />} />
        <Route path="flota/choferes" element={<GestionChoferes />} />
        <Route path="flota/terceros" element={<GestionTerceros />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// =============================================================================
// APP — ClerkProvider envuelve toda la app
// =============================================================================

export default function App() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <AppRoutes />
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ClerkProvider>
  );
}
