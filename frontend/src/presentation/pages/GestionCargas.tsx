import React, { useState } from 'react';
import { Package, Truck, CheckCircle, Eye, Check, Download, ClipboardCheck, Map, X, AlertCircle, Scale, Printer, RefreshCw } from 'lucide-react';
import { LABELS } from '../../application/constants/labels';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useCargas } from '../../application/hooks/useCargas';
import { Planilla, Remito } from '../../domain/models/Planilla';
import { generateBarcodeImage, generateQRImage } from '../utils/barcode';

export default function GestionCargas() {
  const {
    planillasViaje,
    planillasControl,
    planillasCompletadas,
    remitosListos,
    planillasLoading,
    isConfirmingLlegada,
    isConfirmingControl,
    confirmarLlegada,
    finalizarControl,
    refreshPlanillas,
  } = useCargas();

  const { common: c, admin: { cargas: ca } } = LABELS;
  
  // UI States para Modales
  const [planillaLlegada, setPlanillaLlegada] = useState<Planilla | null>(null);
  const [kmLlegadaInput, setKmLlegadaInput] = useState('');

  const [planillaControl, setPlanillaControl] = useState<Planilla | null>(null);
  const [remitosControl, setRemitosControl] = useState<Remito[]>([]);

  const [planillaView, setPlanillaView] = useState<Planilla | null>(null);

  const generatePlanillaPDF = async (planilla: Planilla) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Planilla de Viaje', 14, 22);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`ID: ${planilla.id}`, 14, 30);
    doc.text(`Sucursal Origen: ${planilla.sucursalOrigen}`, 14, 36);
    if (planilla.sucursalDestino) {
      doc.text(`Sucursal Destino: ${planilla.sucursalDestino}`, 14, 42);
      doc.text(`Fecha Salida Est.: ${planilla.fechaSalidaEstimada || '-'}`, 14, 48);
      doc.text(`Fecha Llegada Est.: ${planilla.fechaLlegadaEstimada || '-'}`, 14, 54);
    } else {
      doc.text(`Fecha Salida Est.: ${planilla.fechaSalidaEstimada || '-'}`, 14, 42);
      doc.text(`Fecha Llegada Est.: ${planilla.fechaLlegadaEstimada || '-'}`, 14, 48);
    }

    doc.text(`Camión: ${planilla.camion || '-'}`, 120, 30);
    doc.text(`Chofer: ${planilla.chofer || '-'}`, 120, 36);
    doc.text(`Estado: ${planilla.estado.toUpperCase()}`, 120, 42);
    if (planilla.kmSalida) doc.text(`KM Salida: ${planilla.kmSalida}`, 120, 48);

    let startY = planilla.sucursalDestino ? 60 : 55;

    // QR de la planilla
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
        doc.text('QR de Planilla:', 140, 58);
        doc.addImage(planillaQR, 'PNG', 145, 62, 30, 30);
      }
    } catch (err) {
      console.error('Error generando QR:', err);
    }

    if (planilla.comentarios) {
      doc.text('Comentarios:', 14, startY);
      doc.setFont('helvetica', 'italic');
      doc.text(planilla.comentarios, 14, startY + 6);
      doc.setFont('helvetica', 'normal');
      startY += 15;
    }

    const tableData = planilla.remitos.map(r => [
      r.seguimiento || '-',
      r.numeroRemito,
      r.remitente,
      r.destinatario,
      r.direccion || '-',
      r.whatsapp || '-',
      r.bultos.toString(),
      `$${r.valorDeclarado.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: startY + 10,
      head: [['Seguimiento', 'Nº Remito', 'Remitente', 'Destinatario', 'Dirección', 'WhatsApp', 'Bultos', 'Valor']],
      body: tableData,
      foot: [['', '', '', '', '', 'Totales:', planilla.remitos.reduce((a,b)=>a+b.bultos,0).toString(), `$${planilla.remitos.reduce((a,b)=>a+b.valorDeclarado,0).toFixed(2)}`]],
    });

    doc.save(`Planilla_${planilla.id}.pdf`);
  };

  const generateEtiquetasPDF = async (remito: Remito & { sucursalOrigen?: string }) => {
    // Label size: 100mm x 150mm (standard shipping label)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [100, 150]
    });

    const bultos = remito.bultosRecibidos || remito.bultos;
    const totalEtiquetas = 1 + bultos;

    // Pre-generar códigos
    let barcodeImg = '';
    let qrImg = '';
    
    try {
      if (remito.seguimiento) {
        barcodeImg = await generateBarcodeImage('code128', remito.seguimiento, {
          scale: 2,
          height: 8,
          showText: true,
        });
        qrImg = await generateQRImage({
          seguimiento: remito.seguimiento,
          remito: remito.numeroRemito,
          destinatario: remito.destinatario,
        }, 3);
      }
    } catch (err) {
      console.error('Error generando códigos:', err);
    }

    for (let i = 0; i < totalEtiquetas; i++) {
      if (i > 0) {
        doc.addPage();
      }

      // Border for the label
      doc.setLineWidth(0.5);
      doc.rect(5, 5, 90, 140);

      // Header
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Transporte Rio Lavayen', 50, 15, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('Mas de 30 años en el rubro', 50, 22, { align: 'center' });

      doc.setLineWidth(0.2);
      doc.line(5, 26, 95, 26);

      // Remito & Tracking
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Nº Remito: ${remito.numeroRemito}`, 10, 35);
      doc.text(`Seguimiento: ${remito.seguimiento || '-'}`, 10, 43);

      // Código de barras Code128
      if (barcodeImg && remito.seguimiento) {
        doc.addImage(barcodeImg, 'PNG', 15, 48, 70, 12);
      }

      doc.line(5, 62, 95, 62);

      // Details
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Remitente:', 10, 70);
      doc.setFont('helvetica', 'bold');
      doc.text(remito.remitente, 10, 76);

      doc.setFont('helvetica', 'normal');
      doc.text('Destinatario:', 10, 84);
      doc.setFont('helvetica', 'bold');
      doc.text(remito.destinatario, 10, 90);

      if (remito.direccion) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Dir: ${remito.direccion}`, 10, 96);
      }
      if (remito.whatsapp) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Wsp: ${remito.whatsapp}`, 10, 102);
      }

      doc.line(5, 106, 95, 106);

      // Bultos & Peso
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Cantidad de Bultos:', 10, 114);
      doc.setFont('helvetica', 'bold');
      doc.text(`${bultos}`, 50, 114);

      doc.setFont('helvetica', 'normal');
      doc.text('Peso:', 10, 122);
      doc.setFont('helvetica', 'bold');
      doc.text(`${remito.pesoTotal ? remito.pesoTotal.toFixed(2) : '0.00'} Kg`, 50, 122);

      // Etiqueta count
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      const etiquetaTipo = i === 0 ? 'Factura' : `Bulto ${i} de ${bultos}`;
      doc.text(`Etiqueta: ${etiquetaTipo}`, 50, 135, { align: 'center' });

      // QR en la esquina inferior derecha
      if (qrImg) {
        doc.addImage(qrImg, 'PNG', 72, 122, 18, 18);
      }
    }

    doc.save(`Etiquetas_${remito.numeroRemito}.pdf`);
  };

  const handleOpenLlegada = (p: Planilla) => {
    setPlanillaLlegada(p);
    setKmLlegadaInput('');
  };

  const handleConfirmLlegada = async () => {
    if (planillaLlegada && kmLlegadaInput) {
      try {
        await confirmarLlegada(planillaLlegada.id, Number(kmLlegadaInput));
        setPlanillaLlegada(null);
      } catch (error: any) {
        alert(error.message || 'Error al confirmar llegada');
      }
    }
  };

  const handleOpenControl = (p: Planilla) => {
    setPlanillaControl(p);
    setRemitosControl(p.remitos.map(r => ({ ...r, bultosRecibidos: r.bultos, pesoTotal: 0 })));
  };

  const handleUpdateRemitoControl = (remitoId: string, field: keyof Remito, value: any) => {
    setRemitosControl(prev => prev.map(r => r.id === remitoId ? { ...r, [field]: value } : r));
  };

  const handleConfirmControl = async () => {
    if (planillaControl) {
      try {
        await finalizarControl(planillaControl.id, remitosControl);
        setPlanillaControl(null);
      } catch (error: any) {
        alert(error.message || 'Error al finalizar control');
      }
    }
  };

  const bultosDeclaradosControl = planillaControl?.remitos.reduce((acc, r) => acc + r.bultos, 0) || 0;
  const bultosRecibidosControl = remitosControl.reduce((acc, r) => acc + (r.bultosRecibidos || 0), 0);
  const diferenciaBultos = bultosDeclaradosControl - bultosRecibidosControl;

  return (
    <div className="space-y-6 relative h-full overflow-y-auto pr-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{ca.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {ca.subtitle}
          </p>
        </div>
        <button
          onClick={refreshPlanillas}
          disabled={planillasLoading}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Actualizar datos"
        >
          <RefreshCw size={16} className={planillasLoading ? 'animate-spin' : ''} />
          {planillasLoading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {/* Loading overlay */}
      {planillasLoading && (
        <div className="fixed inset-0 z-40 bg-white/60 backdrop-blur-sm flex items-center justify-center">
          <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-xl shadow-lg border border-gray-200">
            <RefreshCw size={20} className="animate-spin text-indigo-600" />
            <span className="text-sm font-medium text-gray-700">Cargando datos...</span>
          </div>
        </div>
      )}

      {/* MODAL: Confirmar Llegada */}
      {planillaLlegada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Truck className="text-indigo-600" size={20} />
                Confirmar Llegada de Viaje
                <span className="ml-2 text-sm font-normal text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">{planillaLlegada.id}</span>
              </h3>
              <button onClick={() => setPlanillaLlegada(null)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-200">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 sm:p-6">
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg space-y-4">
                <div>
                  <label className="block text-sm font-medium text-indigo-900 mb-1">
                    Kilometraje de Salida (Registrado)
                  </label>
                  <div className="flex gap-3">
                    <input type="number" disabled value={planillaLlegada.kmSalida || ''} className="flex-1 px-3 py-2 border border-indigo-200 rounded-md bg-indigo-100 text-indigo-700 outline-none" />
                    <span className="inline-flex items-center px-3 bg-indigo-100 text-indigo-800 rounded-md border border-indigo-200 font-medium">KM</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-indigo-900 mb-1 flex items-center gap-2">
                    <AlertCircle size={16} />
                    Kilometraje de Llegada <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3">
                    <input 
                      type="number" 
                      value={kmLlegadaInput}
                      onChange={(e) => setKmLlegadaInput(e.target.value)}
                      placeholder="Ej. 125400" 
                      className="flex-1 px-3 py-2 border border-indigo-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-white" 
                      autoFocus 
                    />
                    <span className="inline-flex items-center px-3 bg-indigo-100 text-indigo-800 rounded-md border border-indigo-200 font-medium">KM</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setPlanillaLlegada(null)} className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors">
                Cancelar
              </button>
              <button 
                onClick={handleConfirmLlegada} 
                disabled={!kmLlegadaInput || isConfirmingLlegada}
                className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                  !kmLlegadaInput || isConfirmingLlegada 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
                }`}
              >
                {isConfirmingLlegada ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" /> Confirmando...
                  </>
                ) : (
                  <>
                    <Check size={18} /> Confirmar Llegada
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Control de Bultos */}
      {planillaControl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <ClipboardCheck className="text-indigo-600" size={20} />
                Control de Bultos y Pesaje
                <span className="ml-2 text-sm font-normal text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">{planillaControl.id}</span>
              </h3>
              <button onClick={() => setPlanillaControl(null)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-200">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto">
              <table className="w-full text-left text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-600">Nº Remito</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Destinatario</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-center">Bultos Decl.</th>
                    <th className="px-4 py-3 font-medium text-indigo-700 text-center bg-indigo-50">Bultos Recibidos</th>
                    <th className="px-4 py-3 font-medium text-indigo-700 text-center bg-indigo-50">Peso Total (Kg)</th>
                    <th className="px-4 py-3 font-medium text-indigo-700 bg-indigo-50">Dirección</th>
                    <th className="px-4 py-3 font-medium text-indigo-700 bg-indigo-50">WhatsApp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {remitosControl.map(remito => {
                    const hasDifference = remito.bultosRecibidos !== remito.bultos;
                    return (
                      <tr key={remito.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{remito.numeroRemito}</td>
                        <td className="px-4 py-3">{remito.destinatario}</td>
                        <td className="px-4 py-3 text-center font-medium text-gray-500">{remito.bultos}</td>
                        <td className="px-4 py-2 bg-indigo-50/30">
                          <input 
                            type="number" 
                            value={remito.bultosRecibidos === undefined ? '' : remito.bultosRecibidos}
                            onChange={(e) => handleUpdateRemitoControl(remito.id, 'bultosRecibidos', parseInt(e.target.value) || 0)}
                            className={`w-20 px-2 py-1 text-center border rounded focus:ring-2 outline-none mx-auto block ${hasDifference ? 'border-red-300 bg-red-50 text-red-700 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`} 
                          />
                        </td>
                        <td className="px-4 py-2 bg-indigo-50/30">
                          <div className="flex items-center justify-center gap-1">
                            <input 
                              type="number" 
                              value={remito.pesoTotal === undefined ? '' : remito.pesoTotal}
                              onChange={(e) => handleUpdateRemitoControl(remito.id, 'pesoTotal', parseFloat(e.target.value) || 0)}
                              placeholder="0.00" 
                              className="w-24 px-2 py-1 text-right border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none" 
                            />
                            <span className="text-xs text-gray-500 font-medium">kg</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 bg-indigo-50/30">
                          <input 
                            type="text" 
                            value={remito.direccion || ''}
                            onChange={(e) => handleUpdateRemitoControl(remito.id, 'direccion', e.target.value)}
                            placeholder="Dirección de entrega" 
                            className="w-full min-w-[150px] px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none" 
                          />
                        </td>
                        <td className="px-4 py-2 bg-indigo-50/30">
                          <input 
                            type="text" 
                            maxLength={10}
                            value={remito.whatsapp || ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                              handleUpdateRemitoControl(remito.id, 'whatsapp', val);
                            }}
                            placeholder="1123456789" 
                            className="w-full min-w-[120px] px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none" 
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
              <div>
                {diferenciaBultos !== 0 && (
                  <div className="text-sm text-amber-600 flex items-center gap-2 font-medium bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                    <AlertCircle size={16} /> Hay diferencias en los bultos ({diferenciaBultos > 0 ? `Faltan ${diferenciaBultos}` : `Sobran ${Math.abs(diferenciaBultos)}`})
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setPlanillaControl(null)} className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors">
                  Cancelar
                </button>
                <button 
                  onClick={handleConfirmControl} 
                  disabled={remitosControl.some(r => !r.pesoTotal || r.pesoTotal <= 0 || !r.direccion || !r.whatsapp || r.whatsapp.length !== 10) || isConfirmingControl}
                  className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm ${
                    remitosControl.some(r => !r.pesoTotal || r.pesoTotal <= 0 || !r.direccion || !r.whatsapp || r.whatsapp.length !== 10) || isConfirmingControl
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                  title={remitosControl.some(r => !r.pesoTotal || r.pesoTotal <= 0 || !r.direccion || !r.whatsapp || r.whatsapp.length !== 10) ? "Debe completar todos los campos resaltados (Peso, Dirección, WhatsApp 10 dígitos) para todos los remitos" : ""}
                >
                  {isConfirmingControl ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" /> Finalizando...
                    </>
                  ) : (
                    <>
                      <Check size={18} /> Finalizar Control
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal - Horizontal Full Width */}
      {planillaView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-7xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Eye className="text-indigo-600" size={20} />
                Detalle de Planilla
                <span className="ml-2 text-sm font-normal text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">{planillaView.id}</span>
              </h3>
              <button onClick={() => setPlanillaView(null)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-200">
                <X size={20} />
              </button>
            </div>
            
            {/* Info Grid - Horizontal */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-6 bg-white border-b border-gray-200">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Sucursal Origen</p>
                <p className="font-semibold text-gray-900 mt-1">{planillaView.sucursalOrigen}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Sucursal Destino</p>
                <p className="font-semibold text-gray-900 mt-1">{planillaView.sucursalDestino || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Camión</p>
                <p className="font-semibold text-gray-900 mt-1">{planillaView.camion || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Chofer</p>
                <p className="font-semibold text-gray-900 mt-1">{planillaView.chofer || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Salida Est.</p>
                <p className="font-semibold text-gray-900 mt-1">{planillaView.fechaSalidaEstimada || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Llegada Est.</p>
                <p className="font-semibold text-gray-900 mt-1">{planillaView.fechaLlegadaEstimada || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Estado</p>
                <p className="font-semibold text-gray-900 mt-1 capitalize">{planillaView.estado}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">KM Salida</p>
                <p className="font-semibold text-gray-900 mt-1">{planillaView.kmSalida || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Remitos</p>
                <p className="font-semibold text-gray-900 mt-1">{planillaView.remitos.length}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Bultos</p>
                <p className="font-semibold text-gray-900 mt-1">{planillaView.remitos.reduce((a,b)=>a+b.bultos,0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Valor Total</p>
                <p className="font-semibold text-gray-900 mt-1">${planillaView.remitos.reduce((a,b)=>a+b.valorDeclarado,0).toFixed(2)}</p>
              </div>
            </div>

            {planillaView.comentarios && (
              <div className="p-6 pb-0">
                <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg">
                  <p className="text-xs font-medium text-amber-800 mb-1">Comentarios:</p>
                  <p className="text-sm text-amber-900">{planillaView.comentarios}</p>
                </div>
              </div>
            )}

            {/* Remitos Table - Full Width */}
            <div className="flex-1 overflow-auto p-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Remitos Cargados ({planillaView.remitos.length})</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                      <th className="text-left py-2 px-3 font-medium">#</th>
                      <th className="text-left py-2 px-3 font-medium">Seguimiento</th>
                      <th className="text-left py-2 px-3 font-medium">Nº Remito</th>
                      <th className="text-left py-2 px-3 font-medium">Remitente</th>
                      <th className="text-left py-2 px-3 font-medium">Destinatario</th>
                      <th className="text-left py-2 px-3 font-medium">Dirección</th>
                      <th className="text-left py-2 px-3 font-medium">WhatsApp</th>
                      <th className="text-center py-2 px-3 font-medium">Bultos</th>
                      <th className="text-right py-2 px-3 font-medium">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {planillaView.remitos.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="py-2 px-3 text-gray-500">{i + 1}</td>
                        <td className="py-2 px-3 font-mono text-xs text-indigo-600">{r.seguimiento || '—'}</td>
                        <td className="py-2 px-3">{r.numeroRemito}</td>
                        <td className="py-2 px-3 font-medium text-gray-900">{r.remitente}</td>
                        <td className="py-2 px-3">{r.destinatario}</td>
                        <td className="py-2 px-3 text-gray-600">{r.direccion || '—'}</td>
                        <td className="py-2 px-3 text-gray-500">{r.whatsapp || '—'}</td>
                        <td className="py-2 px-3 text-center font-medium">{r.bultos}</td>
                        <td className="py-2 px-3 text-right">${r.valorDeclarado.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-gray-200 font-medium bg-gray-50">
                    <tr>
                      <td colSpan={7} className="py-2 px-3 text-right">Totales:</td>
                      <td className="py-2 px-3 text-center">{planillaView.remitos.reduce((a,b)=>a+b.bultos,0)}</td>
                      <td className="py-2 px-3 text-right">${planillaView.remitos.reduce((a,b)=>a+b.valorDeclarado,0).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => generatePlanillaPDF(planillaView)}
                className="px-4 py-2 text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 font-medium transition-colors flex items-center gap-2"
              >
                <Download size={16} /> Descargar PDF
              </button>
              <button 
                onClick={() => setPlanillaView(null)}
                className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Row 2: 2 columns showing "Cargas en Camino" and "Cargas listas para Control" */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* En Camino */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-80">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Truck size={18} className="text-amber-500" /> Cargas en Camino
                </h3>
                <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {planillasViaje.length}
                </span>
              </div>
              <div className="p-4 flex-1 overflow-y-auto">
                {planillasViaje.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                    No hay cargas en camino
                  </div>
                ) : (
                  <div className="space-y-3">
                    {planillasViaje.map(p => (
                      <div key={p.id} className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-indigo-600">{p.id}</span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{p.sucursalOrigen}{p.sucursalDestino ? ` → ${p.sucursalDestino}` : ''}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">{p.remitos.length}</span> remitos • <span className="font-medium">{p.remitos.reduce((a,b)=>a+b.bultos,0)}</span> bultos
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setPlanillaView(p)} className="p-1.5 text-gray-500 bg-gray-50 hover:bg-gray-100 rounded transition-colors" title="Ver Detalles">
                              <Eye size={18} />
                            </button>
                            <button onClick={() => generatePlanillaPDF(p)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors" title="Descargar PDF">
                              <Download size={18} />
                            </button>
                            <button onClick={() => handleOpenLlegada(p)} className="p-1.5 text-green-600 bg-green-50 hover:bg-green-100 rounded transition-colors" title="Confirmar Llegada">
                              <Check size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Listas para Control */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-80">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <ClipboardCheck size={18} className="text-indigo-500" /> Cargas listas para Control
                </h3>
                <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {planillasControl.length}
                </span>
              </div>
              <div className="p-4 flex-1 overflow-y-auto">
                {planillasControl.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                    No hay cargas para control
                  </div>
                ) : (
                  <div className="space-y-3">
                    {planillasControl.map(p => (
                      <div key={p.id} className="p-4 border border-indigo-100 bg-indigo-50/30 rounded-lg hover:bg-indigo-50/50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-indigo-600">{p.id}</span>
                          <span className="text-xs text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded">{p.sucursalOrigen}{p.sucursalDestino ? ` → ${p.sucursalDestino}` : ''}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">{p.remitos.length}</span> remitos • <span className="font-medium">{p.remitos.reduce((a,b)=>a+b.bultos,0)}</span> bultos decl.
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setPlanillaView(p)} className="p-1.5 text-gray-500 bg-white hover:bg-gray-100 rounded transition-colors" title="Ver Detalles">
                              <Eye size={18} />
                            </button>
                            <button onClick={() => handleOpenControl(p)} className="px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-md transition-colors flex items-center gap-1">
                              <Scale size={16} /> Controlar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 3: Tabla de todas las cargas */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-6">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Map size={18} className="text-green-600" /> {ca.listTitle}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                  <tr>
                    <th className="px-6 py-3 font-medium">Nº Remito / Seg.</th>
                    <th className="px-6 py-3 font-medium">Planilla Origen</th>
                    <th className="px-6 py-3 font-medium">Destinatario</th>
                    <th className="px-6 py-3 font-medium text-center">Bultos</th>
                    <th className="px-6 py-3 font-medium text-center">Peso (Kg)</th>
                    <th className="px-6 py-3 font-medium">Estado Control</th>
                    <th className="px-6 py-3 font-medium text-right">Etiquetas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {remitosListos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                        No hay remitos listos para hoja de ruta
                      </td>
                    </tr>
                  ) : (
                    remitosListos.map((r, index) => (
                      <tr key={`${r.planillaId}-${r.id}-${index}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-indigo-600">{r.numeroRemito}</div>
                          <div className="text-xs text-gray-500">{r.seguimiento || '-'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">{r.planillaId}</div>
                          <div className="text-xs text-gray-500">{r.sucursalOrigen}</div>
                        </td>
                        <td className="px-6 py-4 text-sm">{r.destinatario}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={r.bultosRecibidos === r.bultos ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                            {r.bultosRecibidos || 0}
                          </span>
                          <span className="text-xs text-gray-400 ml-1">/ {r.bultos}</span>
                        </td>
                        <td className="px-6 py-4 text-center text-sm">{r.pesoTotal ? r.pesoTotal.toFixed(2) : '0.00'}</td>
                        <td className="px-6 py-4">
                          {r.planillaEstado === 'completo' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle size={12} /> OK
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <AlertCircle size={12} /> Dif.
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => generateEtiquetasPDF(r)}
                            className="text-indigo-600 hover:text-indigo-900 font-medium text-sm flex items-center justify-end gap-1 w-full"
                          >
                            <Printer size={16} /> Imprimir
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
    </div>
  );
}
