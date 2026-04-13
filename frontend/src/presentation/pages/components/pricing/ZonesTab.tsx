import React, { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { zoneSchema, ZoneFormData, zoneUpdateSchema } from '../../../../domain/schemas/pricing.schema';
import { usePricing } from '../../../../application/context/PricingContext';
import { Pagination } from '../../../../components/ui/Pagination';
import { EmptyState } from '../../../../components/ui/EmptyState';

export default function ZonesTab() {
  const { zones, zonesLoading, agregarZona, actualizarZona, eliminarZona } = usePricing();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Usar el schema correcto según si es edición o creación
  const schema = editingId ? zoneUpdateSchema : zoneSchema;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ZoneFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      numero: 1,
      nombre: '',
      descripcion: '',
      estado: 'activo',
    }
  });

  const abrirNuevo = () => {
    setEditingId(null);
    reset({ numero: 1, nombre: '', descripcion: '', estado: 'activo' });
    setShowModal(true);
  };

  const abrirEditar = (zone: any) => {
    setEditingId(zone.id);
    reset({
      numero: zone.numero || 1,
      nombre: zone.nombre || '',
      descripcion: zone.descripcion || '',
      estado: zone.estado || 'activo',
    });
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditingId(null);
    reset();
  };

  const onSubmit = async (data: ZoneFormData) => {
    try {
      if (editingId) {
        await actualizarZona(editingId, data);
      } else {
        await agregarZona(data);
      }
      cerrarModal();
    } catch (error: any) {
      alert(error.message || 'Error al guardar zona');
    }
  };

  const handleEliminar = async (id: string) => {
    if (confirm('¿Está seguro que desea eliminar esta zona?')) {
      try {
        await eliminarZona(id);
      } catch (error: any) {
        alert(error.message || 'Error al eliminar zona');
      }
    }
  };

  const zonasActivas = zones.filter(z => z.estado === 'activo').length;

  const paginatedZones = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return zones.slice(startIndex, startIndex + itemsPerPage);
  }, [zones, currentPage]);

  const totalPages = Math.ceil(zones.length / itemsPerPage);

  if (zonesLoading) return <div className="p-8 text-center">Cargando zonas...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Zonas de Cobertura</h2>
          <p className="text-sm text-gray-500">Total: {zones.length} | Activas: {zonasActivas}</p>
        </div>
        <button
          onClick={abrirNuevo}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> Nueva Zona
        </button>
      </div>

      {/* Table */}
      {zones.length === 0 ? (
        <EmptyState title="Sin zonas" description="Crea tu primera zona de cobertura" icon={MapPin} action={{ label: "Nueva Zona", onClick: abrirNuevo }} />
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Número</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Descripción</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedZones.map((zone) => (
                  <tr key={zone.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{zone.numero}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{zone.nombre}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{zone.descripcion || '-'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        zone.estado === 'activo' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {zone.estado === 'activo' ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm flex items-center gap-2">
                      <button
                        onClick={() => abrirEditar(zone)}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleEliminar(zone.id)}
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
                {editingId ? 'Editar Zona' : 'Nueva Zona'}
              </h3>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Zona (1-4)</label>
                <select
                  {...register('numero', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={!!editingId} // No permitir cambiar el número al editar (es unique)
                >
                  <option value={1}>Zona 1</option>
                  <option value={2}>Zona 2</option>
                  <option value={3}>Zona 3</option>
                  <option value={4}>Zona 4</option>
                </select>
                {errors.numero && <p className="text-red-500 text-xs mt-1">{errors.numero.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  {...register('nombre')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Ej: Zona Norte"
                />
                {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  {...register('descripcion')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Ej: Zona céntrica de la ciudad"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  {...register('estado')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="activo">Activa</option>
                  <option value="inactivo">Inactiva</option>
                </select>
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
                  {editingId ? 'Guardar Cambios' : 'Crear Zona'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
