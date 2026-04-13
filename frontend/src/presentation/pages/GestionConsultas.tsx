// =============================================================================
// GESTION DE CONSULTAS PAGE - PRESENTATION
// =============================================================================
// Página para que ADMIN gestione consultas desde la landing page

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../application/context/AuthContext';
import { useToast } from '../../application/context/ToastContext';
import consultaService, { Consulta, ConsultaEstado } from '../../infrastructure/services/consultaService';
import { LoadingState } from '../../components/ui/LoadingState';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Mail, Phone, MessageSquare, Eye, Edit2, Trash2, Filter } from 'lucide-react';
import { cn } from '../../lib/utils';

const ESTADOS: ConsultaEstado[] = ['pendiente', 'en_proceso', 'respondida', 'cerrada'];

const estadoBadgeStyles: Record<ConsultaEstado, string> = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  en_proceso: 'bg-blue-100 text-blue-700',
  respondida: 'bg-green-100 text-green-700',
  cerrada: 'bg-gray-100 text-gray-700',
};

const tipoConsultaBadgeStyles: Record<string, string> = {
  reclamos: 'bg-red-50 text-red-700 border border-red-200',
  alquiler_unidades: 'bg-blue-50 text-blue-700 border border-blue-200',
  cargas_especiales: 'bg-purple-50 text-purple-700 border border-purple-200',
  cargas_internacionales: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  otro: 'bg-gray-50 text-gray-700 border border-gray-200',
};

