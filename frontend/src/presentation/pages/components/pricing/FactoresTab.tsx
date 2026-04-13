import React, { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Zap } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { calculatorFactorSchema, CalculatorFactorFormData, calculatorFactorUpdateSchema } from '../../../../domain/schemas/pricing.schema';
import { usePricing } from '../../../../application/context/PricingContext';
import { Pagination } from '../../../../components/ui/Pagination';
import { EmptyState } from '../../../../components/ui/EmptyState';

// Tipos de factores
const FACTOR_TYPES = [
  { value: 'porcentaje', label: 'Porcentaje (ej: 0.008 = 0.8%)' },
  { value: 'multiplicador', label: 'Multiplicador (ej: 1.21 = 21%)' },
  { value: 'fijo', label: 'Fijo (valor constante)' },
];

export default function FactoresTab() {
  const { factors, factorsLoading, agregarFactor, actualizarFactor, eliminarFactor } = usePricing();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Usar el schema correcto según si es edición o creación
  const schema = editingId ? calculatorFactorUpdateSchema : calculatorFactorSchema;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CalculatorFactorFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: '',
      valor: 1,
      tipo: 'multiplicador',
      descripcion: '',
      estado: 'activo',
    }
  });

  const abrirNuevo = () => {
    setEditingId(null);
    reset({ nombre: '', valor: 1, tipo: 'multiplicador', descripcion: '', estado: 'activo' });
    setShowModal(true);
  };

  const abrirEditar = (factor: any) => {
    setEditingId(factor.id);
    reset({
      nombre: factor.nombre || '',
      valor: factor.valor || 1,
      tipo: factor.tipo || 'multiplicador',
      descripcion: factor.descripcion || '',
      estado: factor.estado || 'activo',
    });
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditingId(null);
    reset();
  };

  const onSubmit = async (data: CalculatorFactorFormData) => {
    try {
      if (editingId) {
        await actualizarFactor(editingId, data);
      } else {
        await agregarFactor(data);
      }
      cerrarModal();
    } catch (error: any) {
      alert(error.message || 'Error al guardar factor');
    }
  };

  const handleEliminar = async (id: string) => {
    if (confirm('¿Está seguro que desea eliminar este factor?')) {
      try {
        await eliminarFactor(id);
      } catch (error: any) {
        alert(error.message || 'Error al eliminar factor');
      }
    }
  };

  const factoresActivos = factors.filter(f => f.estado === 'activo').length;

  const paginatedFactors = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return factors.slice(startIndex, startIndex + itemsPerPage);
  }, [factors, currentPage]);

  const totalPages = Math.ceil(factors.length / itemsPerPage);

  if (factorsLoading) return <div className="p-8 text-center">Cargando factores...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Factores de Cálculo</h2>
          <p className="text-sm text-gray-500">Total: {factors.length} | Activos: {factoresActivos}</p>
        </div>
        <button
          onClick={abrirNuevo}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> Nuevo Factor
        </button>
      </div>

      {/* Table */}
      {factors.length === 0 ? (
        <EmptyState title="Sin factores" description="Crea tu primer factor de cálculo" icon={Zap} action={{ label: "Nuevo Factor", onClick: abrirNuevo }} />
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tipo</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Valor</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Descripción</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedFactors.map((factor) => (
                  <tr key={factor.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{factor.nombre}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                        {factor.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-900">{factor.valor}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{factor.descripcion || '-'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        factor.estado === 'activo' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {factor.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm flex items-center gap-2">
                      <button
                        onClick={() => abrirEditar(factor)}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleEliminar(factor.id)}
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
                {editingId ? 'Editar Factor' : 'Nuevo Factor'}
              </h3>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  {...register('nombre')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Ej: IVA"
                />
                {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Factor</label>
                <select
                  {...register('tipo')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {FACTOR_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                {errors.tipo && <p className="text-red-500 text-xs mt-1">{errors.tipo.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                <input
                  {...register('valor', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="1.21"
                />
                {errors.valor && <p className="text-red-500 text-xs mt-1">{errors.valor.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  {...register('descripcion')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Describe qué hace este factor"
                  rows={2}
                />
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
                  {editingId ? 'Guardar Cambios' : 'Crear Factor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
