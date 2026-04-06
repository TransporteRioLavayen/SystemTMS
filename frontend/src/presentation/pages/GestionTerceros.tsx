import React, { useState, useMemo } from 'react';
import { Briefcase, CheckCircle, Truck, XCircle, Plus, FileText, AlertTriangle, X, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import { useTerceros, Tercero } from '../../application/context/TercerosContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { terceroSchema, TerceroFormData } from '../../domain/schemas/tercero.schema';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import { LABELS } from '../../application/constants/labels';

export default function GestionTerceros() {
  const { 
    terceros, 
    tercerosLoading, 
    tercerosError,
    incluirInactivos, 
    setIncluirInactivos,
    agregarTercero, 
    actualizarTercero, 
    eliminarTercero,
    refreshTerceros 
  } = useTerceros();
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { common: c, admin: { terceros: te } } = LABELS;

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TerceroFormData>({
    resolver: zodResolver(terceroSchema),
    defaultValues: {
      razonSocial: '',
      tipoDocumento: 'CUIT',
      numeroDocumento: '',
      telefono: '',
      email: '',
      patenteTractor: '',
      patenteAcoplado: '',
      tipoUnidad: 'Semi',
      vencimientoSeguro: '',
      vencimientoVtv: '',
      nombreChofer: '',
      dniChofer: '',
      vencimientoLicencia: '',
      vencimientoLinti: '',
      tipoServicio: 'corta_distancia',
      estado: 'activo'
    }
  });

  // Calcular métricas
  const totalTerceros = terceros.length;
  const tercerosActivos = terceros.filter(t => t.estado === 'activo').length;
  const tercerosInactivos = terceros.filter(t => t.estado === 'inactivo').length;
  const tercerosEnViaje = terceros.filter(t => t.nombreChofer && t.estado === 'activo').length;

  // Alertas de vencimientos
  const hoy = new Date();
  const treintaDias = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000);

  const segurosPorVencer = terceros.filter(t => {
    if (!t.vencimientoSeguro) return false;
    const fecha = new Date(t.vencimientoSeguro);
    return fecha <= treintaDias && fecha >= hoy && t.estado === 'activo';
  });

  const vtvPorVencer = terceros.filter(t => {
    if (!t.vencimientoVtv) return false;
    const fecha = new Date(t.vencimientoVtv);
    return fecha <= treintaDias && fecha >= hoy && t.estado === 'activo';
  });

  const licenciasPorVencer = terceros.filter(t => {
    if (!t.vencimientoLicencia) return false;
    const fecha = new Date(t.vencimientoLicencia);
    return fecha <= treintaDias && fecha >= hoy && t.estado === 'activo';
  });

  const lintiPorVencer = terceros.filter(t => {
    if (!t.vencimientoLinti) return false;
    const fecha = new Date(t.vencimientoLinti);
    return fecha <= treintaDias && fecha >= hoy && t.estado === 'activo';
  });

  const onSubmit = async (data: TerceroFormData) => {
    try {
      if (editingId) {
        await actualizarTercero(editingId, data as any);
      } else {
        await agregarTercero(data as any);
      }
      setShowModal(false);
      setEditingId(null);
      reset();
    } catch (err: any) {
      alert(err.message || (editingId ? 'Error al actualizar tercero' : 'Error al crear tercero'));
    }
  };

  const abrirNuevo = () => {
    setEditingId(null);
    reset({
      razonSocial: '',
      tipoDocumento: 'CUIT' as any,
      numeroDocumento: '',
      telefono: '',
      email: '',
      patenteTractor: '',
      patenteAcoplado: '',
      tipoUnidad: 'Semi' as any,
      vencimientoSeguro: '',
      vencimientoVtv: '',
      nombreChofer: '',
      dniChofer: '',
      vencimientoLicencia: '',
      vencimientoLinti: '',
      tipoServicio: 'corta_distancia' as any,
      estado: 'activo' as any
    });
    setShowModal(true);
  };

  const handleEdit = (tercero: Tercero) => {
    setEditingId(tercero.id);
    reset({
      razonSocial: tercero.razonSocial,
      tipoDocumento: tercero.tipoDocumento as any,
      numeroDocumento: tercero.numeroDocumento,
      telefono: tercero.telefono || '',
      email: tercero.email || '',
      patenteTractor: tercero.patenteTractor,
      patenteAcoplado: tercero.patenteAcoplado || '',
      tipoUnidad: tercero.tipoUnidad as any,
      vencimientoSeguro: tercero.vencimientoSeguro || '',
      vencimientoVtv: tercero.vencimientoVtv || '',
      nombreChofer: tercero.nombreChofer || '',
      dniChofer: tercero.dniChofer || '',
      vencimientoLicencia: tercero.vencimientoLicencia || '',
      vencimientoLinti: tercero.vencimientoLinti || '',
      tipoServicio: (tercero.tipoServicio as any) || 'corta_distancia',
      estado: tercero.estado as any
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    reset();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este tercero?')) return;
    try {
      await eliminarTercero(id);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar tercero');
    }
  };

  const metrics = [
    { title: 'Total Terceros', value: totalTerceros, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Terceros Activos', value: tercerosActivos, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'Terceros en Viaje', value: tercerosEnViaje, icon: Truck, color: 'text-amber-600', bg: 'bg-amber-100' },
    { title: 'Terceros Inactivos', value: tercerosInactivos, icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
  ];

  // Paginate list
  const paginatedTerceros = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return terceros.slice(startIndex, startIndex + itemsPerPage);
  }, [terceros, currentPage]);

  const totalPages = Math.ceil(terceros.length / itemsPerPage);

  return (
    <div className="space-y-6 relative h-full overflow-y-auto pr-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{te.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {te.subtitle}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={refreshTerceros} 
            className="px-3 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} /> Actualizar
          </button>
          <button 
            onClick={abrirNuevo} 
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus size={16} /> {te.new}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {tercerosError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{tercerosError}</span>
          <button onClick={refreshTerceros} className="text-red-500 hover:text-red-700">
            <X size={18} />
          </button>
        </div>
      )}

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

      {/* Row 2: Alertas de Vencimientos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-80">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Truck size={18} className="text-amber-500" /> Vencimientos Vehículos
            </h3>
            <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {segurosPorVencer.length + vtvPorVencer.length}
            </span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
            {segurosPorVencer.length === 0 && vtvPorVencer.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">No hay seguros ni VTV por vencer</div>
            ) : (
              <div className="space-y-2">
                {segurosPorVencer.map(t => (
                  <div key={t.id} className="flex justify-between items-center p-2 bg-amber-50 rounded-lg border border-amber-200">
                    <span className="text-sm font-medium text-gray-800">{t.razonSocial}</span>
                    <span className="text-xs text-amber-600">Seguro: {t.vencimientoSeguro}</span>
                  </div>
                ))}
                {vtvPorVencer.map(t => (
                  <div key={t.id} className="flex justify-between items-center p-2 bg-amber-50 rounded-lg border border-amber-200">
                    <span className="text-sm font-medium text-gray-800">{t.razonSocial}</span>
                    <span className="text-xs text-amber-600">VTV: {t.vencimientoVtv}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-80">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-500" /> Vencimientos Choferes
            </h3>
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {licenciasPorVencer.length + lintiPorVencer.length}
            </span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
            {licenciasPorVencer.length === 0 && lintiPorVencer.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">No hay licencias ni exámenes por vencer</div>
            ) : (
              <div className="space-y-2">
                {licenciasPorVencer.map(t => (
                  <div key={t.id} className="flex justify-between items-center p-2 bg-red-50 rounded-lg border border-red-200">
                    <span className="text-sm font-medium text-gray-800">{t.nombreChofer}</span>
                    <span className="text-xs text-red-600">Licencia: {t.vencimientoLicencia}</span>
                  </div>
                ))}
                {lintiPorVencer.map(t => (
                  <div key={t.id} className="flex justify-between items-center p-2 bg-red-50 rounded-lg border border-red-200">
                    <span className="text-sm font-medium text-gray-800">{t.nombreChofer}</span>
                    <span className="text-xs text-red-600">LINTI: {t.vencimientoLinti}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area - Lista de Terceros */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-6">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Briefcase size={18} className="text-indigo-600" /> {te.listTitle || 'Terceros Registrados'}
          </h3>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input 
              type="checkbox" 
              checked={incluirInactivos}
              onChange={(e) => setIncluirInactivos(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Mostrar inactivos
          </label>
        </div>
        
        {tercerosLoading && terceros.length === 0 ? (
          <LoadingState message="Cargando terceros..." />
        ) : terceros.length === 0 ? (
          <EmptyState 
            title={te.noTerceros || "No hay terceros registrados"} 
            description={te.subtitle} 
            icon={Briefcase} 
            action={{ label: te.new, onClick: abrirNuevo }} 
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Razón Social</th>
                  <th className="px-4 py-3">Documento</th>
                  <th className="px-4 py-3">Teléfono</th>
                  <th className="px-4 py-3">Patente Tractor</th>
                  <th className="px-4 py-3">Tipo Servicio</th>
                  <th className="px-4 py-3">Chofer</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedTerceros.map((tercero) => (
                  <tr key={tercero.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{tercero.razonSocial}</td>
                    <td className="px-4 py-3 text-gray-600">{tercero.tipoDocumento} {tercero.numeroDocumento}</td>
                    <td className="px-4 py-3 text-gray-600">{tercero.telefono || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono">{tercero.patenteTractor}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tercero.tipoServicio === 'larga_distancia' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {tercero.tipoServicio === 'larga_distancia' ? 'Larga Distancia' : 'Corta Distancia'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{tercero.nombreChofer || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${tercero.estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {tercero.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleEdit(tercero)} className="text-indigo-600 hover:text-indigo-800 p-1" title="Editar"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(tercero.id)} className="text-red-600 hover:text-red-800 p-1 ml-2" title="Eliminar"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {terceros.length > 0 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={terceros.length} />
        )}
      </div>

      {/* Modal Nuevo Tercero */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100 bg-gray-50 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Briefcase className="text-indigo-600" size={20} />
                {editingId ? te.edit : te.new}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-200">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto">
                {/* Datos de la Empresa / Titular */}
                <h4 className="text-sm font-medium text-gray-800 mb-3">Datos del Titular / Empresa</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Razón Social / Nombre <span className="text-red-500">*</span></label>
                    <input {...register('razonSocial')} type="text" className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.razonSocial ? 'border-red-500' : 'border-gray-300'}`} placeholder="Ej. Transportes del Sur SRL" />
                    {errors.razonSocial && <p className="mt-1 text-xs text-red-500">{errors.razonSocial.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tipo Documento <span className="text-red-500">*</span></label>
                    <select {...register('tipoDocumento')} className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white ${errors.tipoDocumento ? 'border-red-500' : 'border-gray-300'}`}>
                      <option value="CUIT">CUIT</option>
                      <option value="DNI">DNI</option>
                      <option value="CUIL">CUIL</option>
                    </select>
                    {errors.tipoDocumento && <p className="mt-1 text-xs text-red-500">{errors.tipoDocumento.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Número Documento <span className="text-red-500">*</span></label>
                    <input {...register('numeroDocumento')} type="text" className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.numeroDocumento ? 'border-red-500' : 'border-gray-300'}`} placeholder="Ej. 30-12345678-9" />
                    {errors.numeroDocumento && <p className="mt-1 text-xs text-red-500">{errors.numeroDocumento.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Teléfono</label>
                    <input {...register('telefono')} type="tel" className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.telefono ? 'border-red-500' : 'border-gray-300'}`} placeholder="Ej. 11 1234-5678" />
                    {errors.telefono && <p className="mt-1 text-xs text-red-500">{errors.telefono.message}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                    <input {...register('email')} type="email" className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.email ? 'border-red-500' : 'border-gray-300'}`} placeholder="Ej. contacto@empresa.com" />
                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                  </div>
                  {editingId && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
                      <select {...register('estado')} className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white ${errors.estado ? 'border-red-500' : 'border-gray-300'}`}>
                        <option value="activo">Activo</option>
                        <option value="inactivo">Inactivo</option>
                      </select>
                      {errors.estado && <p className="mt-1 text-xs text-red-500">{errors.estado.message}</p>}
                    </div>
                  )}
                </div>

                {/* Datos del Vehículo */}
                <div className="border-t border-gray-100 pt-4 mb-6">
                  <h4 className="text-sm font-medium text-gray-800 mb-3">Datos del Vehículo Asignado</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Patente Tractor <span className="text-red-500">*</span></label>
                      <input {...register('patenteTractor')} type="text" className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.patenteTractor ? 'border-red-500' : 'border-gray-300'}`} placeholder="Ej. AB 123 CD" />
                      {errors.patenteTractor && <p className="mt-1 text-xs text-red-500">{errors.patenteTractor.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Patente Acoplado</label>
                      <input {...register('patenteAcoplado')} type="text" className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.patenteAcoplado ? 'border-red-500' : 'border-gray-300'}`} placeholder="Ej. AC 456 DE" />
                      {errors.patenteAcoplado && <p className="mt-1 text-xs text-red-500">{errors.patenteAcoplado.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Unidad</label>
                      <select {...register('tipoUnidad')} className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white ${errors.tipoUnidad ? 'border-red-500' : 'border-gray-300'}`}>
                        <option value="Semi">Semi-remolque</option>
                        <option value="Chasis">Chasis</option>
                        <option value="Acoplado">Chasis con Acoplado</option>
                        <option value="Utilitario">Utilitario</option>
                      </select>
                      {errors.tipoUnidad && <p className="mt-1 text-xs text-red-500">{errors.tipoUnidad.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Servicio</label>
                      <select {...register('tipoServicio')} className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white ${errors.tipoServicio ? 'border-red-500' : 'border-gray-300'}`}>
                        <option value="corta_distancia">🚚 Corta Distancia (entregas directas)</option>
                        <option value="larga_distancia">🚛 Larga Distancia (solo depósitos)</option>
                      </select>
                      {errors.tipoServicio && <p className="mt-1 text-xs text-red-500">{errors.tipoServicio.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Vencimiento Seguro (Vehículo)</label>
                      <input {...register('vencimientoSeguro')} type="date" className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.vencimientoSeguro ? 'border-red-500' : 'border-gray-300'}`} />
                      {errors.vencimientoSeguro && <p className="mt-1 text-xs text-red-500">{errors.vencimientoSeguro.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Vencimiento VTV / RTO</label>
                      <input {...register('vencimientoVtv')} type="date" className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.vencimientoVtv ? 'border-red-500' : 'border-gray-300'}`} />
                      {errors.vencimientoVtv && <p className="mt-1 text-xs text-red-500">{errors.vencimientoVtv.message}</p>}
                    </div>
                  </div>
                </div>

                {/* Datos del Chofer */}
                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-sm font-medium text-gray-800 mb-3">Datos del Chofer</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Nombre Completo</label>
                      <input {...register('nombreChofer')} type="text" className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.nombreChofer ? 'border-red-500' : 'border-gray-300'}`} placeholder="Ej. Carlos Gómez" />
                      {errors.nombreChofer && <p className="mt-1 text-xs text-red-500">{errors.nombreChofer.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">DNI Chofer</label>
                      <input {...register('dniChofer')} type="text" className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.dniChofer ? 'border-red-500' : 'border-gray-300'}`} placeholder="Ej. 25123456" />
                      {errors.dniChofer && <p className="mt-1 text-xs text-red-500">{errors.dniChofer.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Vencimiento Licencia</label>
                      <input {...register('vencimientoLicencia')} type="date" className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.vencimientoLicencia ? 'border-red-500' : 'border-gray-300'}`} />
                      {errors.vencimientoLicencia && <p className="mt-1 text-xs text-red-500">{errors.vencimientoLicencia.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Vencimiento Psicofísico (LINTI)</label>
                      <input {...register('vencimientoLinti')} type="date" className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.vencimientoLinti ? 'border-red-500' : 'border-gray-300'}`} />
                      {errors.vencimientoLinti && <p className="mt-1 text-xs text-red-500">{errors.vencimientoLinti.message}</p>}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 flex-shrink-0">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={tercerosLoading} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  {tercerosLoading ? 'Guardando...' : (editingId ? 'Actualizar Tercero' : 'Guardar Tercero')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
