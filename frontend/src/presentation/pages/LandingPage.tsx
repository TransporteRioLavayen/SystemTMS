import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Truck, Package, MapPin, Clock, Search, ChevronRight, CheckCircle, Shield, Zap, XCircle, Calculator, ArrowRight, Warehouse, Route, Building2, Users, Box, Scale, Car, Mail, Phone, Send } from 'lucide-react';
import { useAuth } from '../../application/context/AuthContext';
import { useToast } from '../../application/context/ToastContext';
import trackingService, { TrackingEvent, TrackingRemito } from '../../infrastructure/services/trackingService';
import consultaService from '../../infrastructure/services/consultaService';
import cotizacionService from '../../infrastructure/services/cotizacionService';
import { Map, MapControls, MapMarker, MarkerContent, MarkerTooltip } from '../../components/ui/map';
import { PhoneInput } from '../../components/ui/phone-input';

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

// =============================================================================
// MARQUEE DE DEPOSITOS - Items para la animación infinita
// =============================================================================
const MARQUEE_ITEMS = [
  { icon: Truck, text: 'Nuevas Unidades', color: 'from-emerald-500 to-emerald-600' },
  { icon: Search, text: 'Seguimiento de Envios', color: 'from-emerald-400 to-emerald-500' },
  { icon: Route, text: 'Nuevos Destinos', color: 'from-emerald-500 to-emerald-700' },
  { icon: Calculator, text: 'Consulta de Precios', color: 'from-emerald-600 to-emerald-500' },
  { icon: Warehouse, text: 'Nuevos Depositos', color: 'from-emerald-400 to-emerald-600' },
  { icon: Zap, text: 'Servicios Exclusivos', color: 'from-emerald-500 to-emerald-400' },
];

// =============================================================================
// COLORES POR ZONA - Para los marcadores del mapa y cards
// =============================================================================
const ZONA_COLORS: Record<number, { bg: string; text: string; marker: string; gradient: string; border: string }> = {
  1: { bg: 'bg-emerald-600', text: 'text-emerald-600', marker: '#10b981', gradient: 'from-emerald-50 to-emerald-100', border: 'border-emerald-200' },
  2: { bg: 'bg-green-600', text: 'text-green-600', marker: '#22c55e', gradient: 'from-green-50 to-green-100', border: 'border-green-200' },
  3: { bg: 'bg-teal-600', text: 'text-teal-600', marker: '#14b8a6', gradient: 'from-teal-50 to-teal-100', border: 'border-teal-200' },
  4: { bg: 'bg-lime-600', text: 'text-lime-600', marker: '#84cc16', gradient: 'from-lime-50 to-lime-100', border: 'border-lime-200' },
};

// =============================================================================
// AGRUPAR LOCALIDADES POR ZONA
// =============================================================================
function groupLocalitiesByZone(localities: any[]): Record<number, any[]> {
  const grouped: Record<number, any[]> = {};
  for (const loc of localities) {
    const zoneNum = loc.zonaNumero || loc.zona_numero || 1;
    if (!grouped[zoneNum]) grouped[zoneNum] = [];
    grouped[zoneNum].push(loc);
  }
  return grouped;
}

