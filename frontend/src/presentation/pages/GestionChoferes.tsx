import React, { useState, useMemo } from 'react';
import { Users, UserCheck, UserMinus, Map, Plus, X, Pencil, Trash2, Calendar, AlertTriangle } from 'lucide-react';
import { useFlota, Chofer as ChoferType } from '../../application/context/FlotaContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { choferSchema, ChoferFormData } from '../../domain/schemas/chofer.schema';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState } from '../../components/ui/EmptyState';
import { LABELS } from '../../application/constants/labels';

export default function GestionChoferes() {
  const { choferes, agregarChofer, actualizarChofer, eliminarChofer } = useFlota();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { common: c, fleet: { choferes: ch } } = LABELS;

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ChoferFormData>({
    resolver: zodResolver(choferSchema),
    defaultValues: {
      nombre: '',
      dni: '',
      licencia: '',
      vencimientoLicencia: '',
      telefono: '',
      estado: 'DISPONIBLE'
    }
  });

  const abrirNuevo = () => {
    setEditingId(null);
    reset({
      nombre: '',
      dni: '',
      licencia: '',
      vencimientoLicencia: '',
      telefono: '',
      estado: 'DISPONIBLE'
    });
    setShowModal(true);
  };

  const abrirEditar = (chofer: ChoferType) => {
    setEditingId(chofer.id);
    reset({
      nombre: chofer.nombre,
      dni: chofer.dni,
      licencia: chofer.licencia,
      vencimientoLicencia: chofer.vencimientoLicencia,
      telefono: chofer.telefono,
      estado: chofer.estado as any
    });
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditingId(null);
    reset();
  };

  const onSubmit = async (data: ChoferFormData) => {
    try {
      if (editingId) {
        await actualizarChofer(editingId, data as any);
      } else {
        await agregarChofer(data as any);
      }
      cerrarModal();
    } catch (error: any) {
      alert(error.message || 'Error al guardar chofer');
    }
  };

  const handleEliminar = async (id: string) => {
    if (confirm(ch.confirmDelete)) {
      try {
        await eliminarChofer(id);
      } catch (error: any) {
        alert(error.message || 'Error al eliminar chofer');
      }
    }
  };

  // Calcular métricas
  const choferesDisponibles = choferes.filter(c => c.estado === 'DISPONIBLE').length;
  const choferesEnRuta = choferes.filter(c => c.estado === 'EN_RUTA').length;
  const choferesInactivos = choferes.filter(c => c.estado === 'INACTIVO').length;

  // Licencias por vencer
  const hoy = new Date();
  const treintaDias = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000);

  const licenciasPorVencer = useMemo(() => {
    return choferes.filter(c => {
      if (!c.vencimientoLicencia || c.estado === 'INACTIVO') return false;
      const fecha = new Date(c.vencimientoLicencia);
      return fecha <= treintaDias && fecha >= hoy;
    });
  }, [choferes]);

  const licenciasVencidas = useMemo(() => {
    return choferes.filter(c => {
      if (!c.vencimientoLicencia || c.estado === 'INACTIVO') return false;
      const fecha = new Date(c.vencimientoLicencia);
      return fecha < hoy;
    });
  }, [choferes]);

  const metrics = [
    { title: 'Total Choferes', value: choferes.length.toString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Choferes Disponibles', value: choferesDisponibles.toString(), icon: UserCheck, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'Choferes en Viaje', value: choferesEnRuta.toString(), icon: Map, color: 'text-amber-600', bg: 'bg-amber-100' },
    { title: 'En Licencia / Inactivos', value: choferesInactivos.toString(), icon: UserMinus, color: 'text-red-600', bg: 'bg-red-100' },
  ];

  // Paginate list
  const paginatedChoferes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return choferes.slice(startIndex, startIndex + itemsPerPage);
  }, [choferes, currentPage]);

  const totalPages = Math.ceil(choferes.length / itemsPerPage);

  return (
    <div className="space-y-6 relative h-full overflow-y-auto pr-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{ch.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {ch.subtitle}
          </p>
        </div>
        <button onClick={abrirNuevo} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm">
          <Plus size={16} /> {ch.new}
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

      {/* Row 2: Licencias por Vencer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Licencias por vencer */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-80">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Calendar size={18} className="text-amber-500" /> {ch.licenseWillExpire}
            </h3>
            <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {licenciasPorVencer.length}
            </span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
            {licenciasPorVencer.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                No hay licencias por vencer en los próximos 30 días
              </div>
            ) : (
              <div className="space-y-2">
                {licenciasPorVencer.map(c => (
                  <div key={c.id} className="flex justify-between items-center p-2 bg-amber-50 rounded-lg border border-amber-200">
                    <span className="text-sm font-medium text-gray-800">{c.nombre}</span>
                    <span className="text-xs text-amber-600">Vence: {c.vencimientoLicencia}</span>
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
              <AlertTriangle size={18} className="text-red-500" /> {ch.licenseExpired}
            </h3>
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {licenciasVencidas.length}
            </span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
            {licenciasVencidas.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                No hay licencias vencidas
              </div>
            ) : (
              <div className="space-y-2">
                {licenciasVencidas.map(c => (
                  <div key={c.id} className="flex justify-between items-center p-2 bg-red-50 rounded-lg border border-red-200">
                    <span className="text-sm font-medium text-gray-800">{c.nombre}</span>
                    <span className="text-xs text-red-600">Venció: {c.vencimientoLicencia}</span>
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
            <Users size={18} className="text-indigo-600" /> {ch.listTitle}
          </h3>
        </div>
        
        {choferes.length === 0 ? (
          <EmptyState 
            title={ch.noChoferes}
            description={ch.subtitle}
            icon={Users}
            action={{ label: ch.new, onClick: abrirNuevo }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                <tr>
                  <th className="px-6 py-3 font-medium">Nombre</th>
                  <th className="px-6 py-3 font-medium">DNI</th>
                  <th className="px-6 py-3 font-medium">Teléfono</th>
                  <th className="px-6 py-3 font-medium">Licencia</th>
                  <th className="px-6 py-3 font-medium">Vencimiento</th>
                  <th className="px-6 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedChoferes.map(chofer => (
                  <tr key={chofer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-indigo-600">{chofer.nombre}</td>
                    <td className="px-6 py-4">{chofer.dni}</td>
                    <td className="px-6 py-4">{chofer.telefono || '-'}</td>
                    <td className="px-6 py-4">{chofer.licencia || '-'}</td>
                    <td className="px-6 py-4">
                      {chofer.vencimientoLicencia ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          (() => {
                            const fecha = new Date(chofer.vencimientoLicencia);
                            if (fecha < hoy) return 'bg-red-100 text-red-700';
                            if (fecha <= treintaDias) return 'bg-amber-100 text-amber-700';
                            return 'bg-green-100 text-green-700';
                          })()
                        }`}>
                          {chofer.vencimientoLicencia}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => abrirEditar(chofer)} 
                          className="text-blue-500 hover:text-blue-700 transition-colors p-2 rounded-md hover:bg-blue-50" 
                          title="Editar chofer"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => handleEliminar(chofer.id)} 
                          className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-md hover:bg-red-50" 
                          title="Eliminar chofer"
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
        
        {choferes.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={choferes.length}
          />
        )}
      </div>

      {/* Modal Nuevo/Editar Chofer */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Users className="text-indigo-600" size={20} />
                {editingId ? ch.edit : ch.registerNew}
              </h3>
              <button onClick={cerrarModal} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-200">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nombre Completo <span className="text-red-500">*</span></label>
                    <input 
                      {...register('nombre')} 
                      type="text" 
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.nombre ? 'border-red-500' : 'border-gray-300'}`} 
                      placeholder="Ej. Juan Pérez" 
                      aria-invalid={errors.nombre ? "true" : "false"}
                      aria-describedby={errors.nombre ? "nombre-error" : undefined}
                    />
                    {errors.nombre && <p id="nombre-error" className="mt-1 text-xs text-red-500">{errors.nombre.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">DNI <span className="text-red-500">*</span></label>
                    <input {...register('dni')} type="text" className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.dni ? 'border-red-500' : 'border-gray-300'}`} placeholder="Ej. 30123456" />
                    {errors.dni && <p className="mt-1 text-xs text-red-500">{errors.dni.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Teléfono</label>
                    <input {...register('telefono')} type="tel" className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.telefono ? 'border-red-500' : 'border-gray-300'}`} placeholder="Ej. 11 1234-5678" />
                    {errors.telefono && <p className="mt-1 text-xs text-red-500">{errors.telefono.message}</p>}
                  </div>
                  <div className="sm:col-span-2 border-t border-gray-100 pt-4 mt-2">
                    <h4 className="text-sm font-medium text-gray-800 mb-3">Documentación y Licencias</h4>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nº de Licencia <span className="text-red-500">*</span></label>
                    <input {...register('licencia')} type="text" className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.licencia ? 'border-red-500' : 'border-gray-300'}`} placeholder="Ej. 30123456" />
                    {errors.licencia && <p className="mt-1 text-xs text-red-500">{errors.licencia.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Vencimiento Licencia <span className="text-red-500">*</span></label>
                    <input {...register('vencimientoLicencia')} type="date" className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.vencimientoLicencia ? 'border-red-500' : 'border-gray-300'}`} />
                    {errors.vencimientoLicencia && <p className="mt-1 text-xs text-red-500">{errors.vencimientoLicencia.message}</p>}
                  </div>
                  {editingId && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
                      <select {...register('estado')} className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white ${errors.estado ? 'border-red-500' : 'border-gray-300'}`}>
                        <option value="DISPONIBLE">Disponible</option>
                        <option value="EN_RUTA">En Ruta</option>
                        <option value="INACTIVO">Inactivo</option>
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
                  {editingId ? 'Guardar Cambios' : 'Guardar Chofer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}