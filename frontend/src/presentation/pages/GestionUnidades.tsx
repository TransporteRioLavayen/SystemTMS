import React, { useState, useMemo } from 'react';
import { Truck, CheckCircle, Map, Wrench, Plus, FileText, X, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { useFlota, Unidad as UnidadType } from '../../application/context/FlotaContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { unidadSchema, UnidadFormData } from '../../domain/schemas/unidad.schema';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState } from '../../components/ui/EmptyState';
import { LABELS } from '../../application/constants/labels';

export default function GestionUnidades() {
  const { unidades, agregarUnidad, actualizarUnidad, eliminarUnidad } = useFlota();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { common: c, fleet: { unidades: u } } = LABELS;

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UnidadFormData>({
    resolver: zodResolver(unidadSchema),
    defaultValues: {
      patente: '',
      marca: '',
      modelo: '',
      anio: '',
      tipo: 'rígido' as any,
      vtv: '',
      seguro: '',
      tipoServicio: 'corta_distancia' as any,
      estado: 'DISPONIBLE' as any
    }
  });

  const abrirNuevo = () => {
    setEditingId(null);
    reset({
      patente: '',
      marca: '',
      modelo: '',
      anio: '',
      tipo: 'rígido' as any,
      vtv: '',
      seguro: '',
      tipoServicio: 'corta_distancia' as any,
      estado: 'DISPONIBLE' as any
    });
    setShowModal(true);
  };

  const abrirEditar = (unidad: UnidadType) => {
    setEditingId(unidad.id);
    reset({
      patente: unidad.patente,
      marca: unidad.marca,
      modelo: unidad.modelo,
      anio: unidad.anio,
      tipo: unidad.tipo as any,
      vtv: unidad.vtv || '',
      seguro: unidad.seguro || '',
      tipoServicio: (unidad.tipoServicio as any) || 'corta_distancia',
      estado: unidad.estado as any
    });
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditingId(null);
    reset();
  };

  const onSubmit = async (data: UnidadFormData) => {
    try {
      if (editingId) {
        await actualizarUnidad(editingId, data as any);
      } else {
        await agregarUnidad(data as any);
      }
      cerrarModal();
    } catch (error: any) {
      alert(error.message || 'Error al guardar unidad');
    }
  };

  const handleEliminar = async (id: string) => {
    if (confirm(u.confirmDelete)) {
      try {
        await eliminarUnidad(id);
      } catch (error: any) {
        alert(error.message || 'Error al eliminar unidad');
      }
    }
  };

  // Calcular métricas
  const unidadesDisponibles = unidades.filter(u => u.estado === 'DISPONIBLE').length;
  const unidadesEnRuta = unidades.filter(u => u.estado === 'EN_RUTA').length;
  const unidadesMantenimiento = unidades.filter(u => u.estado === 'MANTENIMIENTO').length;

  // Vencimientos próximos (30 días)
  const hoy = new Date();
  const treintaDias = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000);

  const vtvPorVencer = useMemo(() => {
    return unidades.filter(u => {
      if (!u.vtv || u.estado === 'MANTENIMIENTO') return false;
      const fecha = new Date(u.vtv);
      return fecha <= treintaDias && fecha >= hoy;
    });
  }, [unidades]);

  const segurosPorVencer = useMemo(() => {
    return unidades.filter(u => {
      if (!u.seguro || u.estado === 'MANTENIMIENTO') return false;
      const fecha = new Date(u.seguro);
      return fecha <= treintaDias && fecha >= hoy;
    });
  }, [unidades]);

  const vtvVencidas = useMemo(() => {
    return unidades.filter(u => {
      if (!u.vtv) return false;
      return new Date(u.vtv) < hoy;
    });
  }, [unidades]);

  const segurosVencidos = useMemo(() => {
    return unidades.filter(u => {
      if (!u.seguro) return false;
      return new Date(u.seguro) < hoy;
    });
  }, [unidades]);

  const metrics = [
    { title: 'Total de Unidades', value: unidades.length.toString(), icon: Truck, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Unidades Disponibles', value: unidadesDisponibles.toString(), icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'Unidades en Viaje', value: unidadesEnRuta.toString(), icon: Map, color: 'text-amber-600', bg: 'bg-amber-100' },
    { title: 'Unidades en Taller', value: unidadesMantenimiento.toString(), icon: Wrench, color: 'text-red-600', bg: 'bg-red-100' },
  ];

  // Paginate list
  const paginatedUnidades = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return unidades.slice(startIndex, startIndex + itemsPerPage);
  }, [unidades, currentPage]);

  const totalPages = Math.ceil(unidades.length / itemsPerPage);

  return (
    <div className="space-y-6 h-full overflow-y-auto pr-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{u.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {u.subtitle}
          </p>
        </div>
        <button onClick={abrirNuevo} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm">
          <Plus size={16} /> {u.new}
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex items-center gap-4">
              <div className={`p-3 rounded-lg ${metric.bg} ${metric.color}`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{metric.title}</p>
                <h4 className="text-2xl font-bold text-gray-900">{metric.value}</h4>
              </div>
            </div>
          );
        })}
      </div>

      {/* Row 2: Vencimientos y Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Próximos vencimientos de documentación */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-80">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FileText size={18} className="text-amber-500" /> Próximos vencimientos de documentación
            </h3>
            <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {vtvPorVencer.length + segurosPorVencer.length}
            </span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
            {vtvPorVencer.length === 0 && segurosPorVencer.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                No hay vencimientos próximos
              </div>
            ) : (
              <div className="space-y-2">
                {vtvPorVencer.map(u => (
                  <div key={u.id} className="flex justify-between items-center p-2 bg-amber-50 rounded-lg border border-amber-200">
                    <span className="text-sm font-medium text-gray-800">{u.patente} - {u.marca}</span>
                    <span className="text-xs text-amber-600">VTV: {u.vtv}</span>
                  </div>
                ))}
                {segurosPorVencer.map(u => (
                  <div key={u.id} className="flex justify-between items-center p-2 bg-amber-50 rounded-lg border border-amber-200">
                    <span className="text-sm font-medium text-gray-800">{u.patente} - {u.marca}</span>
                    <span className="text-xs text-amber-600">Seguro: {u.seguro}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Licencias vencidas */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-80">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-500" /> Documentación vencida
            </h3>
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {vtvVencidas.length + segurosVencidos.length}
            </span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
            {vtvVencidas.length === 0 && segurosVencidos.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                No hay documentación vencida
              </div>
            ) : (
              <div className="space-y-2">
                {vtvVencidas.map(u => (
                  <div key={u.id} className="flex justify-between items-center p-2 bg-red-50 rounded-lg border border-red-200">
                    <span className="text-sm font-medium text-gray-800">{u.patente} - {u.marca}</span>
                    <span className="text-xs text-red-600">VTV vencida: {u.vtv}</span>
                  </div>
                ))}
                {segurosVencidos.map(u => (
                  <div key={u.id} className="flex justify-between items-center p-2 bg-red-50 rounded-lg border border-red-200">
                    <span className="text-sm font-medium text-gray-800">{u.patente} - {u.marca}</span>
                    <span className="text-xs text-red-600">Seguro vencido: {u.seguro}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-6">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Truck size={18} className="text-indigo-600" /> {u.listTitle}
          </h3>
        </div>
        
        {unidades.length === 0 ? (
          <EmptyState 
            title={u.noUnidades}
            description={u.subtitle}
            icon={Truck}
            action={{ label: u.new, onClick: abrirNuevo }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                <tr>
                  <th className="px-6 py-3 font-medium">Patente</th>
                  <th className="px-6 py-3 font-medium">Tipo</th>
                  <th className="px-6 py-3 font-medium">Marca / Modelo</th>
                  <th className="px-6 py-3 font-medium">Año</th>
                  <th className="px-6 py-3 font-medium">Tipo Servicio</th>
                  <th className="px-6 py-3 font-medium">VTV</th>
                  <th className="px-6 py-3 font-medium">Seguro</th>
                  <th className="px-6 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedUnidades.map(unidad => (
                  <tr key={unidad.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-indigo-600">{unidad.patente}</td>
                    <td className="px-6 py-4">{unidad.tipo}</td>
                    <td className="px-6 py-4">{unidad.marca} {unidad.modelo}</td>
                    <td className="px-6 py-4">{unidad.anio}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        unidad.tipoServicio === 'larga_distancia' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {unidad.tipoServicio === 'larga_distancia' ? 'Larga Distancia' : 'Corta Distancia'}
                      </span>
                    </td>
                    <td className="px-6 py-4">{unidad.vtv || '-'}</td>
                    <td className="px-6 py-4">{unidad.seguro || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => abrirEditar(unidad)} 
                          className="text-blue-500 hover:text-blue-700 transition-colors p-2 rounded-md hover:bg-blue-50" 
                          title="Editar unidad"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => handleEliminar(unidad.id)} 
                          className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-md hover:bg-red-50" 
                          title="Eliminar unidad"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {unidades.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={unidades.length}
          />
        )}
      </div>

      {/* Modal Nueva Unidad */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Truck className="text-indigo-600" size={20} />
                {editingId ? u.edit : u.new}
              </h3>
              <button onClick={cerrarModal} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-200">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Patente / Dominio <span className="text-red-500">*</span></label>
                    <input {...register('patente')} type="text" className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.patente ? 'border-red-500' : 'border-gray-300'}`} placeholder="Ej. AB 123 CD" />
                    {errors.patente && <p className="mt-1 text-xs text-red-500">{errors.patente.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Unidad <span className="text-red-500">*</span></label>
                    <select {...register('tipo')} className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white ${errors.tipo ? 'border-red-500' : 'border-gray-300'}`}>
                      <option value="rígido">Rígido</option>
                      <option value="semirremolque">Semirremolque</option>
                      <option value="camioneta">Camioneta</option>
                    </select>
                    {errors.tipo && <p className="mt-1 text-xs text-red-500">{errors.tipo.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Servicio <span className="text-red-500">*</span></label>
                    <select {...register('tipoServicio')} className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white ${errors.tipoServicio ? 'border-red-500' : 'border-gray-300'}`}>
                      <option value="corta_distancia">🚚 Corta Distancia (entregas directas)</option>
                      <option value="larga_distancia">🚛 Larga Distancia (solo depósitos)</option>
                    </select>
                    {errors.tipoServicio && <p className="mt-1 text-xs text-red-500">{errors.tipoServicio.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Marca <span className="text-red-500">*</span></label>
                    <input {...register('marca')} type="text" className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.marca ? 'border-red-500' : 'border-gray-300'}`} placeholder="Ej. Scania, Volvo" />
                    {errors.marca && <p className="mt-1 text-xs text-red-500">{errors.marca.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Modelo <span className="text-red-500">*</span></label>
                    <input {...register('modelo')} type="text" className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.modelo ? 'border-red-500' : 'border-gray-300'}`} placeholder="Ej. G410" />
                    {errors.modelo && <p className="mt-1 text-xs text-red-500">{errors.modelo.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Año <span className="text-red-500">*</span></label>
                    <input {...register('anio')} type="number" className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.anio ? 'border-red-500' : 'border-gray-300'}`} placeholder="Ej. 2022" />
                    {errors.anio && <p className="mt-1 text-xs text-red-500">{errors.anio.message}</p>}
                  </div>
                  <div className="sm:col-span-2 border-t border-gray-100 pt-4 mt-2">
                    <h4 className="text-sm font-medium text-gray-800 mb-3">Vencimientos de Documentación</h4>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Vencimiento VTV / RTO</label>
                    <input {...register('vtv')} type="date" className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.vtv ? 'border-red-500' : 'border-gray-300'}`} />
                    {errors.vtv && <p className="mt-1 text-xs text-red-500">{errors.vtv.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Vencimiento Seguro</label>
                    <input {...register('seguro')} type="date" className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.seguro ? 'border-red-500' : 'border-gray-300'}`} />
                    {errors.seguro && <p className="mt-1 text-xs text-red-500">{errors.seguro.message}</p>}
                  </div>
                  {editingId && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
                      <select 
                        {...register('estado')}
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white ${errors.estado ? 'border-red-500' : 'border-gray-300'}`}
                      >
                        <option value="DISPONIBLE">Disponible</option>
                        <option value="EN_RUTA">En Ruta</option>
                        <option value="MANTENIMIENTO">En Taller / Mantenimiento</option>
                      </select>
                      {errors.estado && <p className="mt-1 text-xs text-red-500">{errors.estado.message}</p>}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <button type="button" onClick={cerrarModal} className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                  {editingId ? 'Guardar Cambios' : 'Guardar Unidad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
