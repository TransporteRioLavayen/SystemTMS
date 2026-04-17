import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../application/context/AuthContext';
import { useNotifications } from '../../application/context/NotificationsContext';
import { useSSENotifications } from '../../application/hooks/useSSENotifications';
import NotificationCenter from '../components/NotificationCenter';
import UserMenu from '../components/UserMenu';
import { LABELS } from '../../application/constants/labels';
import { Home, Menu, FileText, Package, Map, Truck, Users, Briefcase, Building, Settings, Wifi, WifiOff, Mail } from 'lucide-react';

export default function DashboardLayout() {
  const { onlineCount, hasRole } = useAuth();
  const location = useLocation();
  const notifications = useNotifications();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Conectar SSE → notificaciones globales
  useSSENotifications();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)} 
          aria-hidden="true"
        />
      )}
      
      {/* Left Sidebar */}
      <aside className={`w-64 bg-white border-r border-gray-200 flex flex-col fixed md:relative z-50 h-full transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-4 border-b border-gray-100">
          <Link to="/dashboard" className="flex items-center justify-center">
            <img src="/Logo.png" alt="Transporte Rio Lavayen" className="h-10 w-auto" />
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="space-y-1">
            <Link
              to="/dashboard"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                location.pathname === '/dashboard' 
                  ? 'bg-emerald-50 text-emerald-700 font-medium' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Home size={20} className={location.pathname === '/dashboard' ? 'text-emerald-600' : 'text-gray-400'} />
              Dashboard
            </Link>
          </div>
          <div>
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Menu</p>
            <div className="space-y-1">
              <Link
                to="/dashboard/planillas"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  location.pathname === '/dashboard/planillas' 
                    ? 'bg-emerald-50 text-emerald-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <FileText size={20} className={location.pathname === '/dashboard/planillas' ? 'text-emerald-600' : 'text-gray-400'} />
                Gestión de Planillas
              </Link>
              <Link
                to="/dashboard/cargas"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  location.pathname === '/dashboard/cargas' 
                    ? 'bg-emerald-50 text-emerald-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Package size={20} className={location.pathname === '/dashboard/cargas' ? 'text-emerald-600' : 'text-gray-400'} />
                Gestión de Cargas
              </Link>
              <Link
                to="/dashboard/hojas"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  location.pathname === '/dashboard/hojas' 
                    ? 'bg-emerald-50 text-emerald-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Map size={20} className={location.pathname === '/dashboard/hojas' ? 'text-emerald-600' : 'text-gray-400'} />
                Gestión de Hojas
              </Link>
            </div>
          </div>

          <div>
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-6">Flota</p>
            <div className="space-y-1">
              <Link
                to="/dashboard/flota/unidades"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  location.pathname === '/dashboard/flota/unidades' 
                    ? 'bg-emerald-50 text-emerald-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Truck size={20} className={location.pathname === '/dashboard/flota/unidades' ? 'text-emerald-600' : 'text-gray-400'} />
                Gestión de Unidades
              </Link>
              <Link
                to="/dashboard/flota/choferes"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  location.pathname === '/dashboard/flota/choferes' 
                    ? 'bg-emerald-50 text-emerald-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Users size={20} className={location.pathname === '/dashboard/flota/choferes' ? 'text-emerald-600' : 'text-gray-400'} />
                Gestión de Choferes
              </Link>
              <Link
                to="/dashboard/flota/terceros"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  location.pathname === '/dashboard/flota/terceros' 
                    ? 'bg-emerald-50 text-emerald-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Briefcase size={20} className={location.pathname === '/dashboard/flota/terceros' ? 'text-emerald-600' : 'text-gray-400'} />
                Gestión de Terceros
              </Link>
              <Link
                to="/dashboard/depositos"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  location.pathname === '/dashboard/depositos' 
                    ? 'bg-emerald-50 text-emerald-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Building size={20} className={location.pathname === '/dashboard/depositos' ? 'text-emerald-600' : 'text-gray-400'} />
                Gestión de Depósitos
              </Link>
            </div>
          </div>

{/* Sección Administración - Para ADMIN */}
            {hasRole('ADMIN') && (
              <div>
                <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-6">
                  Administración
                </p>
              </div>
            )}

           {/* Sección Configuración - Solo visible para ADMIN */}
           {hasRole('ADMIN') && (
             <div>
               <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-6">
                 {LABELS.sidebar.configuracion}
               </p>
               <div className="space-y-1">
                 <Link
                   to="/dashboard/configuracion/consultas"
                   className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                     location.pathname === '/dashboard/configuracion/consultas' 
                       ? 'bg-emerald-50 text-emerald-700 font-medium' 
                       : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                   }`}
                 >
                   <Mail size={20} className={location.pathname === '/dashboard/configuracion/consultas' ? 'text-emerald-600' : 'text-gray-400'} />
                   Gestión de Consultas
                 </Link>
                 <Link
                   to="/dashboard/configuracion/usuarios"
                   className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                     location.pathname === '/dashboard/configuracion/usuarios' 
                       ? 'bg-emerald-50 text-emerald-700 font-medium' 
                       : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                   }`}
                 >
                   <Settings size={20} className={location.pathname === '/dashboard/configuracion/usuarios' ? 'text-emerald-600' : 'text-gray-400'} />
                   {LABELS.userManagement.title}
                 </Link>
               </div>
             </div>
           )}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center z-10 relative">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-semibold text-gray-800 capitalize">
              {location.pathname === '/dashboard' ? 'Dashboard' : location.pathname.split('/').pop()}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {/* Online users indicator */}
            {onlineCount > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-full border border-green-200">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-medium text-green-700">{onlineCount} online</span>
              </div>
            )}
            <NotificationCenter notifications={notifications} />
            <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
            <UserMenu />
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
