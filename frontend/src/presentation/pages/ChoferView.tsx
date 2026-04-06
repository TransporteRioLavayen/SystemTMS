import React, { useState, useEffect, useCallback } from 'react';
import hojaRutaService, { HojaDeRuta, RemitoHoja } from '../../infrastructure/services/hojaRutaService';
import apiClient from '../../infrastructure/api/client';
import { Truck, Loader2, LogOut, Play, Square, ChevronRight, MapPin, Package, CheckCircle, XCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import { LABELS } from '../../application/constants/labels';

type Screen = 'LOGIN' | 'ROUTES' | 'DELIVERIES' | 'DELIVERY_DETAIL';

interface Chofer {
  id: string;
  nombre: string;
  dni: string;
  licencia: string;
  vencimientoLicencia: string;
  telefono: string;
  estado: string;
}

export default function ChoferView() {
  const [choferes, setChoferes] = useState<Chofer[]>([]);
  const [choferesLoading, setChoferesLoading] = useState(false);
  const [choferesError, setChoferesError] = useState<string | null>(null);
  
  // Auth
  const [dni, setDni] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [choferLogueado, setChoferLogueado] = useState<{nombre: string; dni: string} | null>(() => {
    const stored = localStorage.getItem('choferSession');
    return stored ? JSON.parse(stored) : null;
  });

  const { common: c, driverPortal: dp } = LABELS;

  // Cargar choferes directamente del backend
  useEffect(() => {
    const cargarChoferes = async () => {
      setChoferesLoading(true);
      setChoferesError(null);
      try {
        const response = await apiClient.get('/choferes');
        setChoferes(response.data.data || []);
      } catch (err: any) {
        console.error('Error cargando choferes:', err);
        setChoferesError(err.message || 'Error al cargar choferes');
      } finally {
        setChoferesLoading(false);
      }
    };
    cargarChoferes();
  }, []);

  // Navigation
  const [screen, setScreen] = useState<Screen>('LOGIN');
  const [hojaSeleccionada, setHojaSeleccionada] = useState<HojaDeRuta | null>(null);
  const [remitoSeleccionado, setRemitoSeleccionado] = useState<RemitoHoja | null>(null);

  // Data
  const [hojasDeRuta, setHojasDeRuta] = useState<HojaDeRuta[]>([]);
  const [loading, setLoading] = useState(false);
  const [turnoIniciado, setTurnoIniciado] = useState(false);

  // Modals
  const [showStartTurnModal, setShowStartTurnModal] = useState(false);
  const [showEndTurnModal, setShowEndTurnModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [kmSalida, setKmSalida] = useState('');
  const [kmLlegada, setKmLlegada] = useState('');
  const [startingTurn, setStartingTurn] = useState(false);
  const [endingTurn, setEndingTurn] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectNotes, setRejectNotes] = useState('');
  const [processingDelivery, setProcessingDelivery] = useState(false);

  // Persistir sesión
  useEffect(() => {
    if (choferLogueado) {
      localStorage.setItem('choferSession', JSON.stringify(choferLogueado));
    } else {
      localStorage.removeItem('choferSession');
    }
  }, [choferLogueado]);

  // Cargar hojas del chofer
  const cargarHojas = useCallback(async () => {
    if (!choferLogueado?.dni) return;
    setLoading(true);
    try {
      const hojas = await hojaRutaService.findByChoferDni(choferLogueado.dni);
      setHojasDeRuta(hojas);
      // Verificar si hay turno iniciado
      const enReparto = hojas.some(h => h.estado === 'En reparto');
      setTurnoIniciado(enReparto);
    } catch (err) {
      console.error('Error cargando hojas:', err);
    } finally {
      setLoading(false);
    }
  }, [choferLogueado]);

  // Cargar al loguearse
  useEffect(() => {
    if (choferLogueado) {
      cargarHojas();
    }
  }, [choferLogueado, cargarHojas]);

  // Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const chofer = choferes.find(c => c.dni === dni);
    if (chofer) {
      const session = { nombre: chofer.nombre, dni: chofer.dni };
      setChoferLogueado(session);
      setScreen('ROUTES');
    } else {
      setLoginError('El DNI ingresado no corresponde a ningún chofer registrado.');
    }
  };

  // Logout
  const handleLogout = () => {
    setChoferLogueado(null);
    setScreen('LOGIN');
    setHojasDeRuta([]);
    setTurnoIniciado(false);
    setHojaSeleccionada(null);
    setRemitoSeleccionado(null);
    setDni('');
    setLoginError(null);
    localStorage.removeItem('choferSession');
  };

  // Iniciar turno
  const handleStartTurn = async () => {
    const km = parseInt(kmSalida);
    if (!km || km <= 0) {
      alert('Ingrese los kilómetros de salida.');
      return;
    }
    const hoja = hojasDeRuta.find(h => h.estado === 'Lista para salir');
    if (!hoja) {
      alert('No hay hojas de ruta listas para iniciar.');
      return;
    }
    setStartingTurn(true);
    try {
      await hojaRutaService.iniciarTurno(hoja.id, km);
      setShowStartTurnModal(false);
      setKmSalida('');
      setTurnoIniciado(true);
      await cargarHojas();
    } catch (err: any) {
      alert('Error al iniciar turno: ' + (err.message || 'Error desconocido'));
    } finally {
      setStartingTurn(false);
    }
  };

  // Terminar turno
  const handleEndTurn = async () => {
    const km = parseInt(kmLlegada);
    const hojaEnReparto = hojasDeRuta.find(h => h.estado === 'En reparto');
    if (!hojaEnReparto || !km) {
      alert('Ingrese los kilómetros de llegada.');
      return;
    }
    if (km <= (hojaEnReparto.kmSalida || 0)) {
      alert('Los kilómetros de llegada deben ser mayores a los de salida.');
      return;
    }
    setEndingTurn(true);
    try {
      await hojaRutaService.terminarTurno(hojaEnReparto.id, km);
      setShowEndTurnModal(false);
      setKmLlegada('');
      setTurnoIniciado(false);
      await cargarHojas();
    } catch (err: any) {
      alert('Error al terminar turno: ' + (err.message || 'Error desconocido'));
    } finally {
      setEndingTurn(false);
    }
  };

  // Marcar entrega
  const handleDeliver = async () => {
    if (!hojaSeleccionada || !remitoSeleccionado) return;
    setProcessingDelivery(true);
    try {
      await hojaRutaService.actualizarEstadoRemito(
        hojaSeleccionada.id,
        remitoSeleccionado.id,
        'Entregado'
      );
      setScreen('DELIVERIES');
      setRemitoSeleccionado(null);
      await cargarHojas();
      // Actualizar hoja seleccionada
      const hojasActualizadas = await hojaRutaService.findByChoferDni(choferLogueado!.dni);
      const hojaActualizada = hojasActualizadas.find(h => h.id === hojaSeleccionada.id);
      if (hojaActualizada) setHojaSeleccionada(hojaActualizada);
    } catch (err: any) {
      alert('Error al marcar entrega: ' + (err.message || 'Error desconocido'));
    } finally {
      setProcessingDelivery(false);
    }
  };

  // Marcar rechazo
  const handleReject = async () => {
    if (!hojaSeleccionada || !remitoSeleccionado || !rejectReason) {
      alert('Seleccione un motivo de rechazo.');
      return;
    }
    setProcessingDelivery(true);
    try {
      await hojaRutaService.actualizarEstadoRemito(
        hojaSeleccionada.id,
        remitoSeleccionado.id,
        'Rechazado',
        rejectReason,
        rejectNotes || undefined
      );
      setShowRejectModal(false);
      setRejectReason('');
      setRejectNotes('');
      setScreen('DELIVERIES');
      setRemitoSeleccionado(null);
      await cargarHojas();
      const hojasActualizadas = await hojaRutaService.findByChoferDni(choferLogueado!.dni);
      const hojaActualizada = hojasActualizadas.find(h => h.id === hojaSeleccionada.id);
      if (hojaActualizada) setHojaSeleccionada(hojaActualizada);
    } catch (err: any) {
      alert('Error al rechazar: ' + (err.message || 'Error desconocido'));
    } finally {
      setProcessingDelivery(false);
    }
  };

  // Verificar si todas las entregas están completas
  const todasEntregasCompletas = hojasDeRuta
    .filter(h => h.estado === 'En reparto')
    .every(h => h.cargas.length > 0 && h.cargas.every(c => c.estado === 'Entregado' || c.estado === 'Rechazado'));

  // Progreso de una hoja
  const getProgreso = (hoja: HojaDeRuta) => {
    if (hoja.cargas.length === 0) return 0;
    const completadas = hoja.cargas.filter(c => c.estado === 'Entregado' || c.estado === 'Rechazado').length;
    return Math.round((completadas / hoja.cargas.length) * 100);
  };

  // ==================== PANTALLA DE LOGIN ====================
  if (!choferLogueado) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-indigo-100 p-4 rounded-full">
              <Truck size={40} className="text-indigo-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">{dp.title}</h2>
          <p className="text-center text-gray-500 mb-8">{dp.subtitle}</p>
          {choferesLoading && choferes.length === 0 ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
              <span className="ml-2 text-gray-500">Cargando...</span>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{dp.dniLabel}</label>
                <input
                  type="text"
                  value={dni}
                  onChange={e => { setDni(e.target.value); setLoginError(null); }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-lg text-center tracking-widest"
                  placeholder="Ej: 12345678"
                  required
                />
              </div>
              {loginError && (
                <div className="bg-red-50 text-red-800 p-3 rounded-lg text-sm text-center">{loginError}</div>
              )}
              {choferesError && (
                <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm text-center">
                  No se pudo conectar con el servidor. Verifique que el backend esté corriendo.
                </div>
              )}
              <button type="submit" className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-md">
                {dp.loginButton}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ==================== PANTALLA: HOJAS DE RUTA ====================
  if (screen === 'ROUTES') {
    const hojasVisibles = turnoIniciado
      ? hojasDeRuta.filter(h => h.estado === 'En reparto' || h.estado === 'Completada')
      : hojasDeRuta.filter(h => h.estado === 'Lista para salir');

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-indigo-600 text-white p-4 shadow-md flex justify-between items-center sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-bold">{dp.myRoutes}</h1>
            <p className="text-indigo-200 text-sm">{dp.greeting}, {choferLogueado.nombre}</p>
          </div>
          <div className="flex items-center gap-2">
            {turnoIniciado ? (
              <button
                onClick={() => setShowEndTurnModal(true)}
                disabled={!todasEntregasCompletas}
                className={`p-2 rounded-full transition-colors ${todasEntregasCompletas ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-500 cursor-not-allowed'}`}
                title="Terminar Turno"
              >
                <Square size={24} />
              </button>
            ) : (
              <button
                onClick={() => setShowStartTurnModal(true)}
                className="p-2 bg-green-600 hover:bg-green-700 rounded-full transition-colors"
                title="Comenzar Turno"
              >
                <Play size={24} />
              </button>
            )}
            <button onClick={handleLogout} className="p-2 hover:bg-indigo-700 rounded-full transition-colors" title="Cerrar Sesión">
              <LogOut size={24} />
            </button>
          </div>
        </div>

        {/* Estado del turno */}
        <div className="bg-indigo-50 border-b border-indigo-100 p-3 flex items-center justify-center gap-2">
          {turnoIniciado ? (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-indigo-800">{dp.activeTurn}</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span className="text-sm font-medium text-amber-800">{dp.inactiveTurn}</span>
            </>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          {!turnoIniciado && hojasDeRuta.some(h => h.estado === 'Lista para salir') && (
            <button
              onClick={() => setShowStartTurnModal(true)}
              className="w-full mb-6 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-md flex items-center justify-center gap-2"
            >
              <Play size={24} />
              <span>{dp.startTurn}</span>
            </button>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
          ) : hojasVisibles.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4 mt-20">
              <div className="bg-gray-100 p-6 rounded-full">
                <CheckCircle size={48} className="text-gray-400" />
              </div>
              {turnoIniciado ? (
                <p className="text-center text-lg font-medium">{dp.noRoutes}</p>
              ) : (
                <div className="text-center">
                  <p className="text-lg font-medium">{dp.inactiveTurn}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-gray-800 font-bold mb-2">
                {turnoIniciado ? 'Hojas de Ruta En Reparto' : 'Hojas de Ruta Asignadas'}
              </h2>
              {hojasVisibles.map(hoja => {
                const progreso = getProgreso(hoja);
                const completa = progreso === 100;
                return (
                  <div
                    key={hoja.id}
                    onClick={() => {
                      if (turnoIniciado || hoja.estado === 'Lista para salir') {
                        setHojaSeleccionada(hoja);
                        setScreen('DELIVERIES');
                      }
                    }}
                    className={`bg-white rounded-2xl shadow-sm border-2 p-5 active:scale-[0.98] transition-transform cursor-pointer ${
                      completa ? 'border-green-500 bg-green-50' : 'border-gray-100'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-lg mb-2 ${
                          completa ? 'bg-green-200 text-green-800' : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {hoja.id}
                        </span>
                        <h3 className="font-bold text-lg">{hoja.unidad}</h3>
                      </div>
                      <div className={`px-3 py-2 rounded-xl text-center ${completa ? 'bg-green-100' : 'bg-gray-50'}`}>
                        <span className={`block text-xl font-bold ${completa ? 'text-green-700' : 'text-gray-900'}`}>
                          {hoja.cargas.filter(c => c.estado === 'Entregado').length}/{hoja.cargas.length}
                        </span>
                        <span className="text-[10px] uppercase font-semibold text-gray-500">Entregas</span>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p className="flex items-center gap-2">
                        {completa ? <CheckCircle size={16} className="text-green-600" /> : <Package size={16} className="text-gray-400" />}
                        Estado: <span className={`font-medium ${completa ? 'text-green-700' : 'text-gray-900'}`}>
                          {completa ? '✓ Completa' : hoja.estado}
                        </span>
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all ${completa ? 'bg-green-500' : 'bg-indigo-600'}`}
                          style={{ width: `${progreso}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500">{progreso}% completado</p>
                    </div>
                    <div className={`mt-4 pt-4 border-t border-gray-100 flex justify-between items-center font-medium text-sm ${completa ? 'text-green-700' : 'text-indigo-600'}`}>
                      {completa ? '✓ Hoja completada' : 'Ver detalle de ruta'}
                      <ChevronRight size={18} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal: Iniciar Turno */}
        {showStartTurnModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">🚚 Iniciar Turno</h2>
              <p className="text-gray-600 mb-6">Ingrese los kilómetros de salida.</p>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Kilómetros de salida</label>
                <input
                  type="number"
                  value={kmSalida}
                  onChange={e => setKmSalida(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-lg"
                  placeholder="Ingrese los km"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowStartTurnModal(false); setKmSalida(''); }} className="flex-1 py-3 bg-gray-200 text-gray-800 font-bold rounded-xl hover:bg-gray-300 transition-colors" disabled={startingTurn}>
                  Cancelar
                </button>
                <button onClick={handleStartTurn} disabled={startingTurn || !kmSalida} className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50">
                  {startingTurn ? 'Iniciando...' : 'Iniciar Turno'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Terminar Turno */}
        {showEndTurnModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">🏁 Terminar Turno</h2>
              <p className="text-gray-600 mb-6">Ingrese los kilómetros de llegada.</p>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Kilómetros de llegada</label>
                <input
                  type="number"
                  value={kmLlegada}
                  onChange={e => setKmLlegada(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-lg"
                  placeholder="Ingrese los km"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowEndTurnModal(false); setKmLlegada(''); }} className="flex-1 py-3 bg-gray-200 text-gray-800 font-bold rounded-xl hover:bg-gray-300 transition-colors" disabled={endingTurn}>
                  Cancelar
                </button>
                <button onClick={handleEndTurn} disabled={endingTurn || !kmLlegada} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50">
                  {endingTurn ? 'Terminando...' : 'Terminar Turno'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==================== PANTALLA: ENTREGAS DE UNA HOJA ====================
  if (screen === 'DELIVERIES' && hojaSeleccionada) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-indigo-600 text-white p-4 shadow-md flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => { setScreen('ROUTES'); setHojaSeleccionada(null); }} className="p-1 hover:bg-indigo-700 rounded-full">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-lg font-bold">{hojaSeleccionada.id}</h1>
            <p className="text-indigo-200 text-xs">{hojaSeleccionada.unidad}</p>
          </div>
        </div>

        <div className="flex-1 p-4">
          <h2 className="text-gray-800 font-bold mb-4">{dp.deliveries} ({hojaSeleccionada.cargas.length})</h2>
          {hojaSeleccionada.cargas.length === 0 ? (
            <div className="text-center text-gray-500 py-20">
              <Package size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No hay entregas asignadas.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {hojaSeleccionada.cargas.map(remito => (
                <div
                  key={remito.id}
                  onClick={() => {
                    setRemitoSeleccionado(remito);
                    setScreen('DELIVERY_DETAIL');
                  }}
                  className={`bg-white rounded-xl shadow-sm border-2 p-4 active:scale-[0.98] transition-transform cursor-pointer ${
                    remito.estado === 'Entregado' ? 'border-green-500 bg-green-50' :
                    remito.estado === 'Rechazado' ? 'border-red-500 bg-red-50' :
                    'border-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {remito.estado === 'Entregado' ? (
                          <CheckCircle size={18} className="text-green-600" />
                        ) : remito.estado === 'Rechazado' ? (
                          <XCircle size={18} className="text-red-600" />
                        ) : (
                          <Package size={18} className="text-indigo-600" />
                        )}
                        <span className="font-bold text-gray-900">{remito.cliente}</span>
                      </div>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin size={14} /> {remito.direccion}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{remito.bultos} bultos</p>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                      remito.estado === 'Entregado' ? 'bg-green-200 text-green-800' :
                      remito.estado === 'Rechazado' ? 'bg-red-200 text-red-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {remito.estado === 'Entregado' ? 'Entregado' :
                       remito.estado === 'Rechazado' ? 'Rechazado' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==================== PANTALLA: DETALLE DE ENTREGA ====================
  if (screen === 'DELIVERY_DETAIL' && remitoSeleccionado && hojaSeleccionada) {
    const isPending = remitoSeleccionado.estado === 'En Base' || remitoSeleccionado.estado === 'En reparto';

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-indigo-600 text-white p-4 shadow-md flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => { setScreen('DELIVERIES'); setRemitoSeleccionado(null); }} className="p-1 hover:bg-indigo-700 rounded-full">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-lg font-bold">{dp.deliveryDetail}</h1>
            <p className="text-indigo-200 text-xs">{remitoSeleccionado.cliente}</p>
          </div>
        </div>

        <div className="flex-1 p-4">
          {/* Info del cliente */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-indigo-100 p-3 rounded-full">
                <MapPin size={24} className="text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{remitoSeleccionado.cliente}</h2>
                <p className="text-gray-600">{remitoSeleccionado.direccion}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600 border-t pt-4">
              <p className="flex items-center gap-2"><Package size={16} /> <strong>Bultos:</strong> {remitoSeleccionado.bultos}</p>
              {remitoSeleccionado.whatsapp && (
                <p className="flex items-center gap-2"><span className="text-green-600">📱</span> <strong>WhatsApp:</strong> {remitoSeleccionado.whatsapp}</p>
              )}
              {remitoSeleccionado.motivoRechazo && (
                <p className="flex items-center gap-2"><AlertCircle size={16} className="text-red-600" /> <strong>Motivo:</strong> {remitoSeleccionado.motivoRechazo}</p>
              )}
              {remitoSeleccionado.notasRechazo && (
                <p className="flex items-center gap-2"><AlertCircle size={16} className="text-red-600" /> <strong>Notas:</strong> {remitoSeleccionado.notasRechazo}</p>
              )}
            </div>
            <div className="mt-4">
              <span className={`inline-block px-3 py-1.5 text-sm font-bold rounded-lg ${
                remitoSeleccionado.estado === 'Entregado' ? 'bg-green-200 text-green-800' :
                remitoSeleccionado.estado === 'Rechazado' ? 'bg-red-200 text-red-800' :
                'bg-amber-100 text-amber-800'
              }`}>
                {remitoSeleccionado.estado === 'Entregado' ? 'Entregado' :
                 remitoSeleccionado.estado === 'Rechazado' ? 'Rechazado' : 'Pendiente'}
              </span>
            </div>
          </div>

          {/* Botones de acción (solo si está pendiente) */}
          {isPending && (
            <div className="space-y-3">
              <button
                onClick={handleDeliver}
                disabled={processingDelivery}
                className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle size={24} />
                {processingDelivery ? 'Procesando...' : dp.markDelivered}
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={processingDelivery}
                className="w-full py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <XCircle size={24} />
                {dp.markRejected}
              </button>
            </div>
          )}
        </div>

        {/* Modal: Rechazo */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-end z-50">
            <div className="bg-white rounded-t-2xl shadow-xl p-6 w-full max-w-lg mx-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Motivo de No Entrega</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Motivo <span className="text-red-500">*</span></label>
                <select
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none bg-white"
                >
                  <option value="">Seleccione un motivo</option>
                  <option value="No responde nadie">No responde nadie</option>
                  <option value="Dirección incorrecta">Dirección incorrecta</option>
                  <option value="Cliente rechazó">Cliente rechazó</option>
                  <option value="Local cerrado">Local cerrado</option>
                  <option value="Mercadería dañada">Mercadería dañada</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones (opcional)</label>
                <textarea
                  value={rejectNotes}
                  onChange={e => setRejectNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none resize-none"
                  rows={3}
                  placeholder="Agregue detalles adicionales..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowRejectModal(false); setRejectReason(''); setRejectNotes(''); }}
                  className="flex-1 py-3 bg-gray-200 text-gray-800 font-bold rounded-xl hover:bg-gray-300 transition-colors"
                  disabled={processingDelivery}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReject}
                  disabled={processingDelivery || !rejectReason}
                  className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {processingDelivery ? 'Procesando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="animate-spin text-indigo-600" size={32} />
    </div>
  );
}
