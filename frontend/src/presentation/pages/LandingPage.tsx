import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, Package, MapPin, Clock, Search, ChevronRight, CheckCircle, Shield, Zap, XCircle } from 'lucide-react';
import { useAuth } from '../../application/context/AuthContext';
import trackingService, { TrackingEvent, TrackingRemito } from '../../infrastructure/services/trackingService';

// =============================================================================
// ESTADOS DE ENTREGA - Definición de los 7 estados del proceso logístico
// =============================================================================
const ESTADOS_PROCESO = [
  { key: 'viaje_confirmado', label: 'En viaje', icon: Truck },
  { key: 'llegada_casa_central', label: 'En casa central', icon: Package },
  { key: 'clasificacion', label: 'Clasificación', icon: Package },
  { key: 'hoja_preparada', label: 'Preparado', icon: CheckCircle },
  { key: 'en_reparto', label: 'En reparto', icon: Truck },
  { key: 'entregado', label: 'Entregado', icon: CheckCircle },
  { key: 'entrega_rechazada', label: 'Rechazado', icon: XCircle },
];

export default function LandingPage() {
  const { user } = useAuth();

  const [trackingCode, setTrackingCode] = useState('');
  const [trackingResult, setTrackingResult] = useState<{ remito: TrackingRemito; events: TrackingEvent[] } | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener evento por tipo de evento
  const getEventByKey = (events: TrackingEvent[], key: string): TrackingEvent | undefined => {
    return events.find(e => e.evento === key);
  };

  const formatFecha = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCode.trim()) return;

    setHasSearched(true);
    setTrackingResult(null);
    setError(null);
    setLoading(true);

    try {
      const data = await trackingService.getByCode(trackingCode.trim());
      setTrackingResult(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se encontró el código de seguimiento');
      setTrackingResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Truck className="text-white" size={24} />
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">LogisPro</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#inicio" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">Inicio</a>
              <a href="#seguimiento" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">Seguimiento</a>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <Link to="/dashboard" className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                  Ir al Panel
                </Link>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
                    Iniciar Sesión
                  </Link>
                  <Link to="/register" className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="inicio" className="pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight mb-8 leading-tight">
              La logística de tu empresa, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">simplificada.</span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              Gestiona flotas, planillas de viaje, depósitos y realiza el seguimiento de tus envíos en tiempo real con nuestra plataforma integral.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="#seguimiento" className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200 flex items-center justify-center gap-2">
                <Search size={20} /> Rastrear Envío
              </a>
              {!user && (
                <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 font-bold rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm flex items-center justify-center gap-2">
                  Comenzar Gratis <ChevronRight size={20} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tracking Section */}
      <section id="seguimiento" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-indigo-600 rounded-3xl p-8 md:p-12 shadow-2xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-10">
              <Package size={200} />
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-4">Sigue tu envío en tiempo real</h2>
              <p className="text-indigo-100 mb-8 max-w-xl">Ingresa el código de seguimiento (ID de Remito) que te proporcionamos para conocer el estado exacto de tu paquete.</p>

              <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3 max-w-2xl">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="text-gray-400" size={20} />
                  </div>
                  <input
                    type="text"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    placeholder="Ej: REM-1234"
                    className="w-full pl-11 pr-4 py-4 rounded-xl text-gray-900 font-medium focus:ring-4 focus:ring-indigo-300 outline-none"
                    required
                  />
                </div>
                <button type="submit" className="px-8 py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors whitespace-nowrap shadow-lg">
                  Rastrear
                </button>
              </form>

              {hasSearched && (
                <div className="mt-10 bg-white rounded-2xl p-6 text-gray-900 shadow-xl overflow-hidden">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 mb-4">
                        <Clock className="text-indigo-500 animate-spin" size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Buscando envío...</h3>
                      <p className="text-gray-500">Consultando el estado de tu envío en tiempo real.</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
                        <Search className="text-red-500" size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Envío no encontrado</h3>
                      <p className="text-gray-500">{error}</p>
                    </div>
                  ) : trackingResult ? (
                    <div className="overflow-hidden">
                      {/* Header info */}
                      <div className="text-center mb-6">
                        <p className="text-sm font-bold text-indigo-600 mb-1">CÓDIGO: {trackingResult.remito.seguimiento}</p>
                        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${trackingResult.remito.estadoActual === 'Entregado' ? 'bg-green-100 text-green-700' :
                          trackingResult.remito.estadoActual === 'Rechazado' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                          {trackingResult.remito.estadoActual === 'Entregado' && <CheckCircle size={16} className="mr-2" />}
                          {trackingResult.remito.estadoActual === 'En reparto' && <Truck size={16} className="mr-2" />}
                          {trackingResult.remito.estadoActual}
                        </span>
                      </div>

                      {/* Timeline horizontal - sin scroll */}
                      <div className="flex items-center justify-between gap-1">
                        {ESTADOS_PROCESO.map((estado, index) => {
                          const eventoCompletado = getEventByKey(trackingResult.events, estado.key);
                          const estadoActual = trackingResult.remito.estadoActual;
                          const isRechazado = estado.key === 'entrega_rechazada';
                          const isEntregado = estado.key === 'entregado';

                          const isCompleted = eventoCompletado !== undefined;
                          const isCurrent = estado.label === estadoActual || (isRechazado && estadoActual === 'Rechazado') || (isEntregado && estadoActual === 'Entregado');

                          return (
                            <div key={estado.key} className="flex items-center flex-1">
                              {/* Estado */}
                              <div className="flex flex-col items-center flex-1 min-w-0">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${isCompleted
                                  ? 'bg-green-600 border-green-600 text-white'
                                  : isCurrent
                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                    : 'bg-white border-gray-300 text-gray-300'
                                  }`}>
                                  {isCompleted ? (
                                    <CheckCircle size={14} />
                                  ) : isCurrent ? (
                                    <estado.icon size={14} />
                                  ) : (
                                    <Clock size={14} />
                                  )}
                                </div>
                                <span className={`text-[10px] font-medium mt-1 text-center leading-tight ${isCompleted
                                  ? 'text-green-700'
                                  : isCurrent
                                    ? 'text-indigo-700'
                                    : 'text-gray-400'
                                  }`}>
                                  {estado.label}
                                </span>
                                {eventoCompletado && (
                                  <span className="text-[9px] text-gray-500 mt-0.5">
                                    {formatFecha(eventoCompletado.created_at)}
                                  </span>
                                )}
                              </div>

                              {/* Connector line */}
                              {index < ESTADOS_PROCESO.length - 1 && (
                                <div className={`h-0.5 flex-1 min-w-[8px] mx-0.5 ${isCompleted ? 'bg-green-600' : 'bg-gray-300'
                                  }`} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8 border-b border-gray-800 pb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-indigo-600 p-1.5 rounded-lg">
                  <Truck className="text-white" size={20} />
                </div>
                <span className="text-xl font-bold text-white tracking-tight">LogisPro</span>
              </div>
              <p className="text-sm max-w-sm">
                Solución integral para la gestión logística, flotas y seguimiento de envíos. Optimizando la cadena de suministro de principio a fin.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Plataforma</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#caracteristicas" className="hover:text-white transition-colors">Características</a></li>
                <li><a href="#seguimiento" className="hover:text-white transition-colors">Seguimiento</a></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Iniciar Sesión</Link></li>
                <li><Link to="/chofer" className="hover:text-white transition-colors">Portal Choferes</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Contacto</h4>
              <ul className="space-y-2 text-sm">
                <li>soporte@logispro.com</li>
                <li>+54 11 1234-5678</li>
                <li>Buenos Aires, Argentina</li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center text-sm">
            <p>&copy; {new Date().getFullYear()} LogisPro. Todos los derechos reservados.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">Términos</a>
              <a href="#" className="hover:text-white transition-colors">Privacidad</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
