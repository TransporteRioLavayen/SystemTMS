import React, { useState, useMemo } from "react";
import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerTooltip,
} from "../../components/ui/map";
import { OverviewCard } from "./components/overview-card";
import { BreakdownCard } from "./components/breakdown-card";
import {
  locations,
  visitedPagesRows,
  countriesRows,
  referrersRows,
  browsersRows,
} from "./components/data";
import { Building, Plus, X, MapPin, Box, User, Trash2, Pencil } from "lucide-react";
import { useFlota, Deposito } from "../../application/context/FlotaContext";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { depositoSchema, DepositoFormData } from '../../domain/schemas/deposito.schema';
import { Pagination } from "../../components/ui/Pagination";
import { EmptyState } from "../../components/ui/EmptyState";
import { LABELS } from "../../application/constants/labels";

const MAP_HEIGHT = "38rem";

export default function GestionDepositos() {
  const { depositos, agregarDeposito, actualizarDeposito, eliminarDeposito } = useFlota();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { common: c, admin: { depositos: d } } = LABELS;

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<DepositoFormData>({
    resolver: zodResolver(depositoSchema),
    defaultValues: {
      nombre: '',
      ubicacion: '',
      capacidad: 0,
      estado: 'activo' as any,
      encargado: '',
      lat: 0,
      lng: 0,
      gln: ''
    }
  });

  const handleEliminarDeposito = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este depósito?')) {
      try {
        await eliminarDeposito(id);
      } catch (error: any) {
        alert(error.message || 'Error al eliminar depósito');
      }
    }
  };

  const abrirNuevo = () => {
    setEditingId(null);
    reset({ 
      nombre: '', 
      ubicacion: '', 
      capacidad: 0, 
      estado: 'activo' as any, 
      encargado: '', 
      lat: 0, 
      lng: 0,
      gln: ''
    });
    setShowModal(true);
  };

  const abrirEditar = (deposito: Deposito) => {
    setEditingId(deposito.id);
    reset({
      nombre: deposito.nombre,
      ubicacion: deposito.ubicacion,
      capacidad: parseInt(deposito.capacidad.toString()) || 0,
      estado: deposito.estado as any,
      encargado: deposito.encargado || '',
      lat: Number(deposito.lat) || 0,
      lng: Number(deposito.lng) || 0,
      gln: deposito.gln || ''
    });
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditingId(null);
    reset();
  };

  const onSubmit = async (data: DepositoFormData) => {
    try {
      if (editingId) {
        await actualizarDeposito(editingId, data as any);
      } else {
        await agregarDeposito(data as any);
      }
      cerrarModal();
    } catch (error: any) {
      alert(error.message || 'Error al guardar depósito');
    }
  };

  // Combine static locations with dynamic depositos for the map
  const mapMarkers = useMemo(() => depositos.map(dep => ({
    id: dep.id,
    city: dep.nombre,
    lng: dep.lng || -64,
    lat: dep.lat || -34,
    size: 15,
    estado: dep.estado || 'activo'
  })), [depositos]);

  const paginatedDepositos = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return depositos.slice(startIndex, startIndex + itemsPerPage);
  }, [depositos, currentPage]);

  const totalPages = Math.ceil(depositos.length / itemsPerPage);

  return (
    <div className="space-y-6 h-full overflow-y-auto pr-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{d.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {d.subtitle}
          </p>
        </div>
      </div>

      <div
        className="bg-background relative rounded-xl overflow-hidden border border-gray-200 shadow-sm"
        style={{ "--map-height": MAP_HEIGHT } as React.CSSProperties}
      >
        <div className="relative h-(--map-height)">
          <Map
            center={[-64, -34]}
            zoom={4}
            scrollZoom={false}
            renderWorldCopies={true}
          >
            <MapControls showFullscreen />
            {mapMarkers.map((location) => (
              <MapMarker
                key={location.id}
                longitude={location.lng}
                latitude={location.lat}
              >
                <MarkerContent>
                  <div
                    className={`rounded-full ${location.estado === 'activo' || location.estado === 'Operativo' ? 'bg-indigo-500/70' : location.estado === 'Mantenimiento' ? 'bg-amber-500/70' : 'bg-red-500/70'}`}
                    style={{
                      width: location.size * 2,
                      height: location.size * 2,
                    }}
                  />
                </MarkerContent>
                <MarkerTooltip
                  offset={20}
                  className="bg-background text-foreground border"
                >
                  <p className="text-muted-foreground font-medium">
                    {location.city}
                  </p>
                  <p className="mt-0.5 text-xs">{location.estado}</p>
                </MarkerTooltip>
              </MapMarker>
            ))}
          </Map>
          <div
            className="via-background/30 to-background pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-linear-to-b from-transparent"
            aria-hidden
          />
          <OverviewCard />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <BreakdownCard title="Depósitos más activos" rows={visitedPagesRows} />
        <BreakdownCard title="Tipos de Carga" rows={referrersRows} />
        <BreakdownCard title="Provincias" rows={countriesRows} />
        <BreakdownCard title="Estados de Depósito" rows={browsersRows} />
      </div>

      {/* Lista de Depósitos */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-6">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Building size={18} className="text-indigo-600" /> Depósitos Registrados
          </h3>
          <button onClick={abrirNuevo} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm">
            <Plus size={16} /> {d.new}
          </button>
        </div>
        
        {depositos.length === 0 ? (
          <EmptyState
            title="No hay depósitos registrados"
            description={d.subtitle}
            icon={Building}
            action={{ label: d.new, onClick: abrirNuevo }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                <tr>
                  <th className="px-6 py-3 font-medium">Nombre</th>
                  <th className="px-6 py-3 font-medium">Ubicación</th>
                  <th className="px-6 py-3 font-medium">GLN</th>
                  <th className="px-6 py-3 font-medium">Capacidad</th>
                  <th className="px-6 py-3 font-medium">Estado</th>
                  <th className="px-6 py-3 font-medium">Encargado</th>
                  <th className="px-6 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedDepositos.map(deposito => (
                  <tr key={deposito.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-indigo-600 flex items-center gap-2">
                      <Building size={16} className="text-gray-400" />
                      {deposito.nombre}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <MapPin size={14} className="text-gray-400" />
                        {deposito.ubicacion}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {deposito.gln || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Box size={14} className="text-gray-400" />
                        {deposito.capacidad} pallets
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        deposito.estado === 'activo' || deposito.estado === 'Operativo' ? 'bg-green-100 text-green-800' : 
                        deposito.estado === 'Mantenimiento' ? 'bg-amber-100 text-amber-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {deposito.estado || 'Activo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <User size={14} className="text-gray-400" />
                        {deposito.encargado || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => abrirEditar(deposito)} className="text-blue-500 hover:text-blue-700 transition-colors p-2 rounded-md hover:bg-blue-50" title="Editar depósito">
                          <Pencil size={18} />
                        </button>
                        <button onClick={() => handleEliminarDeposito(deposito.id)} className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-md hover:bg-red-50" title="Eliminar depósito">
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

        {depositos.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={depositos.length}
          />
        )}
      </div>

      {/* Modal Nuevo Depósito */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Building className="text-indigo-600" size={20} />
                {editingId ? d.edit : d.new}
              </h3>
              <button onClick={cerrarModal} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-200">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nombre del Depósito <span className="text-red-500">*</span></label>
                    <input {...register('nombre')} type="text" className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.nombre ? 'border-red-500' : 'border-gray-300'}`} placeholder="Ej. Depósito Central Norte" />
                    {errors.nombre && <p className="mt-1 text-xs text-red-500">{errors.nombre.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Ubicación (Ciudad/Provincia) <span className="text-red-500">*</span></label>
                    <input {...register('ubicacion')} type="text" className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.ubicacion ? 'border-red-500' : 'border-gray-300'}`} placeholder="Ej. Córdoba Capital" />
                    {errors.ubicacion && <p className="mt-1 text-xs text-red-500">{errors.ubicacion.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Capacidad (Pallets) <span className="text-red-500">*</span></label>
                    <input {...register('capacidad')} type="number" className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.capacidad ? 'border-red-500' : 'border-gray-300'}`} placeholder="Ej. 1000" />
                    {errors.capacidad && <p className="mt-1 text-xs text-red-500">{errors.capacidad.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">GLN (Global Location Number)</label>
                    <input {...register('gln')} type="text" className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.gln ? 'border-red-500' : 'border-gray-300'}`} placeholder="Ej. 7790000000000" />
                    {errors.gln && <p className="mt-1 text-xs text-red-500">{errors.gln.message}</p>}
                  </div>
                  {editingId && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Estado <span className="text-red-500">*</span></label>
                      <select {...register('estado')} className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white ${errors.estado ? 'border-red-500' : 'border-gray-300'}`}>
                        <option value="activo">Activo</option>
                        <option value="inactivo">Inactivo</option>
                      </select>
                      {errors.estado && <p className="mt-1 text-xs text-red-500">{errors.estado.message}</p>}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Encargado</label>
                    <input {...register('encargado')} type="text" className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.encargado ? 'border-red-500' : 'border-gray-300'}`} placeholder="Nombre del responsable" />
                    {errors.encargado && <p className="mt-1 text-xs text-red-500">{errors.encargado.message}</p>}
                  </div>
                  <div className="sm:col-span-2 border-t border-gray-100 pt-4 mt-2">
                    <h4 className="text-sm font-medium text-gray-800 mb-3">Coordenadas para el Mapa</h4>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Latitud</label>
                    <input {...register('lat', { valueAsNumber: true })} type="number" step="any" className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.lat ? 'border-red-500' : 'border-gray-300'}`} placeholder="Ej. -34.6037" />
                    {errors.lat && <p className="mt-1 text-xs text-red-500">{errors.lat.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Longitud</label>
                    <input {...register('lng', { valueAsNumber: true })} type="number" step="any" className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.lng ? 'border-red-500' : 'border-gray-300'}`} placeholder="Ej. -58.3816" />
                    {errors.lng && <p className="mt-1 text-xs text-red-500">{errors.lng.message}</p>}
                  </div>
                </div>
              </div>
              
              <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <button type="button" onClick={cerrarModal} className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                  {editingId ? 'Guardar Cambios' : 'Guardar Depósito'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
