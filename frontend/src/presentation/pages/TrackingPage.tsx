import React, { useState } from 'react';
import { Search, Package, MapPin, Clock, Truck, CheckCircle, XCircle } from 'lucide-react';
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

export default function TrackingPage() {
  const [trackingCode, setTrackingCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ remito: TrackingRemito; events: TrackingEvent[] } | null>(null);

  // Obtener la posición del estado actual en el proceso
  const getEstadoIndex = (estado: string): number => {
    const estadoEncontrado = ESTADOS_PROCESO.find(e => e.label === estado);
    return estadoEncontrado ? ESTADOS_PROCESO.indexOf(estadoEncontrado) : -1;
  };

  // Obtener evento por tipo de evento
  const getEventByKey = (events: TrackingEvent[], key: string): TrackingEvent | undefined => {
    return events.find(e => e.evento === key);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCode.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await trackingService.getByCode(trackingCode.trim());
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Código de seguimiento no encontrado');
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-indigo-600 text-white p-6 shadow-md">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-2">Rastreo de Envío</h1>
              <p className="text-indigo-200">Ingresá tu código de seguimiento para ver el estado de tu envío</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                placeholder="Ej: TRK-XXXXX"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-lg font-mono tracking-wider uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !trackingCode.trim()}
              className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Search size={20} />
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-800 p-4 rounded-xl mb-6 flex items-center gap-3">
            <XCircle size={24} />
            <span>{error}</span>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-6">
            {/* Remito Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Información del Envío</h2>
                <span className="px-3 py-1 rounded-full text-sm font-bold bg-gray-100 text-gray-800">
                  {result.remito.estadoActual}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Destinatario</p>
                  <p className="font-medium text-gray-900">{result.remito.destinatario}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bultos</p>
                  <p className="font-medium text-gray-900">{result.remito.bultos}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Dirección</p>
                  <p className="font-medium text-gray-900 flex items-center gap-1">
                    <MapPin size={16} />
                    {result.remito.direccion}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Código de Seguimiento</p>
                  <p className="font-mono text-lg font-bold text-indigo-600">{result.remito.seguimiento}</p>
                </div>
              </div>
            </div>

            {/* Timeline - Estados del proceso */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Estado de tu Envío</h2>
              
              {/* Timeline horizontal */}
              <div className="flex items-center justify-between gap-1">
                {ESTADOS_PROCESO.map((estado, index) => {
                  const eventoCompletado = getEventByKey(result.events, estado.key);
                  const estadoActual = result.remito.estadoActual;
                  const isRechazado = estado.key === 'entrega_rechazada';
                  const isEntregado = estado.key === 'entregado';
                  
                  const isCompleted = eventoCompletado !== undefined;
                  const isCurrent = estado.label === estadoActual || (isRechazado && estadoActual === 'Rechazado') || (isEntregado && estadoActual === 'Entregado');

                  return (
                    <div key={estado.key} className="flex items-center flex-1">
                      {/* Estado */}
                      <div className="flex flex-col items-center flex-1 min-w-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${
                          isCompleted 
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
                        <span className={`text-[10px] font-medium mt-1 text-center leading-tight ${
                          isCompleted 
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
                        <div className={`h-0.5 flex-1 min-w-[8px] mx-0.5 ${
                          isCompleted ? 'bg-green-600' : 'bg-gray-300'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!result && !error && !loading && (
          <div className="text-center py-16">
            <Package size={64} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Ingresá tu código de seguimiento para ver el estado de tu envío</p>
          </div>
        )}
      </div>
    </div>
  );
}
