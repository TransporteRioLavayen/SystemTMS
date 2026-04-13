import React, { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Calculator, Info } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePricing } from '../../../../application/context/PricingContext';
import { Pagination } from '../../../../components/ui/Pagination';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { FormulaParametro } from '../../../../infrastructure/api/pricing';

// Schema for form validation
const formulaSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  codigo: z.string().min(3, 'El código debe tener al menos 3 caracteres'),
  descripcion: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  formula: z.string().min(5, 'La fórmula debe tener al menos 5 caracteres'),
  parametros: z.array(z.object({
    nombre: z.string(),
    tipo: z.enum(['number', 'boolean', 'string']),
    descripcion: z.string().optional(),
    valorDefault: z.union([z.number(), z.boolean(), z.string()]).optional(),
    esFactorVinculado: z.boolean().optional(),
    factorNombre: z.string().optional(),
  })).optional(),
  ordenEjecucion: z.number().positive('El orden debe ser mayor a 0'),
  estado: z.enum(['activo', 'inactivo']).default('activo'),
});

type FormulaFormData = z.infer<typeof formulaSchema>;

export default function FormulasTab() {
  const { formulas, formulasLoading, agregarFormula, actualizarFormula, eliminarFormula } = usePricing();
  const [showModal, setShowModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedFormula, setSelectedFormula] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [parametrosInput, setParametrosInput] = useState('');
  const itemsPerPage = 8;

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormulaFormData>({
    resolver: zodResolver(formulaSchema),
    defaultValues: {
      nombre: '',
      codigo: '',
      descripcion: '',
      formula: '',
      parametros: [],
      ordenEjecucion: 1,
      estado: 'activo',
    }
  });

  const abrirNuevo = () => {
    setEditingId(null);
    setParametrosInput('');
    reset({ 
      nombre: '', 
      codigo: '', 
      descripcion: '', 
      formula: '', 
      parametros: [], 
      ordenEjecucion: formulas.length + 1, 
      estado: 'activo' 
    });
    setShowModal(true);
  };

  const abrirEditar = (formula: any) => {
    setEditingId(formula.id);
    const paramsStr = formula.parametros && formula.parametros.length > 0 
      ? JSON.stringify(formula.parametros, null, 2) 
      : '';
    setParametrosInput(paramsStr);
    reset({
      nombre: formula.nombre || '',
      codigo: formula.codigo || '',
      descripcion: formula.descripcion || '',
      formula: formula.formula || '',
      parametros: formula.parametros || [],
      ordenEjecucion: formula.ordenEjecucion || 1,
      estado: formula.estado || 'activo',
    });
    setShowModal(true);
  };

  const abrirInfo = (formula: any) => {
    setSelectedFormula(formula);
    setShowInfoModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditingId(null);
    setParametrosInput('');
    reset();
  };

  const handleParametrosChange = (value: string) => {
    setParametrosInput(value);
    try {
      if (value.trim()) {
        const parsed = JSON.parse(value);
        setValue('parametros', parsed);
      } else {
        setValue('parametros', []);
      }
    } catch {
      // Invalid JSON, don't update
    }
  };

  const onSubmit = async (data: FormulaFormData) => {
    try {
      const formulaData = {
        ...data,
        parametros: data.parametros || [],
      };
      
      if (editingId) {
        await actualizarFormula(editingId, formulaData);
      } else {
        await agregarFormula(formulaData);
      }
      cerrarModal();
    } catch (error: any) {
      alert(error.message || 'Error al guardar fórmula');
    }
  };

  const handleEliminar = async (id: string) => {
    if (confirm('¿Está seguro que desea eliminar esta fórmula?')) {
      try {
        await eliminarFormula(id);
      } catch (error: any) {
        alert(error.message || 'Error al eliminar fórmula');
      }
    }
  };

  const formulasActivas = formulas.filter(f => f.estado === 'activo').length;

  const paginatedFormulas = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return formulas.slice(startIndex, startIndex + itemsPerPage);
  }, [formulas, currentPage]);

  const totalPages = Math.ceil(formulas.length / itemsPerPage);

  if (formulasLoading) return <div className="p-8 text-center">Cargando fórmulas...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Fórmulas de Cálculo</h2>
          <p className="text-sm text-gray-500">Total: {formulas.length} | Activas: {formulasActivas}</p>
        </div>
        <button
          onClick={abrirNuevo}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> Nueva Fórmula
        </button>
      </div>

      {/* Table */}
      {formulas.length === 0 ? (
        <EmptyState 
          title="Sin fórmulas" 
          description="Crea tu primera fórmula de cálculo" 
          icon={Calculator} 
          action={{ label: "Nueva Fórmula", onClick: abrirNuevo }} 
        />
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Orden</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Código</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Fórmula</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedFormulas.map((formula) => (
                  <tr key={formula.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-gray-900">{formula.ordenEjecucion}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{formula.nombre}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <span className="px-2 py-1 bg-cyan-50 text-cyan-700 rounded text-xs font-mono">
                        {formula.codigo}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono max-w-xs truncate" title={formula.formula}>
                      {formula.formula}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        formula.estado === 'activo' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {formula.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm flex items-center gap-2">
                      <button
                        onClick={() => abrirInfo(formula)}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                        title="Ver detalles"
                      >
                        <Info size={16} />
                      </button>
                      <button
                        onClick={() => abrirEditar(formula)}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleEliminar(formula.id)}
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

      {/* Modal de Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Editar Fórmula' : 'Nueva Fórmula'}
              </h3>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    {...register('nombre')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Ej: Cálculo de Distancia"
                  />
                  {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código Técnico</label>
                  <input
                    {...register('codigo')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                    placeholder="Ej: HAVERSINE_DISTANCIA"
                  />
                  {errors.codigo && <p className="text-red-500 text-xs mt-1">{errors.codigo.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  {...register('descripcion')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Describe el propósito de esta fórmula"
                  rows={2}
                />
                {errors.descripcion && <p className="text-red-500 text-xs mt-1">{errors.descripcion.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fórmula</label>
                <textarea
                  {...register('formula')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                  placeholder="Ej: R * c * 1.3"
                  rows={2}
                />
                {errors.formula && <p className="text-red-500 text-xs mt-1">{errors.formula.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Orden de Ejecución</label>
                  <input
                    {...register('ordenEjecucion', { valueAsNumber: true })}
                    type="number"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  {errors.ordenEjecucion && <p className="text-red-500 text-xs mt-1">{errors.ordenEjecucion.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select
                    {...register('estado')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parámetros (JSON)
                  <span className="text-gray-500 text-xs ml-2">- Array de objetos con nombre, tipo, descripción, etc.</span>
                </label>
                <textarea
                  value={parametrosInput}
                  onChange={(e) => handleParametrosChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-xs"
                  placeholder='[{"nombre": "origenLat", "tipo": "number", "descripcion": "Latitud de origen"}]'
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">{`Ingresa un array JSON con los parámetros. Ej: [{"nombre": "distancia", "tipo": "number"}]`}</p>
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
                  {editingId ? 'Guardar Cambios' : 'Crear Fórmula'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Información */}
      {showInfoModal && selectedFormula && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{selectedFormula.nombre}</h3>
              <p className="text-sm text-gray-500 mt-1">Código: {selectedFormula.codigo}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Descripción</h4>
                <p className="text-sm text-gray-600">{selectedFormula.descripcion}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Fórmula</h4>
                <div className="bg-gray-100 rounded-lg p-3 font-mono text-sm text-gray-800">
                  {selectedFormula.formula}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Parámetros</h4>
                {selectedFormula.parametros && selectedFormula.parametros.length > 0 ? (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <pre className="text-xs text-gray-600 overflow-x-auto">
                      {JSON.stringify(selectedFormula.parametros, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Sin parámetros definidos</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Orden de Ejecución</h4>
                  <p className="text-sm text-gray-600">{selectedFormula.ordenEjecucion}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Estado</h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedFormula.estado === 'activo' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedFormula.estado === 'activo' ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowInfoModal(false)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}