export default function GestionConsultas(): React.ReactElement {
  const { hasRole } = useAuth();
  const toast = useToast();

  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [filtroEstado, setFiltroEstado] = useState<ConsultaEstado | ''>('');
  
  // Estados para visualizar/editar consulta
  const [selectedConsulta, setSelectedConsulta] = useState<Consulta | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [respuesta, setRespuesta] = useState('');
  const [nuevoEstado, setNuevoEstado] = useState<ConsultaEstado>('pendiente');
  const [isUpdating, setIsUpdating] = useState(false);

  // Verificar que el usuario es ADMIN
  if (!hasRole('ADMIN')) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-lg border border-gray-200 border-dashed">
          <div className="p-4 bg-gray-50 rounded-full mb-4">
            <Mail className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1 text-center">Acceso Denegado</h3>
          <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">
            No tienes permisos para acceder a esta sección.
          </p>
        </div>
      </div>
    );
  }

  const fetchConsultas = useCallback(async () => {
    try {
      setLoading(true);
      const data = await consultaService.listConsultas(
        page,
        limit,
        filtroEstado || undefined
      );
      setConsultas(data.data);
      setTotal(data.total);
    } catch (err) {
      toast.error('Error al cargar las consultas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filtroEstado, toast]);

  useEffect(() => {
    fetchConsultas();
  }, [fetchConsultas]);

  const handleViewConsulta = (consulta: Consulta) => {
    setSelectedConsulta(consulta);
    setIsViewDialogOpen(true);
  };

  const handleEditConsulta = (consulta: Consulta) => {
    setSelectedConsulta(consulta);
    setNuevoEstado(consulta.estado);
    setRespuesta(consulta.respuesta || '');
    setIsEditDialogOpen(true);
  };

  const handleUpdateConsulta = async () => {
    if (!selectedConsulta) return;

    setIsUpdating(true);
    try {
      await consultaService.updateConsulta(selectedConsulta.id, {
        estado: nuevoEstado,
        respuesta: respuesta || undefined,
      });

      toast.success('Consulta actualizada correctamente');
      setIsEditDialogOpen(false);
      setRespuesta('');
      fetchConsultas();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al actualizar la consulta';
      toast.error(errorMsg);
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteConsulta = async (id: string) => {
    const confirmed = window.confirm('¿Estás seguro de que deseas eliminar esta consulta?');
    if (!confirmed) return;

    try {
      await consultaService.deleteConsulta(id);
      toast.success('Consulta eliminada correctamente');
      fetchConsultas();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al eliminar la consulta';
      toast.error(errorMsg);
      console.error(err);
    }
  };

  const formatFecha = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTipoConsulta = (tipo: string): string => {
    const map: Record<string, string> = {
      reclamos: 'Reclamos',
      alquiler_unidades: 'Alquiler de Unidades',
      cargas_especiales: 'Cargas Especiales',
      cargas_internacionales: 'Cargas Internacionales',
      otro: 'Otro',
    };
    return map[tipo] || tipo;
  };

  if (loading) {
    return <LoadingState />;
  }

  if (consultas.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Consultas</h1>
          <p className="text-gray-500 mt-1">Consultas recibidas desde la landing page</p>
        </div>
        <EmptyState
          icon={Mail}
          title="Sin consultas"
          description="No hay consultas registradas aún"
        />
      </div>
    );
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Consultas</h1>
        <p className="text-gray-500 mt-1">Consultas recibidas desde la landing page</p>
      </div>

      {/* Filtro de estado */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtrar por estado:</span>
        </div>
        <Select value={filtroEstado} onValueChange={(value) => {
          setFiltroEstado(value as ConsultaEstado | '');
          setPage(1);
        }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los estados</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="en_proceso">En Proceso</SelectItem>
            <SelectItem value="respondida">Respondida</SelectItem>
            <SelectItem value="cerrada">Cerrada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla de consultas */}
      <div className="bg-white rounded-lg border shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {consultas.map((consulta) => (
              <TableRow key={consulta.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">{consulta.nombre}</TableCell>
                <TableCell className="text-gray-500">{consulta.email}</TableCell>
                <TableCell className="text-gray-500">
                  {consulta.telefono ? (
                    <a href={`tel:${consulta.telefono}`} className="text-indigo-600 hover:underline flex items-center gap-1">
                      <Phone size={14} />
                      {consulta.telefono}
                    </a>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>
                  <span className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    tipoConsultaBadgeStyles[consulta.tipoConsulta]
                  )}>
                    {formatTipoConsulta(consulta.tipoConsulta)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    estadoBadgeStyles[consulta.estado]
                  )}>
                    {consulta.estado.charAt(0).toUpperCase() + consulta.estado.slice(1).replace('_', ' ')}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {formatFecha(consulta.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleViewConsulta(consulta)}
                      className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Ver detalle"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleEditConsulta(consulta)}
                      className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteConsulta(consulta.id)}
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Mostrando <strong>{(page - 1) * limit + 1}</strong> a <strong>{Math.min(page * limit, total)}</strong> de <strong>{total}</strong> consultas
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            Anterior
          </Button>
          <span className="text-sm text-gray-500">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            Siguiente
          </Button>
        </div>
      </div>

      {/* Dialog para ver consulta */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle de Consulta</DialogTitle>
          </DialogHeader>
          {selectedConsulta && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Nombre</label>
                  <p className="font-medium text-gray-900">{selectedConsulta.nombre}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
                  <p className="text-blue-600 hover:underline cursor-pointer">
                    <a href={`mailto:${selectedConsulta.email}`}>{selectedConsulta.email}</a>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Teléfono</label>
                  <p className="font-medium text-gray-900">
                    {selectedConsulta.telefono ? (
                      <a href={`tel:${selectedConsulta.telefono}`} className="text-blue-600 hover:underline">
                        {selectedConsulta.telefono}
                      </a>
                    ) : (
                      '—'
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Tipo</label>
                  <span className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    tipoConsultaBadgeStyles[selectedConsulta.tipoConsulta]
                  )}>
                    {formatTipoConsulta(selectedConsulta.tipoConsulta)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Estado</label>
                  <span className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    estadoBadgeStyles[selectedConsulta.estado]
                  )}>
                    {selectedConsulta.estado.charAt(0).toUpperCase() + selectedConsulta.estado.slice(1).replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Fecha</label>
                  <p className="text-sm text-gray-600">{formatFecha(selectedConsulta.createdAt)}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Mensaje</label>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-gray-900 whitespace-pre-wrap">
                  {selectedConsulta.mensaje}
                </div>
              </div>

              {selectedConsulta.respuesta && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Respuesta</label>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-gray-900 whitespace-pre-wrap">
                    {selectedConsulta.respuesta}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar consulta */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Consulta</DialogTitle>
          </DialogHeader>
          {selectedConsulta && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
                <Select value={nuevoEstado} onValueChange={(value) => setNuevoEstado(value as ConsultaEstado)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS.map((estado) => (
                      <SelectItem key={estado} value={estado}>
                        {estado.charAt(0).toUpperCase() + estado.slice(1).replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Respuesta</label>
                <textarea
                  value={respuesta}
                  onChange={(e) => setRespuesta(e.target.value)}
                  placeholder="Escribe tu respuesta aquí..."
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 font-medium placeholder:text-gray-400 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all resize-none"
                />
              </div>

              {selectedConsulta.mensaje && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Consulta Original</label>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm text-gray-600 max-h-48 overflow-y-auto">
                    {selectedConsulta.mensaje}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateConsulta}
              disabled={isUpdating}
            >
              {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
