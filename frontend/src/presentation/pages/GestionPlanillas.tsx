import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FileText, Truck, Clock, Plus, Eye, Check, X, AlertCircle, Download, Pencil, Trash2, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { usePlanillas } from '../../application/hooks/usePlanillas';
import { useFlota } from '../../application/context/FlotaContext';
import { Planilla, Remito } from '../../domain/models/Planilla';
import { generateQRImage } from '../utils/barcode';
import { planillaSchema, PlanillaFormData, remitoSchema } from '../../domain/schemas/planilla.schema';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import { LABELS } from '../../application/constants/labels';
import { z } from 'zod';

type RemitoFormData = z.infer<typeof remitoSchema>;

export default function GestionPlanillas() {
  const { planillasBorrador, planillasViaje, todasLasPlanillas, planillasLoading, planillasError, guardarBorrador, confirmarViaje, actualizarPlanilla, refreshPlanillas } = usePlanillas();
  const { depositos, unidades, choferes } = useFlota();
  
  const [isCreating, setIsCreating] = useState(false);
  const [planillaToConfirm, setPlanillaToConfirm] = useState<Planilla | null>(null);
  const [kmSalidaInput, setKmSalidaInput] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const { common: c, logistics: { planillas: p } } = LABELS;

  // Planilla Form
  const { register: registerPlanilla, control: controlPlanilla, handleSubmit: submitPlanilla, reset: resetPlanilla, watch: watchPlanilla, formState: { errors: errorsPlanilla } } = useForm<PlanillaFormData>({
    resolver: zodResolver(planillaSchema),
    defaultValues: {
      sucursalOrigen: '',
      sucursalDestino: '',
      fechaSalidaEstimada: '',
      fechaLlegadaEstimada: '',
      camion: '',
      chofer: '',
      comentarios: '',
      estado: 'borrador',
      remitos: []
    }
  });

  const { fields: remitosFields, append: appendRemito, remove: removeRemito } = useFieldArray({
    control: controlPlanilla,
    name: "remitos"
  });

  const watchSucursalOrigen = watchPlanilla('sucursalOrigen');
  const watchFechaSalida = watchPlanilla('fechaSalidaEstimada');
  const isHeaderComplete = !!(watchSucursalOrigen && watchFechaSalida);

  // Remito Form (Inline)
  const { register: registerRemito, handleSubmit: submitRemitoForm, reset: resetRemito, formState: { errors: errorsRemito, isValid: isValidRemito } } = useForm<RemitoFormData>({
    resolver: zodResolver(remitoSchema),
    mode: 'onChange',
    defaultValues: {
      numeroRemito: '',
      remitente: '',
      destinatario: '',
      direccion: '',
      whatsapp: '',
      bultos: 1,
      valorDeclarado: 0
    }
  });

  const onAddRemito = (data: RemitoFormData) => {
    appendRemito(data);
    resetRemito();
  };

  const handleGuardarBorador = (data: PlanillaFormData) => {
    const pData: Planilla = {
      id: editingId || `PLN-${Math.floor(Math.random() * 10000)}`,
      sucursalOrigen: data.sucursalOrigen,
      sucursalDestino: data.sucursalDestino || undefined,
      fechaSalidaEstimada: data.fechaSalidaEstimada || undefined,
      fechaLlegadaEstimada: data.fechaLlegadaEstimada || undefined,
      camion: data.camion || undefined,
      chofer: data.chofer || undefined,
      comentarios: data.comentarios || undefined,
      estado: 'borrador',
      remitos: (data.remitos || []) as Remito[],
    };

    if (editingId) {
      actualizarPlanilla(editingId, pData);
    } else {
      guardarBorrador(pData);
    }
    
    setIsCreating(false);
    setEditingId(null);
    resetPlanilla();
  };

  const openConfirmModal = (planilla: Planilla, viewMode: boolean = false) => {
    setPlanillaToConfirm(planilla);
    setKmSalidaInput('');
    if (viewMode) {
      setShowViewModal(true);
      setShowConfirmModal(false);
    } else {
      setShowConfirmModal(true);
      setShowViewModal(false);
    }
  };

  const closeModals = () => {
    setShowConfirmModal(false);
    setShowViewModal(false);
    setPlanillaToConfirm(null);
    setKmSalidaInput('');
  };

  const handleConfirmViaje = () => {
    if (!planillaToConfirm || !kmSalidaInput) return;
    const km = parseFloat(kmSalidaInput);
    if (isNaN(km) || km < 0) {
      alert('Por favor ingrese un kilometraje válido.');
      return;
    }
    confirmarViaje(planillaToConfirm.id, km);
    closeModals();
  };

  const handleEditPlanilla = (planilla: Planilla) => {
    setEditingId(planilla.id);
    resetPlanilla({
      sucursalOrigen: planilla.sucursalOrigen,
      sucursalDestino: planilla.sucursalDestino || '',
      fechaSalidaEstimada: planilla.fechaSalidaEstimada || '',
      fechaLlegadaEstimada: planilla.fechaLlegadaEstimada || '',
      camion: planilla.camion || '',
      chofer: planilla.chofer || '',
      comentarios: planilla.comentarios || '',
      estado: 'borrador',
      remitos: planilla.remitos as any
    });
    setIsCreating(true);
  };

  const openNuevaPlanilla = () => {
    setEditingId(null);
    resetPlanilla({
      sucursalOrigen: '', sucursalDestino: '', fechaSalidaEstimada: '', fechaLlegadaEstimada: '', camion: '', chofer: '', comentarios: '', estado: 'borrador', remitos: []
    });
    resetRemito();
    setIsCreating(true);
  };

  const generatePlanillaPDF = async (planilla: Planilla) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('TRANSPORTES RÍO LAVAYÉN', 105, 18, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`${p.detailsTitle}: ${planilla.id}`, 105, 26, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Sucursal Origen: ${planilla.sucursalOrigen}`, 14, 36);
    if (planilla.sucursalDestino) {
      doc.text(`Sucursal Destino: ${planilla.sucursalDestino}`, 14, 42);
      doc.text(`Camión: ${planilla.camion || '-'} | Chofer: ${planilla.chofer || '-'}`, 14, 48);
      doc.text(`Salida Est.: ${planilla.fechaSalidaEstimada || '-'} | Llegada Est.: ${planilla.fechaLlegadaEstimada || '-'}`, 14, 54);
    } else {
      doc.text(`Camión: ${planilla.camion || '-'} | Chofer: ${planilla.chofer || '-'}`, 14, 42);
      doc.text(`Salida Est.: ${planilla.fechaSalidaEstimada || '-'} | Llegada Est.: ${planilla.fechaLlegadaEstimada || '-'}`, 14, 48);
    }
    const kmTxt = planilla.kmSalida !== undefined ? `${p.kmSalida}: ${planilla.kmSalida}` : `${p.kmSalida}: -`;
    doc.text(kmTxt, 14, planilla.sucursalDestino ? 60 : 54);
    
    let startY = planilla.sucursalDestino ? 60 : 54;
    if (planilla.comentarios) {
      doc.text(`Comentarios: ${planilla.comentarios}`, 14, startY);
      startY += 6;
    }

    try {
      const planillaQR = await generateQRImage({
        planilla: planilla.id,
        origen: planilla.sucursalOrigen,
        destino: planilla.sucursalDestino || 'N/A',
        chofer: planilla.chofer,
        remitos: planilla.remitos.length,
        bultos: planilla.remitos.reduce((a, b) => a + b.bultos, 0),
      }, 3);
      if (planillaQR) {
        doc.text('QR de Planilla:', 140, 36);
        doc.addImage(planillaQR, 'PNG', 145, 40, 30, 30);
      }
    } catch (err) {}

    const tableData = planilla.remitos.map(r => [
      r.seguimiento || '-', r.numeroRemito, r.remitente, r.destinatario, r.direccion || '-', r.whatsapp || '-', r.bultos.toString(), `$${r.valorDeclarado.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: startY + 10,
      head: [['Seguimiento', 'Nº Remito', 'Remitente', 'Destinatario', 'Dirección', 'WhatsApp', 'Bultos', 'Valor']],
      body: tableData,
      foot: [['', '', '', '', '', 'Totales:', planilla.remitos.reduce((a,b)=>a+b.bultos,0).toString(), `$${planilla.remitos.reduce((a,b)=>a+b.valorDeclarado,0).toFixed(2)}`]],
    });

    doc.save(`Planilla_${planilla.id}.pdf`);
  };

  const paginatedPlanillas = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return todasLasPlanillas.slice(startIndex, startIndex + itemsPerPage);
  }, [todasLasPlanillas, currentPage]);
  const totalPages = Math.ceil(todasLasPlanillas.length / itemsPerPage);

  const watchRemitosFields = watchPlanilla('remitos') || [];
  const totalRemitos = watchRemitosFields.length;
  const totalBultos = watchRemitosFields.reduce((acc, r) => acc + (r.bultos || 0), 0);
  const totalValor = watchRemitosFields.reduce((acc, r) => acc + (r.valorDeclarado || 0), 0);

  return (
    <div className="space-y-6 relative h-full overflow-y-auto pr-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isCreating ? p.new : p.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{isCreating ? p.subtitleNew : p.subtitle}</p>
        </div>
        {!isCreating ? (
          <button onClick={openNuevaPlanilla} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-2">
            <Plus size={16} /> {p.createNew}
          </button>
        ) : (
          <button onClick={() => setIsCreating(false)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">
            {c.actions.back}
          </button>
        )}
      </div>

      {planillasError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{planillasError}</span>
          <button onClick={refreshPlanillas} className="text-red-500 hover:text-red-700"><X size={18} /></button>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && planillaToConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-7xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Eye className="text-indigo-600" size={20} />
                {p.detailsTitle}
                <span className="ml-2 text-sm font-normal text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">{planillaToConfirm.id}</span>
              </h3>
              <button onClick={closeModals} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-200"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-6 bg-white border-b border-gray-200">
              <div><p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Sucursal Origen</p><p className="font-semibold text-gray-900 mt-1">{planillaToConfirm.sucursalOrigen}</p></div>
              <div><p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Sucursal Destino</p><p className="font-semibold text-gray-900 mt-1">{planillaToConfirm.sucursalDestino || '—'}</p></div>
              <div><p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Camión</p><p className="font-semibold text-gray-900 mt-1">{planillaToConfirm.camion || '—'}</p></div>
              <div><p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Chofer</p><p className="font-semibold text-gray-900 mt-1">{planillaToConfirm.chofer || '—'}</p></div>
              <div><p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Salida Est.</p><p className="font-semibold text-gray-900 mt-1">{planillaToConfirm.fechaSalidaEstimada || '—'}</p></div>
              <div><p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Llegada Est.</p><p className="font-semibold text-gray-900 mt-1">{planillaToConfirm.fechaLlegadaEstimada || '—'}</p></div>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Remitos ({planillaToConfirm.remitos.length})</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="py-2 px-3">Seguimiento</th><th className="py-2 px-3">Nº Remito</th><th className="py-2 px-3">Remitente</th><th className="py-2 px-3">Destinatario</th><th className="py-2 px-3">Bultos</th><th className="py-2 px-3 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {planillaToConfirm.remitos.map((r, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3 font-mono text-xs text-indigo-600">{r.seguimiento || '—'}</td>
                        <td className="py-2 px-3">{r.numeroRemito}</td><td className="py-2 px-3">{r.remitente}</td><td className="py-2 px-3">{r.destinatario}</td><td className="py-2 px-3">{r.bultos}</td><td className="py-2 px-3 text-right">${r.valorDeclarado.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && planillaToConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><Truck className="text-indigo-600" size={20} /> {p.confirmTripTitle}</h3>
              <button onClick={closeModals} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-4">
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg">
                <label className="block text-sm font-medium text-indigo-900 mb-2">{p.kmSalida} <span className="text-red-500">*</span></label>
                <div className="flex gap-3">
                  <input type="number" min="0" value={kmSalidaInput} onChange={(e) => setKmSalidaInput(e.target.value)} className="flex-1 px-3 py-2 border border-indigo-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" autoFocus />
                  <span className="inline-flex items-center px-3 bg-indigo-100 text-indigo-800 rounded-md border border-indigo-200 font-medium">KM</span>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={closeModals} className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">{c.actions.cancel}</button>
              <button onClick={handleConfirmViaje} disabled={!kmSalidaInput} className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${!kmSalidaInput ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700 shadow-sm'}`}><Check size={18} /> {p.confirmTripTitle}</button>
            </div>
          </div>
        </div>
      )}

      {!isCreating ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-80">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><Clock size={18} className="text-amber-500" /> {p.draftTitle}</h3>
                <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{planillasBorrador.length}</span>
              </div>
              <div className="p-4 flex-1 overflow-y-auto">
                {planillasLoading ? <LoadingState message={c.actions.loading} /> : planillasBorrador.length === 0 ? <p className="text-center text-gray-400 text-sm mt-10">{p.noDrafts}</p> : (
                  <div className="space-y-3">
                    {planillasBorrador.map(p => (
                      <div key={p.id} className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-indigo-600">{p.id}</span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{p.sucursalOrigen}{p.sucursalDestino ? ` → ${p.sucursalDestino}` : ''}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <div className="text-sm text-gray-600"><span className="font-medium">{p.remitos.length}</span> remitos</div>
                          <div className="flex gap-2">
                            <button onClick={() => openConfirmModal(p, true)} className="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors" title={c.actions.edit}><Eye size={18} /></button>
                            <button onClick={() => openConfirmModal(p, false)} className="p-1.5 text-green-600 bg-green-50 hover:bg-green-100 rounded transition-colors" title={p.confirmTripTitle}><Check size={18} /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-80">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><Truck size={18} className="text-indigo-500" /> {p.tripTitle}</h3>
                <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{planillasViaje.length}</span>
              </div>
              <div className="p-4 flex-1 overflow-y-auto">
                {planillasLoading ? <LoadingState message={c.actions.loading} /> : planillasViaje.length === 0 ? <p className="text-center text-gray-400 text-sm mt-10">{p.noTrips}</p> : (
                  <div className="space-y-3">
                    {planillasViaje.map(p => (
                      <div key={p.id} className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-indigo-600">{p.id}</span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{p.sucursalOrigen}{p.sucursalDestino ? ` → ${p.sucursalDestino}` : ''}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <div className="text-sm text-gray-600"><span className="font-medium">{p.remitos.length}</span> remitos</div>
                          <div className="flex gap-2">
                            <button onClick={() => generatePlanillaPDF(p)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors" title={c.actions.downloadPdf}><Download size={18} /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-6">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FileText size={18} className="text-gray-500" /> {p.historyTitle}
              </h3>
            </div>
            
            {planillasLoading ? <LoadingState message={c.actions.loading} /> : todasLasPlanillas.length === 0 ? (
              <EmptyState title={p.noHistory} description={p.subtitleNew} icon={FileText} action={{ label: p.createNew, onClick: openNuevaPlanilla }} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 font-medium">ID Planilla</th>
                      <th className="px-4 py-3 font-medium">Origen → Destino</th>
                      <th className="px-4 py-3 font-medium">Fechas</th>
                      <th className="px-4 py-3 font-medium">Remitos / Bultos</th>
                      <th className="px-4 py-3 font-medium">Estado</th>
                      <th className="px-4 py-3 font-medium text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedPlanillas.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-indigo-600">{p.id}</td>
                        <td className="px-4 py-3 text-gray-600">{p.sucursalOrigen}{p.sucursalDestino ? ` → ${p.sucursalDestino}` : ''}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs"><div>S: {p.fechaSalidaEstimada || '-'}</div><div>L: {p.fechaLlegadaEstimada || '-'}</div></td>
                        <td className="px-4 py-3 text-gray-600">{p.remitos.length} rem. ({p.remitos.reduce((a,b)=>a+b.bultos,0)} bts)</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            p.estado === 'borrador' ? 'bg-amber-100 text-amber-800' :
                            p.estado === 'viaje' ? 'bg-indigo-100 text-indigo-800' :
                            p.estado === 'completo' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>{p.estado}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {p.estado === 'borrador' && (
                              <button onClick={() => handleEditPlanilla(p)} className="p-1.5 text-gray-500 hover:text-amber-600" title={c.actions.edit}><Pencil size={18} /></button>
                            )}
                            <button onClick={() => openConfirmModal(p, true)} className="p-1.5 text-gray-500 hover:text-indigo-600" title={c.actions.search}><Eye size={18} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {todasLasPlanillas.length > 0 && (
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={todasLasPlanillas.length} />
            )}
          </div>
        </>
      ) : (
        <form onSubmit={submitPlanilla(handleGuardarBorador)} className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden transition-all duration-300">
          <div className="p-4 sm:p-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm relative overflow-hidden mb-6">
              <div className="flex justify-between items-center mb-4">
                 <h4 className="text-md font-medium text-gray-800">{p.step1}</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">ID Planilla</label>
                  <input type="text" disabled value={editingId || 'Generando...'} className="w-full px-3 py-2 border rounded-md text-sm bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sucursal Origen <span className="text-red-500">*</span></label>
                  <select {...registerPlanilla('sucursalOrigen')} className={`w-full px-3 py-2 border rounded-md text-sm outline-none ${errorsPlanilla.sucursalOrigen ? 'border-red-500' : 'border-gray-300'}`}>
                    <option value="">Seleccionar Sucursal</option>
                    {depositos.filter(d => d.estado === 'activo' || d.estado === 'Operativo').map(dep => <option key={dep.id} value={dep.nombre}>{dep.nombre}</option>)}
                  </select>
                  {errorsPlanilla.sucursalOrigen && <p className="text-xs text-red-500 mt-1">{errorsPlanilla.sucursalOrigen.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sucursal Destino</label>
                  <select {...registerPlanilla('sucursalDestino')} className={`w-full px-3 py-2 border rounded-md text-sm outline-none ${errorsPlanilla.sucursalDestino ? 'border-red-500' : 'border-gray-300'}`}>
                    <option value="">Seleccionar Destino</option>
                    {depositos.filter(d => d.estado === 'activo' || d.estado === 'Operativo').map(dep => <option key={dep.id} value={dep.nombre}>{dep.nombre}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Camión</label>
                  <select {...registerPlanilla('camion')} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none">
                    <option value="">Seleccionar Camión</option>
                    {unidades.filter(u => u.estado === 'DISPONIBLE').map(uni => <option key={uni.id} value={`${uni.marca} ${uni.modelo} - ${uni.patente}`}>{uni.marca} {uni.modelo} - {uni.patente}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Chofer</label>
                  <select {...registerPlanilla('chofer')} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none">
                    <option value="">Seleccionar Chofer</option>
                    {choferes.filter(c => c.estado === 'DISPONIBLE').map(chofer => <option key={chofer.id} value={chofer.nombre}>{chofer.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Salida Estimada</label>
                  <input type="date" {...registerPlanilla('fechaSalidaEstimada')} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Llegada Estimada</label>
                  <input type="date" {...registerPlanilla('fechaLlegadaEstimada')} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none" />
                </div>
              </div>
            </div>

            <div className={`mb-6 relative bg-white p-4 rounded-lg border shadow-sm transition-all duration-300 ${isHeaderComplete ? 'border-gray-200' : 'border-gray-200 opacity-60'}`}>
              {!isHeaderComplete && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 backdrop-blur-sm rounded-lg">
                  <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200 text-sm text-gray-600 flex items-center gap-2">
                    <AlertCircle size={16} className="text-amber-500" /> {p.headerCompleteMsg}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center mb-3">
                <h4 className="text-md font-medium text-gray-800">{p.step2}</h4>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase">
                      <th className="px-4 py-3">Nº Remito</th><th className="px-4 py-3">Remitente</th><th className="px-4 py-3">Destinatario</th><th className="px-4 py-3">Dirección</th><th className="px-4 py-3">WhatsApp</th><th className="px-4 py-3">Bultos</th><th className="px-4 py-3">Valor Decl.</th><th className="px-4 py-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-gray-100">
                    {remitosFields.map((remito, idx) => (
                      <tr key={remito.id} className="bg-green-50/10">
                        <td className="px-4 py-3 text-gray-800">{remito.numeroRemito}</td>
                        <td className="px-4 py-3 text-gray-800">{remito.remitente}</td>
                        <td className="px-4 py-3 text-gray-800">{remito.destinatario}</td>
                        <td className="px-4 py-3 text-gray-800">{remito.direccion || '-'}</td>
                        <td className="px-4 py-3 text-gray-800">{remito.whatsapp || '-'}</td>
                        <td className="px-4 py-3 text-gray-800">{remito.bultos}</td>
                        <td className="px-4 py-3 text-gray-800">${remito.valorDeclarado.toFixed(2)}</td>
                        <td className="px-4 py-3 text-center text-red-500">
                          <button type="button" onClick={() => removeRemito(idx)} className="hover:text-red-700" title={c.actions.delete}><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                    
                    <tr className="bg-gray-50/50 border-l-4 border-l-gray-400">
                      <td className="px-2 py-2"><input {...registerRemito('numeroRemito')} type="text" className={`w-full px-2 py-1.5 border rounded text-sm ${errorsRemito.numeroRemito ? 'border-red-500' : 'border-gray-300'}`} placeholder="Nº" /></td>
                      <td className="px-2 py-2"><input {...registerRemito('remitente')} type="text" className={`w-full px-2 py-1.5 border rounded text-sm ${errorsRemito.remitente ? 'border-red-500' : 'border-gray-300'}`} placeholder="Remitente" /></td>
                      <td className="px-2 py-2"><input {...registerRemito('destinatario')} type="text" className={`w-full px-2 py-1.5 border rounded text-sm ${errorsRemito.destinatario ? 'border-red-500' : 'border-gray-300'}`} placeholder="Destinatario" /></td>
                      <td className="px-2 py-2"><input {...registerRemito('direccion')} type="text" className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" placeholder="Dirección" /></td>
                      <td className="px-2 py-2"><input {...registerRemito('whatsapp')} type="text" className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" placeholder="WhatsApp" /></td>
                      <td className="px-2 py-2"><input {...registerRemito('bultos', { valueAsNumber: true })} type="number" min="1" className="w-16 px-2 py-1.5 border border-gray-300 rounded text-sm" /></td>
                      <td className="px-2 py-2"><input {...registerRemito('valorDeclarado', { valueAsNumber: true })} type="number" min="0" className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm" /></td>
                      <td className="px-2 py-2 text-center">
                        <button type="button" onClick={submitRemitoForm(onAddRemito)} className="bg-indigo-600 text-white p-1.5 rounded hover:bg-indigo-700 shadow-sm" title={c.actions.save}><Plus size={18} /></button>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-gray-50 border-t border-gray-200 font-medium text-gray-700">
                    <tr>
                      <td colSpan={5} className="px-4 py-3 text-right">Totales en tiempo real:</td>
                      <td className="px-4 py-3">{totalBultos} bultos</td><td className="px-4 py-3">${totalValor.toFixed(2)}</td><td className="px-4 py-3 text-center">{totalRemitos} remitos</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-6 pt-4 border-t border-gray-100 gap-4">
              <div className="w-full sm:w-1/2 lg:w-1/3">
                <label className="block text-xs font-medium text-gray-500 mb-1">Comentarios (Opcional)</label>
                <input {...registerPlanilla('comentarios')} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none" placeholder="Añadir nota..." />
              </div>
              <button type="submit" disabled={!isHeaderComplete || totalRemitos === 0} className={`px-6 py-2.5 font-medium rounded-lg transition-all flex items-center gap-2 ${(!isHeaderComplete || totalRemitos === 0) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-indigo-600 text-indigo-600 hover:bg-indigo-50'}`}>
                <Clock size={18} /> {p.saveDraft}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
