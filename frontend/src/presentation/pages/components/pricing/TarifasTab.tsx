import React, { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, History, DollarSign } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tariffSchema, TariffFormData } from '../../../../domain/schemas/pricing.schema';
import { usePricing } from '../../../../application/context/PricingContext';
import { Pagination } from '../../../../components/ui/Pagination';
import { EmptyState } from '../../../../components/ui/EmptyState';
import HistorialTarifasModal from './HistorialTarifasModal';

// Tipos de carga predefinidos
const CARGO_TYPES = [
  'BULTO DE 1 KILO A 10 KILOS',
  'BULTO DE 11 KILOS A 50 KILOS',
  'BULTO DE 51 KILOS A 100 KILOS',
  'BULTO DE MAS DE 100 KILOS',
  'METROS CUBICOS',
  'PALETS',
  'CONTENEDOR COMPLETO',
];

export default function TarifasTab() {
  const { tariffs, tariffsLoading, agregarTarifa, actualizarTarifa, eliminarTarifa, obtenerVersionesTarifa } = usePricing();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showHistorial, setShowHistorial] = useState(false);
  const [selectedTariffId, setSelectedTariffId] = useState<string | null>(null);
  const [historialData, setHistorialData] = useState<any[]>([]);
  const itemsPerPage = 8;

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<TariffFormData>({
    resolver: zodResolver(tariffSchema),
    defaultValues: {
      cargoType: '',
      zone: 1,
      baseTariff: 0,
      validFrom: new Date().toISOString().split('T')[0],
      validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    }
  });

  const abrirNuevo = () => {
    setEditingId(null);
    reset({
      cargoType: '',
      zone: 1,
      baseTariff: 0,
      validFrom: new Date().toISOString().split('T')[0],
      validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setShowModal(true);
  };

  const abrirEditar = (tariff: any) => {
    setEditingId(tariff.id);
    reset({
      cargoType: tariff.cargoType || '',
      zone: tariff.zone || 1,
      baseTariff: tariff.baseTariff || 0,
      validFrom: new Date(tariff.validFrom).toISOString().split('T')[0],
      validTo: new Date(tariff.validTo).toISOString().split('T')[0],
    });
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditingId(null);
    reset();
  };

  const onSubmit = async (data: TariffFormData) => {
    try {
      // Convertir fechas a formato ISO
      const payload = {
        cargoType: data.cargoType,
        zone: data.zone,
        baseTariff: data.baseTariff,
        validFrom: new Date(data.validFrom).toISOString(),
        validTo: new Date(data.validTo).toISOString(),
      };

      if (editingId) {
        // Al actualizar, se crea una NUEVA versión
        await actualizarTarifa(editingId, payload);
      } else {
        await agregarTarifa(payload);
      }
      cerrarModal();
    } catch (error: any) {
      alert(error.message || 'Error al guardar tarifa');
    }
  };

  const handleEliminar = async (id: string) => {
    if (confirm('¿Está seguro que desea eliminar esta tarifa? Se eliminará también su historial de versiones.')) {
      try {
        await eliminarTarifa(id);
      } catch (error: any) {
        alert(error.message || 'Error al eliminar tarifa');
      }
    }
  };

  const handleVerHistorial = async (tariffId: string) => {
    try {
      const tariff = tariffs.find(t => t.id === tariffId);
      if (tariff) {
        const versions = await obtenerVersionesTarifa(tariff.cargoType || 'standard', tariff.zone || 1);
        setHistorialData(versions);
        setSelectedTariffId(tariffId);
        setShowHistorial(true);
      }
    } catch (error: any) {
      alert(error.message || 'Error al cargar historial');
    }
  };

  // Filtrar solo versiones ACTIVAS (la última de cada grupo cargoType + zone)
  const activeTariffs = useMemo(() => {
    const grouped = tariffs.reduce((acc: any, tariff: any) => {
      const key = `${tariff.cargoType || 'standard'}-${tariff.zone || 1}`;
      if (!acc[key] || new Date(tariff.createdAt) > new Date(acc[key].createdAt)) {
        acc[key] = tariff;
      }
      return acc;
    }, {});
    return Object.values(grouped);
  }, [tariffs]);

  const paginatedTariffs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return activeTariffs.slice(startIndex, startIndex + itemsPerPage);
  }, [activeTariffs, currentPage]);

  const totalPages = Math.ceil(activeTariffs.length / itemsPerPage);

  if (tariffsLoading) return <div className="p-8 text-center">Cargando tarifas...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Tarifas de Envío</h2>
          <p className="text-sm text-gray-500">Versiones activas: {activeTariffs.length} | Total historiales: {tariffs.length}</p>
        </div>
        <button
          onClick={abrirNuevo}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> Nueva Tarifa
        </button>
      </div>

      {/* Table */}
      {activeTariffs.length === 0 ? (
        <EmptyState title="Sin tarifas" description="Crea tu primera tarifa de envío" icon={DollarSign} action={{ label: "Nueva Tarifa", onClick: abrirNuevo }} />
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tipo de Carga</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Zona</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tarifa Base</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Versión</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Vigencia</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedTariffs.map((tariff) => (
                  <tr key={tariff.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900">{tariff.cargoType || 'Standard'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">Zona {tariff.zone || 1}</td>
                    <td className="px-6 py-4 text-sm font-mono font-semibold text-gray-900">${tariff.baseTariff?.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                        v{tariff.version}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(tariff.validFrom).toLocaleDateString('es-AR')} al {new Date(tariff.validTo).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tariff.estado === 'activo' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {tariff.estado === 'activo' ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm flex items-center gap-2">
                      <button
                        onClick={() => abrirEditar(tariff)}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                        title="Editar (crea nueva versión)"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleVerHistorial(tariff.id)}
                        className="p-2 hover:bg-purple-50 rounded-lg transition-colors text-purple-600"
                        title="Ver historial de versiones"
                      >
                        <History size={16} />
                      </button>
                      <button
                        onClick={() => handleEliminar(tariff.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Editar Tarifa (crea nueva versión)' : 'Nueva Tarifa'}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {editingId && 'Al guardar se creará una nueva versión, la anterior se marcará como inactiva.'}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Carga</label>
                <select
                  {...register('cargoType')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Selecciona un tipo de carga</option>
                  {CARGO_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.cargoType && <p className="text-red-500 text-xs mt-1">{errors.cargoType.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zona (1-4)</label>
                <select
                  {...register('zone', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value={1}>Zona 1</option>
                  <option value={2}>Zona 2</option>
                  <option value={3}>Zona 3</option>
                  <option value={4}>Zona 4</option>
                </select>
                {errors.zone && <p className="text-red-500 text-xs mt-1">{errors.zone.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tarifa Base ($)</label>
                <input
                  {...register('baseTariff', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="0.00"
                />
                {errors.baseTariff && <p className="text-red-500 text-xs mt-1">{errors.baseTariff.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vigencia Desde</label>
                <input
                  {...register('validFrom')}
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {errors.validFrom && <p className="text-red-500 text-xs mt-1">{errors.validFrom.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vigencia Hasta</label>
                <input
                  {...register('validTo')}
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {errors.validTo && <p className="text-red-500 text-xs mt-1">{errors.validTo.message}</p>}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  {editingId ? 'Crear Nueva Versión' : 'Crear Tarifa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Historial Modal */}
      {showHistorial && selectedTariffId && (
        <HistorialTarifasModal
          isOpen={showHistorial}
          onClose={() => {
            setShowHistorial(false);
            setSelectedTariffId(null);
            setHistorialData([]);
          }}
          tarifId={selectedTariffId}
          versions={historialData}
          onRestore={async (versionData) => {
            try {
              await agregarTarifa(versionData);
              setShowHistorial(false);
              alert('Versión restaurada como nueva tarifa');
            } catch (error: any) {
              alert(error.message || 'Error al restaurar versión');
            }
          }}
        />
      )}
    </div>
  );
}