export default function LandingPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [trackingCode, setTrackingCode] = useState('');
  const [trackingResult, setTrackingResult] = useState<{ remito: TrackingRemito; events: TrackingEvent[] } | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cotizador state
  const [cotOrigen, setCotOrigen] = useState(''); // Depósito de Origen
  const [cotZona, setCotZona] = useState(''); // Zona de Destino
  const [cotLocalidad, setCotLocalidad] = useState(''); // Localidad de Destino
  const [cotTipoCarga, setCotTipoCarga] = useState(''); // Tipo de Carga

  // Nuevos campos del cotizador
  const [cotCantidad, setCotCantidad] = useState('1'); // Cantidad
  const [cotValorDeclarado, setCotValorDeclarado] = useState(''); // Valor Declarado
  const [cotSolicitarIva, setCotSolicitarIva] = useState(false);
  const [cotDomicilio, setCotDomicilio] = useState(false);

  // Flujo del cotizador
  const [cotStep, setCotStep] = useState<1 | 2 | 3 | 4>(1); // 1=formulario, 2=resumen, 3=confirmar datos, 4=confirmado
  const [cotResultado, setCotResultado] = useState<{ precio: number; iva: number; total: number } | null>(null);
  const [cotDni, setCotDni] = useState('');
  const [cotNombre, setCotNombre] = useState('');
  const [cotApellido, setCotApellido] = useState('');
  const [cotWhatsapp, setCotWhatsapp] = useState('');
  const [cotLoading, setCotLoading] = useState(false); // Previene doble click en consultar precios

  // Depósitos - desde API
  const [depositosCount, setDepositosCount] = useState<number>(0);
  const [depositosData, setDepositosData] = useState<any[]>([]);

  // Zonas
  const [zonasData, setZonasData] = useState<any[]>([]);

  // Localidades - desde API de pricing
  const [localidadesData, setReferenciasData] = useState<any[]>([]);

  // Localidades con zona - para sección Servicios y mapa
  const [localidadesZonaData, setReferenciasZonaData] = useState<any[]>([]);

  // Tipos de Carga - desde API de pricing
  const [tiposCargaData, setTiposCargaData] = useState<any[]>([]);

  // Factores de cálculo (IVA, Seguro, etc.) - desde API de pricing
  const [factoresData, setFactoresData] = useState<any[]>([]);

  // Tarifas para el cotizador - desde API de pricing
  const [tarifasData, setTarifasData] = useState<any[]>([]);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactQueryType, setContactQueryType] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSent, setContactSent] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

  // Fetch depósitos y zonas desde JSON locales (público - no requiere API)
  useEffect(() => {
    const fetchDepositos = async () => {
      try {
        const response = await fetch('/depositos.json');
        if (response.ok) {
          const data = await response.json();
          const depositos = data || [];
          setDepositosCount(depositos.length);
          setDepositosData(depositos);
          console.log('Depositos loaded:', depositos.length);
        } else {
          console.error('Error fetching depositos:', response.status);
        }
      } catch (err) {
        console.error('Error fetching depositos:', err);
      }
    };

    const fetchReferencias = async () => {
      try {
        const response = await fetch('/localidades.json');
        if (response.ok) {
          const data = await response.json();
          setReferenciasData(data);
          setReferenciasZonaData(data);
        }
      } catch {
        // Si falla, array vacío
      }
    };

    const fetchZonas = async () => {
      try {
        const response = await fetch('/zonas.json');
        if (response.ok) {
          const data = await response.json();
          setZonasData(data);
        }
      } catch {
        // Si falla, array vacío
      }
    };

    const fetchTarifas = async () => {
      try {
        // Obtener tarifas desde JSON local (público)
        const response = await fetch('/tarifas.json');
        if (response.ok) {
          const data = await response.json();
          setTarifasData(data || []);
        }
      } catch {
        // Si falla, array vacío
      }
    };

    const fetchTiposCarga = async () => {
      try {
        const response = await fetch('/cargo-types.json');
        if (response.ok) {
          const data = await response.json();
          setTiposCargaData(data || []);
        }
      } catch {
        // Si falla, array vacío
      }
    };

    const fetchFactores = async () => {
      try {
        const response = await fetch('/factores.json');
        if (response.ok) {
          const data = await response.json();
          setFactoresData(data || []);
        }
      } catch {
        // Si falla, array vacío
      }
    };

    // Llamar a todas las funciones de fetch
    fetchDepositos();
    fetchZonas();
    fetchReferencias();
    fetchTarifas();
    fetchTiposCarga();
    fetchFactores();
  }, []);

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

  const handleCotizar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (cotStep === 1) {
      try {
        // Guardar la cotización en la base de datos
        await cotizacionService.createCotizacion({
          depositoOrigen: cotOrigen,
          zonaDestino: parseInt(cotZona) || 1,
          localidadDestino: cotLocalidad,
          tipoCarga: cotTipoCarga,
          cantidad: parseInt(cotCantidad) || 1,
          valorDeclarado: parseFloat(cotValorDeclarado) || 0,
          incluirIva: cotSolicitarIva,
          entregaDomicilio: cotDomicilio,
        });

        // Enviar directamente por WhatsApp al número de la empresa
        const numeroWhatsApp = '5491133661972';

        // Construir mensaje con los datos de la cotización
        const mensaje = `*Nueva Consulta de Cotización*%0A%0A` +
          `📦 *Origen:* ${cotOrigen}%0A` +
          `📍 *Destino:* ${cotLocalidad} (Zona ${cotZona})%0A` +
          `📋 *Tipo de Carga:* ${cotTipoCarga}%0A` +
          `📊 *Cantidad:* ${cotCantidad}%0A` +
          `💰 *Valor Declarado:* $${parseFloat(cotValorDeclarado || '0').toLocaleString('es-AR')}%0A` +
          `${cotDomicilio ? '🏠 *Entrega a Domicilio:* Sí%0A' : ''}` +
          `${cotSolicitarIva ? '📄 *IVA:* Incluido%0A' : ''}` +
          `%0APor favor, envíenme la cotización detallada.`;

        // Abrir WhatsApp con el mensaje
        const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensaje}`;
        window.open(urlWhatsApp, '_blank');

        // Resetear el formulario para otra consulta
        toast.success('Cotización guardada. Redirigiendo a WhatsApp...');
        resetCotizador();
      } catch (error) {
        console.error('Error guardando cotización:', error);
        toast.error('Error al guardar la cotización. Intenta nuevamente.');
      }
    } else if (cotStep === 3) {
      // Confirmar datos
      console.log('Confirmando:', { cotDni, cotNombre, cotApellido, cotWhatsapp, cotResultado });
      setCotStep(4);
    }
  };

  const resetCotizador = () => {
    setCotStep(1);
    setCotResultado(null);
    setCotOrigen('');
    setCotZona('');
    setCotLocalidad('');
    setCotTipoCarga('');
    setCotCantidad('1');
    setCotValorDeclarado('');
    setCotSolicitarIva(false);
    setCotDomicilio(false);
    setCotDni('');
    setCotNombre('');
    setCotApellido('');
    setCotWhatsapp('');
    setCotLoading(false);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contactName || !contactEmail || !contactQueryType || !contactMessage) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    setContactLoading(true);
    try {
      await consultaService.createConsulta({
        nombre: contactName,
        email: contactEmail,
        telefono: contactPhone,
        tipoConsulta: contactQueryType as any,
        mensaje: contactMessage,
      });

      toast.success('Consulta enviada exitosamente. Te responderemos pronto.');
      setContactSent(true);

      setTimeout(() => {
        setContactSent(false);
        setContactName('');
        setContactEmail('');
        setContactPhone('');
        setContactQueryType('');
        setContactMessage('');
      }, 3000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al enviar la consulta. Intenta nuevamente.';
      toast.error(errorMsg);
      console.error('Error enviando consulta:', err);
    } finally {
      setContactLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center">
              <img src="/Logo.png" alt="Transporte Rio Lavayen" className="h-16 w-auto" />
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <a href="#inicio" className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors">Inicio</a>
              <a href="#seguimiento" className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors">Seguimiento</a>
              <a href="#cotizaciones" className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors">Cotizaciones</a>
              <a href="#servicios" className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors">Servicios</a>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <Link to="/dashboard" className="hidden sm:flex px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">
                  Ir al Panel
                </Link>
              ) : (
                <a href="#contacto" className="hidden sm:flex px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">
                  Contacto
                </a>
              )}

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 py-4 px-4 space-y-2 shadow-xl animate-in slide-in-from-top duration-300">
            <a href="#inicio" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 text-base font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-all">Inicio</a>
            <a href="#seguimiento" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 text-base font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-all">Seguimiento</a>
            <a href="#cotizaciones" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 text-base font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-all">Cotizaciones</a>
            <a href="#servicios" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 text-base font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-all">Servicios</a>
            <div className="pt-4 border-t border-gray-100">
              {user ? (
                <Link to="/dashboard" className="w-full flex items-center justify-center px-5 py-4 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-100">
                  Ir al Panel
                </Link>
              ) : (
                <a href="#contacto" onClick={() => setIsMobileMenuOpen(false)} className="w-full flex items-center justify-center px-5 py-4 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-100">
                  Contacto
                </a>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section - Original con imágenes placeholder */}
      <section id="inicio" className="pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Columna izquierda: texto + botones */}
            <div className="text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-semibold mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                </span>
                Más de 30 años de trayectoria
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight mb-6 lg:mb-8 leading-tight">
                Transporte Rio Lavayen: <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-500">Liderazgo y Confianza.</span>
              </h1>
              <p className="text-lg lg:text-xl text-gray-600 mb-8 lg:mb-10 leading-relaxed">
                Con más de tres décadas de experiencia, garantizamos la logística más eficiente para tu empresa con las <strong>mejores tarifas del mercado</strong> y seguimiento en tiempo real.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <a href="#seguimiento" className="w-full sm:w-auto px-8 py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-200 flex items-center justify-center gap-2">
                  <Search size={20} /> Rastrear Envío
                </a>
                <a href="#cotizaciones" className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 font-bold rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm flex items-center justify-center gap-2">
                  Consultar Precios <ChevronRight size={20} />
                </a>
              </div>
            </div>

            {/* Columna derecha: imágenes reales */}
            <div className="hidden lg:flex flex-col gap-4">
              <div className="bg-gray-100 rounded-2xl overflow-hidden aspect-video relative group shadow-2xl">
                <img
                  src="/transporteriolavayen20262.png"
                  alt="Transporte Rio Lavayen"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-100 rounded-xl overflow-hidden aspect-square relative shadow-lg">
                  <img
                    src="/transporteriolavayen2026.png"
                    alt="Centro Logístico"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <div className="bg-gray-100 rounded-xl overflow-hidden aspect-square relative shadow-lg">
                  <img
                    src="/transporteriolavayen20261.png"
                    alt="Flota de Transporte"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee de Depósitos - Animación infinita */}
      <section className="py-6 bg-gradient-to-r from-emerald-600 via-emerald-600 to-emerald-600 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="flex items-center gap-3 mx-8 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                <Icon size={20} className="text-white" />
                <span className="text-white font-bold text-sm">
                  {item.text}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tracking Section */}
      <section id="seguimiento" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-emerald-600 rounded-3xl p-8 md:p-12 shadow-2xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-10">
              <Package size={200} />
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-4">Sigue tu envío en tiempo real</h2>
              <p className="text-emerald-100 mb-8 max-w-xl">Ingresa el código de seguimiento que te enviamos por whatsapp para conocer el estado exacto de tu paquete.</p>

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
                    className="w-full pl-11 pr-4 py-4 rounded-xl bg-white text-gray-900 font-medium placeholder:text-gray-700 focus:ring-4 focus:ring-emerald-300 outline-none"
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
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 mb-4">
                        <Clock className="text-emerald-500 animate-spin" size={24} />
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
                        <p className="text-sm font-bold text-emerald-600 mb-1">CÓDIGO: {trackingResult.remito.seguimiento}</p>
                        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${trackingResult.remito.estadoActual === 'Entregado' ? 'bg-green-100 text-green-700' :
                          trackingResult.remito.estadoActual === 'Rechazado' ? 'bg-red-100 text-red-700' :
                            'bg-emerald-100 text-emerald-700'
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
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
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
                                    ? 'text-emerald-700'
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

      {/* Cotizaciones Section - 2 columnas: izquierda=textos, derecha=formulario */}
      <section id="cotizaciones" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Columna izquierda: textos */}
            <div className="text-left pt-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full mb-6">
                <Calculator size={16} className="text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-700">Garantía de Mejor Precio</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
                Ahorrá en cada envío con nuestras <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-500">tarifas imbatibles</span>
              </h2>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-gray-700">
                  <CheckCircle size={20} className="text-green-500" />
                  <span>Precios transparentes sin costos ocultos</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <CheckCircle size={20} className="text-green-500" />
                  <span>Cobertura nacional completa</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <CheckCircle size={20} className="text-green-500" />
                  <span>Entrega en 24/48/72 horas según tipo</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <CheckCircle size={20} className="text-green-500" />
                  <span>Seguimiento en tiempo real</span>
                </li>
              </ul>
            </div>

            {/* Columna derecha: formulario */}
            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-gray-100">
              {cotStep === 4 ? (
                // Paso 4 (FINAL): Confirmación enviada
                <div className="text-center py-8">
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={40} className="text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Cotización enviada!</h3>
                  <p className="text-gray-600 mb-6">
                    Recibirás la cotización por WhatsApp al número: <strong>{cotWhatsapp}</strong>
                  </p>
                  <button
                    onClick={resetCotizador}
                    className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                  >
                    Volver a Consultar Precios
                  </button>
                </div>
              ) : cotStep === 3 ? (
                // Paso 3: Confirmar datos (sin resumen)
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-4">Confirmá tus datos</h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
                        <input
                          type="text"
                          value={cotDni}
                          onChange={(e) => setCotDni(e.target.value)}
                          placeholder="12.345.678"
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 font-medium placeholder:text-gray-400 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                        <input
                          type="text"
                          value={cotNombre}
                          onChange={(e) => setCotNombre(e.target.value)}
                          placeholder="Juan"
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 font-medium placeholder:text-gray-400 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                        <input
                          type="text"
                          value={cotApellido}
                          onChange={(e) => setCotApellido(e.target.value)}
                          placeholder="Pérez"
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 font-medium placeholder:text-gray-400 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                        <PhoneInput
                          value={cotWhatsapp}
                          onChange={setCotWhatsapp}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCotizar()}
                    className="w-full px-8 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={20} /> Confirmar
                  </button>
                </div>
              ) : cotStep === 2 && cotResultado ? (
                // Paso 2: Resumen + Enviar WhatsApp
                <div className="space-y-6">
                  {/* Resultado del precio */}
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-50 rounded-2xl p-6 border border-emerald-100">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">Resumen de Cotización</h4>
                    <div className="space-y-2 text-gray-700">
                      <div className="flex justify-between">
                        <span>Depósito de Origen:</span>
                        <span className="font-medium">{cotOrigen}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Zona de Destino:</span>
                        <span className="font-medium">Zona {cotZona}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Localidad:</span>
                        <span className="font-medium">{cotLocalidad}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tipo de Carga:</span>
                        <span className="font-medium capitalize">{cotTipoCarga}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cantidad:</span>
                        <span className="font-medium">{cotCantidad}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Valor Declarado:</span>
                        <span className="font-medium">${parseFloat(cotValorDeclarado || '0').toLocaleString('es-AR')}</span>
                      </div>
                      {cotDomicilio && (
                        <div className="flex justify-between">
                          <span>Entrega a Domicilio:</span>
                          <span className="font-medium text-green-600">Sí</span>
                        </div>
                      )}
                      {cotSolicitarIva && (
                        <div className="flex justify-between">
                          <span>IVA:</span>
                          <span className="font-medium text-green-600">Incluido</span>
                        </div>
                      )}
                      <div className="border-t border-emerald-200 pt-2 mt-2">
                        <div className="flex justify-between text-sm">
                          <span>Base:</span>
                          <span>${cotResultado.precio.toLocaleString('es-AR')}</span>
                        </div>
                        {cotResultado.iva > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>IVA (21%):</span>
                            <span>${cotResultado.iva.toLocaleString('es-AR')}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-lg font-bold text-emerald-700 mt-2">
                          <span>Total:</span>
                          <span>${cotResultado.total.toLocaleString('es-AR')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCotStep(3)}
                    className="w-full px-8 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={20} /> Enviar por WhatsApp
                  </button>
                </div>
              ) : (
                // Paso 1: Consulta de precio
                <form onSubmit={handleCotizar} className="space-y-4">
                  {/* Fila 1: Depósito de Origen, Zona de Destino */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Depósito de Origen</label>
                      <select
                        value={cotOrigen}
                        onChange={(e) => setCotOrigen(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none transition-all"
                        required
                      >
                        <option value="">Seleccionar...</option>
                        {(depositosData || []).filter(d => d.estado === 'activo').map((dep) => (
                          <option key={dep.id} value={dep.nombre}>
                            {dep.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Zona de Destino</label>
                      <select
                        value={cotZona}
                        onChange={(e) => {
                          setCotZona(e.target.value);
                          // Resetear localidad cuando cambia la zona
                          setCotLocalidad('');
                        }}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none transition-all"
                        required
                      >
                        <option value="">Seleccionar...</option>
                        {zonasData.map((zona) => (
                          <option key={zona.numero} value={zona.numero}>
                            {zona.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Fila 2: Localidad de Destino, Tipo de Carga */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Localidad de Destino</label>
                      <select
                        value={cotLocalidad}
                        onChange={(e) => setCotLocalidad(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none transition-all"
                        required
                        disabled={!cotZona}
                      >
                        <option value="">{cotZona ? 'Seleccionar...' : 'Seleccioná una zona primero'}</option>
                        {localidadesData
                          .filter(loc => !cotZona || loc.zonaNumero === parseInt(cotZona))
                          .map((loc) => (
                            <option key={loc.id} value={loc.nombre}>
                              {loc.nombre}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Carga</label>
                      <select
                        value={cotTipoCarga}
                        onChange={(e) => setCotTipoCarga(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none transition-all"
                        required
                      >
                        <option value="">Seleccionar...</option>
                        {tiposCargaData.map((tipo) => (
                          <option key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Fila 3: Cantidad, Valor Declarado */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Cantidad</label>
                      <input
                        type="number"
                        value={cotCantidad}
                        onChange={(e) => setCotCantidad(e.target.value)}
                        placeholder="1"
                        min="1"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Valor Declarado ($)</label>
                      <input
                        type="number"
                        value={cotValorDeclarado}
                        onChange={(e) => setCotValorDeclarado(e.target.value)}
                        placeholder="Ej: 10000"
                        min="0"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Fila 4: Checkboxes */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 py-3">
                      <input
                        type="checkbox"
                        id="iva"
                        checked={cotSolicitarIva}
                        onChange={(e) => setCotSolicitarIva(e.target.checked)}
                        className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <label htmlFor="iva" className="text-sm font-semibold text-gray-700">Incluir IVA</label>
                    </div>
                    <div className="flex items-center gap-2 py-3">
                      <input
                        type="checkbox"
                        id="domicilio"
                        checked={cotDomicilio}
                        onChange={(e) => setCotDomicilio(e.target.checked)}
                        className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <label htmlFor="domicilio" className="text-sm font-semibold text-gray-700">Entrega a Domicilio</label>
                    </div>
                  </div>

                  {/* Botón: Consultar Precios */}
                  <button
                    type="submit"
                    className="w-full px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-200 flex items-center justify-center gap-2"
                  >
                    <Calculator size={18} /> Consultar Precios
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Marquee de Depósitos - Duplicado después de Cotizaciones */}
      <section className="py-6 bg-gradient-to-r from-emerald-600 via-emerald-600 to-emerald-600 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="flex items-center gap-3 mx-8 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                <Icon size={20} className="text-white" />
                <span className="text-white font-bold text-sm">
                  {item.text}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Sección Servicios - 2 columnas: izquierda=mapa, derecha=4 cards */}
      <section id="servicios" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Nuestros <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-500">Servicios y Alcance</span>
            </h2>
            <p className="text-lg text-gray-600">
              Soluciones logísticas integrales adaptadas a tus necesidades. Buenos Aires, Cordoba, Rosario, Salta y Jujuy, explorá el mapa y conocé exactamente donde estamos.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Columna izquierda: Mapa con depósitos y localidades */}
            <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 h-[500px]">
              <Map center={[-62, -28]} zoom={4} scrollZoom={true} renderWorldCopies={true}>
                <MapControls showFullscreen />

                {/* Marcadores de depósitos (rojo) */}
                {(depositosData || []).filter(d => d.estado === 'activo').map((dep) => (
                  <MapMarker
                    key={`dep-${dep.id}`}
                    longitude={Number(dep.lng) || -64}
                    latitude={Number(dep.lat) || -24}
                  >
                    <MarkerContent>
                      <div
                        className="cursor-pointer transform hover:scale-110 transition-transform"
                        style={{ width: 40, height: 40 }}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-full h-full drop-shadow-lg"
                        >
                          <path
                            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                            fill="#DC2626"
                          />
                          <circle cx="12" cy="9" r="3" fill="white" />
                        </svg>
                      </div>
                    </MarkerContent>
                    <MarkerTooltip offset={25} className="bg-white text-gray-900 border rounded-lg shadow-xl p-3 min-w-[200px]">
                      <div className="space-y-2">
                        <p className="font-bold text-gray-900">{dep.nombre}</p>
                        <p className="text-xs text-gray-500">{dep.ubicacion}</p>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${dep.lat},${dep.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <MapPin size={12} /> Ir a Google Maps
                        </a>
                      </div>
                    </MarkerTooltip>
                  </MapMarker>
                ))}

                {/* Marcadores de localidades por zona (colores diferenciados) */}
                {(localidadesZonaData || []).filter(l => l.estado === 'activo').map((loc) => {
                  const zoneNum = loc.zonaNumero || loc.zona_numero || 1;
                  const color = ZONA_COLORS[zoneNum]?.marker || '#4F46E5';
                  return (
                    <MapMarker
                      key={`loc-${loc.id}`}
                      longitude={Number(loc.lng) || -64}
                      latitude={Number(loc.lat) || -24}
                    >
                      <MarkerContent>
                        <div
                          className="cursor-pointer transform hover:scale-110 transition-transform"
                          style={{ width: 24, height: 24 }}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-full h-full drop-shadow-md"
                          >
                            <path
                              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                              fill={color}
                            />
                            <circle cx="12" cy="9" r="2" fill="white" />
                          </svg>
                        </div>
                      </MarkerContent>
                      <MarkerTooltip offset={20} className="bg-white text-gray-900 border rounded-lg shadow-xl p-2 min-w-[150px]">
                        <div className="space-y-1">
                          <p className="font-semibold text-sm">{loc.nombre}</p>
                          <p className="text-xs text-gray-500">Zona {zoneNum}: {loc.zonaNombre || loc.zona_nombre}</p>
                        </div>
                      </MarkerTooltip>
                    </MapMarker>
                  );
                })}
              </Map>
            </div>

            {/* Columna derecha: 4 cards de servicios con localidades por zona */}
            <div className="space-y-3">
              {(() => {
                const grouped = groupLocalitiesByZone(localidadesZonaData);
                return zonasData.slice(0, 4).map((zona, index) => {
                  const zoneNum = zona.numero || index + 1;
                  const colors = ZONA_COLORS[zoneNum] || ZONA_COLORS[1];
                  const localities = grouped[zoneNum] || [];
                  const mainLocalities = localities.slice(0, 4);
                  const remainingCount = localities.length - 4;

                  return (
                    <div
                      key={zona.id || zoneNum}
                      className={`rounded-xl p-4 border hover:shadow-md transition-shadow bg-gradient-to-br ${colors.gradient} ${colors.border}`}
                    >
                      {/* Header con zona y cantidad */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.bg}`}>
                          <MapPin size={20} className="text-white" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-gray-900">{zona.nombre}</h3>
                          <p className="text-xs text-gray-600">{localities.length} localidades</p>
                        </div>
                      </div>

                      {/* Lista de localidades principales - máximo 4 */}
                      <div className="flex flex-wrap gap-1.5">
                        {mainLocalities.map((loc, i) => (
                          <span
                            key={loc.id || i}
                            className="px-2 py-0.5 bg-white/70 rounded text-xs font-medium text-gray-700"
                          >
                            {loc.nombre}
                          </span>
                        ))}
                        {remainingCount > 0 && (
                          <span className="px-2 py-0.5 bg-white/70 rounded text-xs font-semibold text-gray-500">
                            +{remainingCount}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </section>

      {/* Sección Contacto */}
      <section id="contacto" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Contactanos <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-500">ahora</span>
            </h2>
            <p className="text-lg text-gray-600">
              Estamos listos para ayudarte. Escribinos y te respondemos en breve.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Columna izquierda: información de contacto */}
            <div className="space-y-8">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Información de contacto</h3>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <Mail size={22} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email Casa Central</p>
                      <p className="font-semibold text-gray-900">tteriolavayen.sanpedro@gmail.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <Phone size={22} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Teléfono Casa Central</p>
                      <p className="font-semibold text-gray-900">+549 3888 446213</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <MapPin size={22} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Dirección Casa Central</p>
                      <p className="font-semibold text-gray-900">La Urbana S/N, Ex Parque Industrial, San Pedro de Jujuy</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-600 to-emerald-600 rounded-2xl p-8 text-white">
                <h3 className="text-xl font-bold mb-4">¿Por qué elegirnos?</h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-yellow-300" />
                    <span>Atención personalizada 24/7</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-yellow-300" />
                    <span>Cobertura nacional</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-yellow-300" />
                    <span>Precios competitivos</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-yellow-300" />
                    <span>Seguimiento en tiempo real</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Columna derecha: formulario de contacto */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              {contactSent ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} className="text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">¡Mensaje enviado!</h3>
                  <p className="text-gray-600">Gracias por contactarnos. Te responderemos pronto.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  {/* FILA 1: Nombre Completo + WhatsApp */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre completo</label>
                      <input
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Tu nombre"
                        className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 font-medium placeholder:text-gray-400 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">WhatsApp</label>
                      <PhoneInput
                        value={contactPhone}
                        onChange={setContactPhone}
                      />
                    </div>
                  </div>

                  {/* FILA 2: Email + Tipo de Consulta */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="tu@email.com"
                        className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 font-medium placeholder:text-gray-400 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de consulta</label>
                      <select
                        value={contactQueryType}
                        onChange={(e) => setContactQueryType(e.target.value)}
                        className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 font-medium focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all"
                        required
                      >
                        <option value="">Seleccionar...</option>
                        <option value="reclamos">Reclamos</option>
                        <option value="alquiler_unidades">Alquiler de unidades</option>
                        <option value="cargas_especiales">Cargas especiales</option>
                        <option value="cargas_internacionales">Cargas internacionales</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>
                  </div>

                  {/* FILA 3: Mensaje - Full Width */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Mensaje</label>
                    <textarea
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Cuéntanos tu consulta..."
                      rows={5}
                      className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 font-medium placeholder:text-gray-400 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all resize-none"
                      required
                    />
                  </div>

                  {/* FILA 4: Botón - Full Width */}
                  <button
                    type="submit"
                    disabled={contactLoading}
                    className="w-full px-8 py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={18} /> {contactLoading ? 'Enviando...' : 'Enviar consulta'}
                  </button>
                </form>
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
              <div className="flex items-center mb-6">
                <img src="/Logo.png" alt="Transporte Rio Lavayen" className="h-12 w-auto brightness-0 invert" />
              </div>
              <p className="text-sm max-w-sm">
                Con más de tres décadas de experiencia, garantizamos la logística más eficiente para tu empresa con las mejores tarifas del mercado y seguimiento en tiempo real.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Plataforma</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#inicio" className="hover:text-white transition-colors">Inicio</a></li>
                <li><a href="#seguimiento" className="hover:text-white transition-colors">Seguimiento</a></li>
                <li><a href="#cotizaciones" className="hover:text-white transition-colors">Cotizaciones</a></li>
                <li><a href="#servicios" className="hover:text-white transition-colors">Servicios</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Contacto</h4>
              <ul className="space-y-2 text-sm">
                <li>tteriolavayen.sanpedro@gmail.com</li>
                <li>+549 3888 446213</li>
                <li>La Urbana S/N, Ex Parque Industrial, San Pedro de Jujuy</li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center text-sm">
            <p>&copy; {new Date().getFullYear()} Transporte Rio Lavayen. Todos los derechos reservados.</p>
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
