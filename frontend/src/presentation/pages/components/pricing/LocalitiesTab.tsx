import React, { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, MapPin, ChevronDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { localitySchema, LocalityFormData, localityUpdateSchema } from '../../../../domain/schemas/pricing.schema';
import { usePricing } from '../../../../application/context/PricingContext';
import { Pagination } from '../../../../components/ui/Pagination';
import { EmptyState } from '../../../../components/ui/EmptyState';

export default function LocalitiesTab() {
  const { localities, localitiesLoading, zones, agregarLocalidad, actualizarLocalidad, eliminarLocalidad } = usePricing();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterZoneId, setFilterZoneId] = useState<string>('');
  const itemsPerPage = 8;

  // Usar el schema correcto según si es edición o creación
  const schema = editingId ? localityUpdateSchema : localitySchema;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LocalityFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      zoneId: '',
      nombre: '',
      lat: 0,
      lng: 0,
      estado: 'activo',
    }
  });

  const abrirNuevo = () => {
    setEditingId(null);
    reset({ zoneId: '', nombre: '', lat: 0, lng: 0, estado: 'activo' });
    setShowModal(true);
  };

  const abrirEditar = (locality: any) => {
    setEditingId(locality.id);
    reset({
      zoneId: locality.zoneId || '',
      nombre: locality.nombre || '',
      lat: locality.lat || 0,
      lng: locality.lng || 0,
      estado: locality.estado || 'activo',
    });
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditingId(null);
    reset();
  };

  const onSubmit = async (data: LocalityFormData) => {
    try {
      if (editingId) {
        await actualizarLocalidad(editingId, data);
      } else {
        await agregarLocalidad(data);
      }
      cerrarModal();
    } catch (error: any) {
      alert(error.message || 'Error al guardar localidad');
    }
  };

  const handleEliminar = async (id: string) => {
    if (confirm('¿Está seguro que desea eliminar esta localidad?')) {
      try {
        await eliminarLocalidad(id);
      } catch (error: any) {
        alert(error.message || 'Error al eliminar localidad');
      }
    }
  };

  const filteredLocalities = filterZoneId
    ? localities.filter(l => l.zoneId === filterZoneId)
    : localities;

  const localitiesActivas = filteredLocalities.filter(l => l.estado === 'activo').length;

  const paginatedLocalities = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLocalities.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLocalities, currentPage]);

  const totalPages = Math.ceil(filteredLocalities.length / itemsPerPage);

  const getZoneName = (zoneId: string) => {
    return zones.find(z => z.id === zoneId)?.nombre || 'Desconocida';
  };

  if (localitiesLoading) return <div className="p-8 text-center">Cargando localidades...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Localidades</h2>
          <p className="text-sm text-gray-500">Total: {filteredLocalities.length} | Activas: {localitiesActivas}</p>
        </div>
        <button
          onClick={abrirNuevo}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> Nueva Localidad
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Zona</label>
          <select
            value={filterZoneId}
            onChange={(e) => {
              setFilterZoneId(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">Todas las Zonas</option>
            {zones.map(zone => (
              <option key={zone.id} value={zone.id}>{zone.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {filteredLocalities.length === 0 ? (
        <EmptyState title="Sin localidades" description="Crea tu primera localidad" icon={MapPin} action={{ label: "Nueva Localidad", onClick: abrirNuevo }} />
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Zona</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Coordenadas</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedLocalities.map((locality) => (
                  <tr key={locality.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{locality.nombre}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{getZoneName(locality.zoneId)}</td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">{locality.lat.toFixed(4)}, {locality.lng.toFixed(4)}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        locality.estado === 'activo' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {locality.estado === 'activo' ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm flex items-center gap-2">
                      <button
                        onClick={() => abrirEditar(locality)}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleEliminar(locality.id)}
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
                {editingId ? 'Editar Localidad' : 'Nueva Localidad'}
              </h3>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zona</label>
                <select
                  {...register('zoneId')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Selecciona una zona</option>
                  {zones.map(zone => (
                    <option key={zone.id} value={zone.id}>{zone.nombre}</option>
                  ))}
                </select>
                {errors.zoneId && <p className="text-red-500 text-xs mt-1">{errors.zoneId.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  {...register('nombre')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Ej: La Esperanza"
                />
                {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitud</label>
                  <input
                    {...register('lat', { valueAsNumber: true })}
                    type="number"
                    step="0.00000001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="-24.223864"
                  />
                  {errors.lat && <p className="text-red-500 text-xs mt-1">{errors.lat.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitud</label>
                  <input
                    {...register('lng', { valueAsNumber: true })}
                    type="number"
                    step="0.00000001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="-64.836660"
                  />
                  {errors.lng && <p className="text-red-500 text-xs mt-1">{errors.lng.message}</p>}
                </div>
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
                  {editingId ? 'Guardar Cambios' : 'Crear Localidad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
