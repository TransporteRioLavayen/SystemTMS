import React, { useState, useEffect, useMemo } from 'react';
import { Map, Truck, CheckCircle, Clock, Users, Package, MapPin, Play, Search, GripVertical, X, FileDown, FileText, Smartphone, Square, Barcode } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { hojaRutaSchema, HojaRutaFormData } from '../../domain/schemas/hoja-ruta.schema';
import { useFlota } from '../../application/context/FlotaContext';
import { useTerceros } from '../../application/context/TercerosContext';
import { usePlanillas } from '../../application/hooks/usePlanillas';
import { useHojasDeRuta, HojaDeRuta } from '../../application/context/HojasDeRutaContext';
import { planillaService, Remito } from '../../infrastructure/services/planillaService';
import { hojaRutaService, FlotaDisponible } from '../../infrastructure/services/hojaRutaService';
import { SSCCBadge } from '../components/SSCCBadge';
import { generateBarcodeImage, generateQRImage, formatSSCC } from '../utils/barcode';
import { LABELS } from '../../application/constants/labels';

interface RouteDraft {
  unidad: string;
  chofer: string;
  acompanante: string;
  depositoOrigenId: string;
  tipoFlota: 'propia' | 'tercero';
  tipoServicio: 'larga_distancia' | 'corta_distancia';
}

interface ActiveRoute extends RouteDraft {
  cargas: Array<{
    id: string;
    cliente: string;
    direccion: string;
    whatsapp?: string;
    bultos: number;
    estado: string;
  }>;
}

export default function GestionHojas() {
  const { unidades, choferes, depositos } = useFlota();
  const { terceros } = useTerceros();
  const { planillasCompletadas } = usePlanillas();
  const { hojasDeRuta, loading, error, refreshHojas, agregarHoja, iniciarTurno, terminarTurno, actualizarEstadoRemito } = useHojasDeRuta();

  // Flota disponible (unidades propias + terceros)
  const [flotaDisponible, setFlotaDisponible] = useState<FlotaDisponible[]>([]);
  const [flotaLoading, setFlotaLoading] = useState(false);

  // Remitos preparados (listos para asignar) - vienen del flujo de gestión de cargas
  const [remitosPreparados, setRemitosPreparados] = useState<Remito[]>([]);
  // Remitos no entregados (rechazados, reprogramados para reasignar)
  const [remitosNoEntregados, setRemitosNoEntregados] = useState<Remito[]>([]);
  const [remitosLoading, setRemitosLoading] = useState(false);

  const { common: c, logistics: { hojasRuta: h } } = LABELS;

  // Cargar remitos por estado
  useEffect(() => {
    const cargarRemitos = async () => {
      setRemitosLoading(true);
      try {
        const [preparados, noEntregados] = await Promise.all([
          planillaService.getRemitosByEstado('Preparado'),
          planillaService.getRemitosByEstado('Por reasignar'),
        ]);
        setRemitosPreparados(preparados);
        setRemitosNoEntregados(noEntregados);
      } catch (err) {
        console.error('Error cargando remitos:', err);
      } finally {
        setRemitosLoading(false);
      }
    };
    cargarRemitos();
  }, [hojasDeRuta]); // Recargar cuando cambian las hojas

  // Cargar flota disponible (solo corta distancia para hojas de ruta)
  useEffect(() => {
    const cargarFlota = async () => {
      setFlotaLoading(true);
      try {
        const flota = await hojaRutaService.getFlotaDisponible('corta_distancia');
        setFlotaDisponible(flota);
      } catch (err) {
        console.error('Error cargando flota disponible:', err);
      } finally {
        setFlotaLoading(false);
      }
    };
    cargarFlota();
  }, [hojasDeRuta]); // Recargar cuando cambian las hojas

  // Derived remitos from planillasCompletadas (fallback)
  const allRemitos = useMemo(() => {
    return planillasCompletadas.flatMap(p => p.remitos.map(r => ({
      id: r.id,
      cliente: r.destinatario,
      direccion: r.direccion || r.remitente,
      whatsapp: r.whatsapp,
      bultos: r.bultos,
      estado: 'En Base'
    })));
  }, [planillasCompletadas]);

  const [searchTerm, setSearchTerm] = useState('');

  // State for the route being prepared
  const { register: registerHoja, handleSubmit, watch: watchHoja, setValue: setHojaValue, formState: { errors: errorsHoja } } = useForm<HojaRutaFormData>({
    resolver: zodResolver(hojaRutaSchema),
    defaultValues: {
      unidad: '',
      chofer: '',
      acompanante: '',
      depositoOrigenId: '',
      tipoFlota: 'propia',
      tipoServicio: 'corta_distancia',
    }
  });
  const draftRoute = watchHoja(); // Used for reads in UI
  const [activeRoute, setActiveRoute] = useState<ActiveRoute | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [dragSource, setDragSource] = useState<'preparados' | 'noEntregados' | null>(null);

  // Available remitos: remitos preparados + no entregados minus those in activeRoute or hojasDeRuta
  // IMPORTANTE: Los remitos rechazados (estado_entrega === 'Rechazado') NO se consideran "usados"
  // porque deben aparecer en la columna "No Entregados" para reasignación
  const remitosDisponibles = useMemo(() => {
    const usedRemitoIds = new Set<string>();
    if (activeRoute) {
      activeRoute.cargas.forEach(c => usedRemitoIds.add(c.id));
    }
    hojasDeRuta.forEach(h => {
      h.cargas.forEach(c => {
        // Solo marcar como usado si NO está rechazado
        // Los rechazados deben quedar disponibles para reasignar
        if (c.remitoId && c.estado !== 'Rechazado') {
          usedRemitoIds.add(c.remitoId);
        }
      });
    });

    // Combinar remitos preparados + no entregados
    const todos = [
      ...remitosPreparados.map(r => ({
        id: r.id,
        cliente: r.destinatario,
        direccion: r.direccion || r.remitente,
        whatsapp: r.whatsapp,
        bultos: r.bultos,
        estado: r.estado || 'Preparado',
        fuente: 'preparados' as const,
      })),
      ...remitosNoEntregados.map(r => ({
        id: r.id,
        cliente: r.destinatario,
        direccion: r.direccion || r.remitente,
        whatsapp: r.whatsapp,
        bultos: r.bultos,
        estado: r.estado || 'Por reasignar',
        fuente: 'noEntregados' as const,
      })),
    ];

    return todos.filter(r => !usedRemitoIds.has(r.id));
  }, [remitosPreparados, remitosNoEntregados, activeRoute, hojasDeRuta]);

  // Remitos preparados filtrados (excluyendo los ya asignados a hojas)
  const remitosPreparadosFiltrados = useMemo(() => {
    const usedRemitoIds = new Set<string>();
    if (activeRoute) {
      activeRoute.cargas.forEach(c => usedRemitoIds.add(c.id));
    }
    hojasDeRuta.forEach(h => {
      h.cargas.forEach(c => {
        // Solo marcar como usado si NO está rechazado
        if (c.remitoId && c.estado !== 'Rechazado') {
          usedRemitoIds.add(c.remitoId);
        }
      });
    });
    return remitosPreparados.filter(r => !usedRemitoIds.has(r.id));
  }, [remitosPreparados, activeRoute, hojasDeRuta]);

  // Remitos no entregados filtrados (excluyendo los ya reasignados)
  const remitosNoEntregadosFiltrados = useMemo(() => {
    const usedRemitoIds = new Set<string>();
    if (activeRoute) {
      activeRoute.cargas.forEach(c => usedRemitoIds.add(c.id));
    }
    hojasDeRuta.forEach(h => {
      h.cargas.forEach(c => {
        // Solo marcar como usado si NO está rechazado
        if (c.remitoId && c.estado !== 'Rechazado') {
          usedRemitoIds.add(c.remitoId);
        }
      });
    });
    return remitosNoEntregados.filter(r => !usedRemitoIds.has(r.id));
  }, [remitosNoEntregados, activeRoute, hojasDeRuta]);

  // Modal states
  const [startTurnModal, setStartTurnModal] = useState<{ isOpen: boolean, routeId: string | null }>({ isOpen: false, routeId: null });
  const [endTurnModal, setEndTurnModal] = useState<{ isOpen: boolean, routeId: string | null }>({ isOpen: false, routeId: null });
  const [viewRouteModal, setViewRouteModal] = useState<{ isOpen: boolean, route: HojaDeRuta | null }>({ isOpen: false, route: null });
  const [kmInput, setKmInput] = useState('');
  const [deliveryChecklist, setDeliveryChecklist] = useState<Record<string, boolean>>({});

  const filteredRemitos = remitosDisponibles.filter(r =>
    r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.direccion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConfirmRoute = (data: HojaRutaFormData) => {
    setActiveRoute({ 
      ...data, 
      tipoFlota: data.tipoFlota as 'propia' | 'tercero',
      tipoServicio: data.tipoServicio as 'larga_distancia' | 'corta_distancia',
      depositoOrigenId: data.depositoOrigenId || '',
      cargas: [] 
    } as ActiveRoute);
  };

  const handleFinishRoute = async () => {
    if (activeRoute?.cargas.length === 0) {
      if (!window.confirm('La hoja de ruta no tiene cargas asignadas. ¿Desea finalizarla de todos modos?')) {
        return;
      }
    }

    // Save the route to the backend with cargas
    if (activeRoute) {
      try {
        await agregarHoja({
          unidad: activeRoute.unidad,
          chofer: activeRoute.chofer,
          acompanante: activeRoute.acompanante || undefined,
          depositoOrigenId: activeRoute.depositoOrigenId || undefined,
          tipoFlota: activeRoute.tipoFlota,
          tipoServicio: activeRoute.tipoServicio,
          cargas: activeRoute.cargas.map(c => ({
            remitoId: c.id,
            cliente: c.cliente,
            direccion: c.direccion,
            whatsapp: c.whatsapp,
            bultos: c.bultos,
          })),
        });
      } catch (err: any) {
        console.error('Error al crear hoja de ruta:', err);
        // No mostrar alert si ya se creó correctamente
        return;
      }
    }

    setActiveRoute(null);
    setHojaValue('unidad', '');
    setHojaValue('chofer', '');
    setHojaValue('acompanante', '');
    setHojaValue('depositoOrigenId', '');
    setHojaValue('tipoFlota', 'propia');
    setHojaValue('tipoServicio', 'corta_distancia');
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, remitoId: string, source: 'preparados' | 'noEntregados') => {
    e.dataTransfer.setData('remitoId', remitoId);
    e.dataTransfer.setData('source', source);
    setDragSource(source);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    setDragSource(null);

    if (!activeRoute) return;

    const remitoId = e.dataTransfer.getData('remitoId');
    const source = e.dataTransfer.getData('source') as 'preparados' | 'noEntregados';
    const remitoToMove = remitosDisponibles.find(r => r.id === remitoId);

    if (remitoToMove) {
      // Add to active route
      setActiveRoute(prev => prev ? {
        ...prev,
        cargas: [...prev.cargas, remitoToMove]
      } : null);
    }
  };

  const handleRemoveFromRoute = (remitoId: string) => {
    if (!activeRoute) return;

    const remitoToRemove = activeRoute.cargas.find(r => r.id === remitoId);
    if (remitoToRemove) {
      // Remove from active route
      setActiveRoute(prev => prev ? {
        ...prev,
        cargas: prev.cargas.filter(r => r.id !== remitoId)
      } : null);
    }
  };

  const generateHojaDeRutaPDF = async (hoja: HojaDeRuta) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('TRANSPORTES RÍO LAVAYÉN', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Hoja de Ruta', 105, 28, { align: 'center' });
    
    // Línea separadora
    doc.setLineWidth(0.5);
    doc.line(14, 32, 196, 32);

    let yPos = 40;

    // Sección SSCC con código de barras y QR
    if (hoja.sscc) {
      try {
        // Generar GS1-128 barcode
        const barcodeImg = await generateBarcodeImage('gs1-128', `(00)${hoja.sscc}`, {
          scale: 2,
          height: 12,
          showText: true,
        });

        // Generar QR con datos de la hoja
        const qrImg = await generateQRImage({
          sscc: hoja.sscc,
          unidad: hoja.unidad,
          chofer: hoja.chofer,
          fecha: new Date(hoja.fechaCreacion).toISOString().split('T')[0],
          estado: hoja.estado,
        }, 4);

        // Título SSCC
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Código SSCC (Serial Shipping Container Code)', 105, yPos, { align: 'center' });
        yPos += 6;

        // Barcode GS1-128 centrado
        if (barcodeImg) {
          doc.addImage(barcodeImg, 'PNG', 30, yPos, 150, 22);
          yPos += 26;
        }

        // SSCC formateado
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text(`SSCC: ${formatSSCC(hoja.sscc)}`, 105, yPos, { align: 'center' });
        yPos += 10;

        // QR Code
        if (qrImg) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text('Código QR de verificación:', 105, yPos, { align: 'center' });
          yPos += 4;
          doc.addImage(qrImg, 'PNG', 85, yPos, 40, 40);
          yPos += 46;
        }
      } catch (err) {
        console.error('Error generando códigos:', err);
        doc.setFontSize(12);
        doc.text(`SSCC: ${hoja.sscc}`, 14, yPos);
        yPos += 10;
      }
    }

    // Info de la hoja de ruta
    doc.setLineWidth(0.3);
    doc.rect(14, yPos, 182, 45);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Información de la Hoja de Ruta', 20, yPos + 7);
    
    doc.setFontSize(10);
    let infoY = yPos + 15;
    
    const leftInfo = [
      ['Unidad:', hoja.unidad],
      ['Chofer:', hoja.chofer],
      ...(hoja.acompanante ? [['Acompañante:', hoja.acompanante]] : []),
    ];
    
    const rightInfo = [
      ['Tipo de Flota:', hoja.tipoFlota === 'propia' ? 'Propia' : 'Tercero'],
      ['Tipo de Servicio:', hoja.tipoServicio === 'larga_distancia' ? 'Larga Distancia' : 'Corta Distancia'],
      ['Estado:', hoja.estado],
      ['Fecha:', new Date(hoja.fechaCreacion).toLocaleString('es-AR')],
    ];

    doc.setFont('helvetica', 'normal');
    leftInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 20, infoY);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 55, infoY);
      infoY += 7;
    });

    infoY = yPos + 15;
    rightInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 110, infoY);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 150, infoY);
      infoY += 7;
    });

    yPos += 52;

    // Tabla de cargas
    if (hoja.cargas && hoja.cargas.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Detalle de Cargas', 14, yPos);
      yPos += 4;

      const tableData = hoja.cargas.map((r, idx) => [
        (idx + 1).toString(),
        r.cliente || '-',
        r.direccion || '-',
        r.whatsapp || '-',
        r.bultos.toString(),
        r.estado
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Cliente', 'Dirección', 'WhatsApp', 'Bultos', 'Estado']],
        body: tableData,
        foot: [['', '', '', 'Totales:', 
          hoja.cargas.reduce((a, b) => a + b.bultos, 0).toString(), 
          `${hoja.cargas.filter(c => c.estado === 'Entregado').length}/${hoja.cargas.length} entregas`
        ]],
      });
    } else {
      doc.setFontSize(12);
      doc.text('Sin cargas asignadas', 14, yPos + 10);
    }

    doc.save(`HojaRuta_${hoja.sscc || hoja.id}_${hoja.unidad}.pdf`);
  };

  const handleDownloadPdf = async (hoja: HojaDeRuta) => {
    try {
      await generateHojaDeRutaPDF(hoja);
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF. Intenta nuevamente.');
    }
  };

  const openStartTurn = (routeId: string) => {
    console.log('🎯 [GestionHojas] Abriendo modal iniciar turno para:', routeId);
    setStartTurnModal({ isOpen: true, routeId });
    setKmInput('');
  };

  const confirmStartTurn = async () => {
    if (!kmInput || Number(kmInput) <= 0) {
      alert('Ingrese un Km válido');
      return;
    }
    if (startTurnModal.routeId) {
      try {
        console.log('🚀 [GestionHojas] Iniciando turno:', { hojaId: startTurnModal.routeId, kmSalida: kmInput });
        await iniciarTurno(startTurnModal.routeId, Number(kmInput));
        console.log('✅ [GestionHojas] Turno iniciado correctamente');
        await refreshHojas();
      } catch (err: any) {
        console.error('❌ [GestionHojas] Error al iniciar turno:', err);
        alert('Error al iniciar el turno: ' + (err.message || 'Error desconocido'));
        return;
      }
    }
    setStartTurnModal({ isOpen: false, routeId: null });
  };

  const openEndTurn = (route: HojaDeRuta) => {
    setEndTurnModal({ isOpen: true, routeId: route.id });
    setKmInput('');
    const initialChecklist: Record<string, boolean> = {};
    (route.cargas || []).forEach(c => initialChecklist[c.id] = false);
    setDeliveryChecklist(initialChecklist);
  };

  const toggleDelivery = (remitoId: string) => {
    setDeliveryChecklist(prev => ({ ...prev, [remitoId]: !prev[remitoId] }));
  };

  const confirmEndTurn = async () => {
    const route = hojasDeRuta.find(h => h.id === endTurnModal.routeId);
    if (!route) return;
    
    const cargas = route.cargas || [];
    const allDelivered = cargas.every(c => deliveryChecklist[c.id]);
    
    if (!allDelivered) {
      alert('Debe completar todas las entregas para terminar el turno.');
      return;
    }

    if (!kmInput || Number(kmInput) <= Number(route.kmSalida)) {
      alert('Ingrese un Km de Llegada válido y mayor al Km de Salida.');
      return;
    }

    if (endTurnModal.routeId) {
      try {
        // Primero actualizar los estados de los remitos
        for (const carga of cargas) {
          const nuevoEstado = deliveryChecklist[carga.id] ? 'Entregado' : 'Rechazado';
          await actualizarEstadoRemito(endTurnModal.routeId, carga.id, nuevoEstado);
        }
        // Luego terminar el turno
        await terminarTurno(endTurnModal.routeId, Number(kmInput));
      } catch (err) {
        alert('Error al terminar el turno');
        return;
      }
    }
    setEndTurnModal({ isOpen: false, routeId: null });
  };

  return (
    <div className="space-y-6 h-full overflow-y-auto pr-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{h.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {h.subtitle}
          </p>
        </div>
      </div>

      {/* Row 2: Main Content (3 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 items-start">

        {/* Column 1: Asignación de Unidad */}
        <div className="lg:col-span-1 order-1 lg:order-1 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Truck size={18} className="text-indigo-600" /> {h.new}
              </h3>
            </div>

            {!activeRoute ? (
              // Form to prepare a new route
              <form onSubmit={handleSubmit(handleConfirmRoute)} className="p-5 flex-1 flex flex-col overflow-hidden">
                <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-lg mb-6 border border-blue-100">
                  Crea una unidad y asigne los remitos controlados.
                </div>

                <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                  {/* Depósito de Origen */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Depósito de Origen <span className="text-red-500">*</span></label>
                    <select
                      {...registerHoja('depositoOrigenId')}
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white ${errorsHoja.depositoOrigenId ? 'border-red-500' : 'border-gray-300'}`}
                    >
                      <option value="">Seleccione un depósito</option>
                      {depositos.filter(d => d.estado === 'activo').map(d => (
                        <option key={d.id} value={d.id}>
                          {d.nombre}
                        </option>
                      ))}
                    </select>
                    {errorsHoja.depositoOrigenId && <p className="text-xs text-red-500 mt-1">{errorsHoja.depositoOrigenId.message}</p>}
                  </div>

                  {/* Tipo de Flota */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Flota <span className="text-red-500">*</span></label>
                    <select
                      {...registerHoja('tipoFlota')}
                      onChange={e => {
                        registerHoja('tipoFlota').onChange(e);
                        setHojaValue('unidad', '');
                        setHojaValue('chofer', '');
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                      <option value="propia">Unidad Propia</option>
                      <option value="tercero">Unidad de Tercero</option>
                    </select>
                  </div>

                  {/* Selección de Unidad (unificada: propias o terceros) */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {draftRoute.tipoFlota === 'propia' ? 'Unidad (Patente / Vehículo)' : 'Tercero (Empresa / Patente)'} <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...registerHoja('unidad')}
                      onChange={e => {
                        registerHoja('unidad').onChange(e);
                        const selectedId = e.target.value;
                        const selected = flotaDisponible.find(f => f.id === selectedId);
                        setHojaValue('tipoServicio', selected?.tipoServicio || 'corta_distancia');
                        if (selected?.tipoFlota === 'tercero') {
                          setHojaValue('chofer', selected.nombreChofer || '');
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white ${errorsHoja.unidad ? 'border-red-500' : 'border-gray-300'}`}
                    >
                      <option value="">
                        {flotaLoading ? 'Cargando...' : `Seleccione ${draftRoute.tipoFlota === 'propia' ? 'una unidad' : 'un tercero'}`}
                      </option>
                      {flotaDisponible
                        .filter(f => f.tipoFlota === draftRoute.tipoFlota)
                        .map(f => (
                          <option key={f.id} value={f.id}>
                            {f.label} {f.tipoServicio === 'larga_distancia' ? '🚛 Larga Distancia' : '🚚 Corta Distancia'}
                          </option>
                        ))}
                    </select>
                    {errorsHoja.unidad && <p className="text-xs text-red-500 mt-1">{errorsHoja.unidad.message}</p>}
                  </div>

                  {/* Chofer (solo para unidades propias) */}
                  {draftRoute.tipoFlota === 'propia' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Chofer Designado <span className="text-red-500">*</span></label>
                      <select
                        {...registerHoja('chofer')}
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white ${errorsHoja.chofer ? 'border-red-500' : 'border-gray-300'}`}
                      >
                        <option value="">Seleccione un chofer</option>
                        {choferes.filter(c => c.estado === 'DISPONIBLE').map(c => (
                          <option key={c.id} value={c.nombre}>
                            {c.nombre}
                          </option>
                        ))}
                      </select>
                      {errorsHoja.chofer && <p className="text-xs text-red-500 mt-1">{errorsHoja.chofer.message}</p>}
                    </div>
                  )}

                  {/* Chofer del tercero (solo lectura) */}
                  {draftRoute.tipoFlota === 'tercero' && draftRoute.chofer && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Chofer del Tercero</label>
                      <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-sm text-gray-700">
                        {draftRoute.chofer}
                      </div>
                    </div>
                  )}

                  {/* Tipo de Servicio (informativo) */}
                  {draftRoute.unidad && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Servicio</label>
                      <div className={`px-3 py-2 border rounded-md text-sm font-medium ${draftRoute.tipoServicio === 'larga_distancia'
                        ? 'bg-purple-50 border-purple-200 text-purple-700'
                        : 'bg-blue-50 border-blue-200 text-blue-700'
                        }`}>
                        {draftRoute.tipoServicio === 'larga_distancia'
                          ? '🚛 Larga Distancia (solo depósitos)'
                          : '🚚 Corta Distancia (entregas directas)'}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Acompañante / Ayudante</label>
                    <input
                      type="text"
                      {...registerHoja('acompanante')}
                      placeholder="Nombre del acompañante (Opcional)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors mt-4 shadow-sm flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} /> Confirmar y Preparar
                </button>
              </form>
            ) : (
              // Active Route View (Dropzone)
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Active Route Info */}
                <div className="p-4 bg-indigo-50 border-b border-indigo-100">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      Unidad: {activeRoute.unidad}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${activeRoute.tipoServicio === 'larga_distancia'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                      }`}>
                      {activeRoute.tipoServicio === 'larga_distancia' ? '🚛 Larga Distancia' : '🚚 Corta Distancia'}
                    </span>
                  </div>
                  <div className="text-xs text-indigo-800 space-y-1">
                    <p className="flex items-center gap-1"><Users size={12} /> Chofer: {activeRoute.chofer}</p>
                    {activeRoute.acompanante && (
                      <p className="flex items-center gap-1"><Users size={12} /> Acomp: {activeRoute.acompanante}</p>
                    )}
                    {activeRoute.depositoOrigenId && (
                      <p className="flex items-center gap-1"><MapPin size={12} /> Origen: {depositos.find(d => d.id === activeRoute.depositoOrigenId)?.nombre || 'N/A'}</p>
                    )}
                  </div>
                </div>

                {/* Dropzone */}
                <div
                  className={`flex-1 p-4 overflow-y-auto transition-colors ${isDraggingOver ? 'bg-indigo-50/50 border-2 border-dashed border-indigo-400' : 'bg-white'}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {(!activeRoute?.cargas || activeRoute?.cargas?.length === 0) ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <Package size={32} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Arrastra remitos aquí</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cargas Asignadas ({activeRoute?.cargas?.length || 0})</h4>
                      {activeRoute?.cargas?.map((remito) => (
                        <div key={remito.id} className="bg-white border border-indigo-100 rounded-lg p-3 shadow-sm relative group">
                          <button
                            onClick={() => handleRemoveFromRoute(remito.id)}
                            className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Quitar de la hoja"
                          >
                            <X size={16} />
                          </button>
                          <div className="font-bold text-gray-900 text-sm mb-1">{remito.id}</div>
                          <div className="text-xs text-gray-800">{remito.cliente}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <MapPin size={12} /> {remito.direccion}
                          </div>
                          {remito.whatsapp && (
                            <div className="text-xs text-green-600 mt-1">WhatsApp: {remito.whatsapp}</div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">{remito.bultos} bultos</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Finish Button */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={handleFinishRoute}
                    className="w-full py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    <Play size={18} /> Crear Hoja de Ruta
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Cargas Listas para Hoja de Ruta */}
        <div className="lg:col-span-1 order-2 lg:order-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Package size={18} className="text-indigo-600" /> Remitos Controlados
            </h3>
            <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {remitosPreparadosFiltrados.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
            {remitosLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-gray-500">Cargando...</div>
              </div>
            ) : remitosPreparadosFiltrados.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-2">
                <Package size={32} className="text-gray-300" />
                <p className="text-center text-sm">No hay cargas preparadas.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {remitosPreparadosFiltrados.map((remito) => (
                  <div
                    key={remito.id}
                    draggable={!!activeRoute}
                    onDragStart={(e) => handleDragStart(e, remito.id, 'preparados')}
                    className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex items-center gap-4 transition-all ${activeRoute ? 'cursor-grab hover:border-indigo-300 hover:shadow-md active:cursor-grabbing' : 'opacity-60 cursor-not-allowed'}`}
                    title={!activeRoute ? "Debe preparar una unidad primero" : "Arrastre hacia la unidad"}
                  >
                    <div className="text-gray-400">
                      <GripVertical size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-gray-900 text-sm">{remito.id}</span>
                        <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {remito.bultos} bultos
                        </span>
                      </div>
                      <div className="text-sm font-medium text-gray-800">{remito.destinatario}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin size={12} /> {remito.direccion || '-'}
                      </div>
                      {remito.whatsapp && (
                        <div className="text-xs text-green-600 mt-1">WhatsApp: {remito.whatsapp}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Remitos No Entregados */}
        <div className="lg:col-span-1 order-3 lg:order-3 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Clock size={18} className="text-amber-600" /> Remitos No Entregados
            </h3>
            <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {remitosNoEntregadosFiltrados.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
            {remitosLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-gray-500">Cargando...</div>
              </div>
            ) : remitosNoEntregadosFiltrados.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-2">
                <CheckCircle size={32} className="text-gray-300" />
                <p className="text-center text-sm">No hay remitos pendientes de reasignación.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {remitosNoEntregadosFiltrados.map((remito) => (
                  <div
                    key={remito.id}
                    draggable={!!activeRoute}
                    onDragStart={(e) => handleDragStart(e, remito.id, 'noEntregados')}
                    className={`bg-white border border-amber-200 rounded-lg p-4 shadow-sm flex items-center gap-4 transition-all ${activeRoute ? 'cursor-grab hover:border-amber-400 hover:shadow-md active:cursor-grabbing' : 'opacity-60 cursor-not-allowed'}`}
                    title={!activeRoute ? "Debe preparar una unidad primero" : "Arrastre hacia la unidad para reasignar"}
                  >
                    <div className="text-amber-500">
                      <GripVertical size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-gray-900 text-sm">{remito.id}</span>
                        <span className="text-xs font-medium bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                          Por reasignar
                        </span>
                      </div>
                      <div className="text-sm font-medium text-gray-800">{remito.destinatario}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin size={12} /> {remito.direccion || '-'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{remito.bultos} bultos</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Row 3: Historial de Hojas de Ruta (unificado) */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-8">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FileText size={18} className="text-indigo-600" /> Historial de Hojas de Ruta
          </h3>
          <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {hojasDeRuta.length} Hojas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                <th className="p-4 font-medium">SSCC</th>
                <th className="p-4 font-medium">Unidad</th>
                <th className="p-4 font-medium">Personal Asignado</th>
                <th className="p-4 font-medium text-center">Cargas</th>
                <th className="p-4 font-medium">Km Salida</th>
                <th className="p-4 font-medium">Km Llegada</th>
                <th className="p-4 font-medium">Estado</th>
                <th className="p-4 font-medium text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {hojasDeRuta.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    No hay hojas de ruta registradas.
                  </td>
                </tr>
              ) : (
                hojasDeRuta.map((hoja) => (
                  <tr key={hoja.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <SSCCBadge sscc={hoja.sscc} copyable />
                    </td>
                    <td className="p-4 text-sm font-medium text-gray-800">
                      {hoja.unidad}
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        <Users size={14} className="text-gray-400" /> {hoja.chofer}
                      </div>
                      {hoja.acompanante && (
                        <div className="text-xs text-gray-500 ml-5 mt-0.5">
                          + {hoja.acompanante}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-sm text-gray-600 text-center">
                      {(hoja.cargas || []).length === 0 ? (
                        <span className="text-gray-400">Sin cargas</span>
                      ) : (
                        <>
                          <span className="font-medium text-green-700">{(hoja.cargas || []).filter(c => c.estado === 'Entregado').length}</span> /
                          <span className="font-medium text-gray-900">{(hoja.cargas || []).length}</span> entregas
                          {(hoja.cargas || []).filter(c => c.estado === 'Rechazado').length > 0 && (
                            <div className="text-xs text-red-600 font-medium">
                              ({(hoja.cargas || []).filter(c => c.estado === 'Rechazado').length} rechazad{(hoja.cargas || []).filter(c => c.estado === 'Rechazado').length > 1 ? 'os' : 'o'})
                            </div>
                          )}
                        </>
                      )}
                      <div className="text-xs text-gray-500">
                        ({(hoja.cargas || []).reduce((acc, curr) => acc + curr.bultos, 0)} bultos)
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-medium text-gray-900">{hoja.kmSalida || '-'}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-medium text-gray-900">{hoja.kmLlegada || '-'}</span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${hoja.estado === 'Lista para salir' ? 'bg-amber-100 text-amber-800' :
                        hoja.estado === 'En reparto' ? 'bg-blue-100 text-blue-800' :
                          hoja.estado === 'Finalizó reparto' ? 'bg-purple-100 text-purple-800' :
                            'bg-green-100 text-green-800'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${hoja.estado === 'Lista para salir' ? 'bg-amber-500' :
                          hoja.estado === 'En reparto' ? 'bg-blue-500 animate-pulse' :
                            hoja.estado === 'Finalizó reparto' ? 'bg-purple-500' :
                              'bg-green-500'
                          }`}></span>
                        {hoja.estado}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {hoja.estado === 'Lista para salir' && (
                          <button
                            onClick={() => openStartTurn(hoja.id)}
                            className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
                            title="Iniciar Turno"
                          >
                            <Play size={16} />
                          </button>
                        )}
                        {hoja.estado === 'En reparto' && (
                          <button
                            onClick={() => openEndTurn(hoja)}
                            className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                            title="Terminar Turno"
                          >
                            <Square size={16} />
                          </button>
                        )}
                        {/* Botón para abrir portal del chofer */}
                        <button
                          onClick={() => window.open('/chofer', '_blank')}
                          className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
                          title="Abrir Portal del Chofer"
                        >
                          <Smartphone size={16} />
                        </button>
                        <button
                          onClick={() => setViewRouteModal({ isOpen: true, route: hoja })}
                          className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Ver Detalles"
                        >
                          <Search size={18} />
                        </button>
                        <button
                          onClick={() => handleDownloadPdf(hoja)}
                          className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Descargar PDF"
                        >
                          <FileDown size={18} />
                        </button>
                        <button
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Ver en Mapa"
                        >
                          <Map size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Start Turn Modal */}
      {startTurnModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{h.startTrip}</h3>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">{h.kmSalida}</label>
              <input
                type="number"
                value={kmInput}
                onChange={e => setKmInput(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="Ej: 150000"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setStartTurnModal({ isOpen: false, routeId: null })}
                className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmStartTurn}
                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Confirmar Salida
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Turn Modal */}
      {endTurnModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] flex flex-col shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{h.endTrip}</h3>

            <div className="mb-5 flex-1 overflow-hidden flex flex-col">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Confirmar Entregas</h4>
              <p className="text-xs text-gray-500 mb-3">Debe marcar todas las entregas como completadas para poder terminar el turno.</p>
              <div className="space-y-2 overflow-y-auto border border-gray-200 rounded-lg p-3 flex-1 bg-gray-50">
                {(hojasDeRuta.find(h => h.id === endTurnModal.routeId)?.cargas || []).map(carga => (
                  <label key={carga.id} className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-lg cursor-pointer hover:border-indigo-300 transition-colors shadow-sm">
                    <input
                      type="checkbox"
                      checked={deliveryChecklist[carga.id] || false}
                      onChange={() => toggleDelivery(carga.id)}
                      className="mt-0.5 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">{carga.id}</span>
                      <span className="text-xs text-gray-600">{carga.cliente}</span>
                      <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin size={10} /> {carga.direccion}</span>
                      {carga.whatsapp && <span className="text-xs text-green-600 mt-0.5">WhatsApp: {carga.whatsapp}</span>}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Km de Llegada</label>
              <input
                type="number"
                value={kmInput}
                onChange={e => setKmInput(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="Ej: 150250"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button
                onClick={() => setEndTurnModal({ isOpen: false, routeId: null })}
                className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmEndTurn}
                disabled={!(hojasDeRuta.find(h => h.id === endTurnModal.routeId)?.cargas || []).every(c => deliveryChecklist[c.id])}
                className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Confirmar Llegada
              </button>
            </div>
          </div>
        </div>
      )}
      {/* View Route Modal */}
      {viewRouteModal.isOpen && viewRouteModal.route && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-7xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Map size={20} className="text-indigo-600" />
                Detalle de Hoja de Ruta: {viewRouteModal.route.id}
              </h3>
              <button
                onClick={() => setViewRouteModal({ isOpen: false, route: null })}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Info Grid - Horizontal */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-6 bg-white border-b border-gray-200">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">SSCC</p>
                <p className="font-mono text-sm font-semibold text-gray-900 mt-1">{viewRouteModal.route.sscc || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Unidad</p>
                <p className="font-semibold text-gray-900 mt-1">{viewRouteModal.route.unidad}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Chofer</p>
                <p className="font-semibold text-gray-900 mt-1">{viewRouteModal.route.chofer}</p>
              </div>
              {viewRouteModal.route.acompanante && (
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Acompañante</p>
                  <p className="font-semibold text-gray-900 mt-1">{viewRouteModal.route.acompanante}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Tipo Flota</p>
                <p className="font-semibold text-gray-900 mt-1">{viewRouteModal.route.tipoFlota === 'propia' ? 'Propia' : 'Tercero'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Servicio</p>
                <p className="font-semibold text-gray-900 mt-1">{viewRouteModal.route.tipoServicio === 'larga_distancia' ? 'Larga Distancia' : 'Corta Distancia'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Estado</p>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium mt-1 ${viewRouteModal.route.estado === 'Lista para salir' ? 'bg-amber-100 text-amber-800' :
                  viewRouteModal.route.estado === 'En reparto' ? 'bg-blue-100 text-blue-800' :
                    viewRouteModal.route.estado === 'Finalizó reparto' ? 'bg-purple-100 text-purple-800' :
                      'bg-green-100 text-green-800'
                  }`}>
                  {viewRouteModal.route.estado}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Progreso</p>
                <p className="font-semibold text-gray-900 mt-1">
                  {(hojasDeRuta.find(h => h.id === viewRouteModal.route?.id)?.cargas || []).filter(c => c.estado === 'Entregado').length} / {(hojasDeRuta.find(h => h.id === viewRouteModal.route?.id)?.cargas || []).length}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">KM Salida</p>
                <p className="font-semibold text-gray-900 mt-1">{viewRouteModal.route.kmSalida || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">KM Llegada</p>
                <p className="font-semibold text-gray-900 mt-1">{viewRouteModal.route.kmLlegada || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Bultos</p>
                <p className="font-semibold text-gray-900 mt-1">{(hojasDeRuta.find(h => h.id === viewRouteModal.route?.id)?.cargas || []).reduce((acc, c) => acc + c.bultos, 0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Fecha Creación</p>
                <p className="font-semibold text-gray-900 mt-1 text-xs">{new Date(viewRouteModal.route.fechaCreacion).toLocaleString('es-AR')}</p>
              </div>
            </div>

            {/* Cargas Table - Full Width */}
            <div className="flex-1 overflow-auto p-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Package size={16} className="text-indigo-600" />
                Remitos Asignados ({(hojasDeRuta.find(h => h.id === viewRouteModal.route?.id)?.cargas || []).length})
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                      <th className="text-left py-2 px-3 font-medium">#</th>
                      <th className="text-left py-2 px-3 font-medium">ID</th>
                      <th className="text-left py-2 px-3 font-medium">Cliente</th>
                      <th className="text-left py-2 px-3 font-medium">Dirección</th>
                      <th className="text-left py-2 px-3 font-medium">WhatsApp</th>
                      <th className="text-center py-2 px-3 font-medium">Bultos</th>
                      <th className="text-center py-2 px-3 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(hojasDeRuta.find(h => h.id === viewRouteModal.route?.id)?.cargas || []).map((carga, idx) => (
                      <tr key={carga.id} className="hover:bg-gray-50">
                        <td className="py-2 px-3 text-gray-500">{idx + 1}</td>
                        <td className="py-2 px-3 font-mono text-xs text-gray-600">{carga.id}</td>
                        <td className="py-2 px-3 font-medium text-gray-900">{carga.cliente}</td>
                        <td className="py-2 px-3 text-gray-600">{carga.direccion}</td>
                        <td className="py-2 px-3 text-gray-500">{carga.whatsapp || '—'}</td>
                        <td className="py-2 px-3 text-center font-medium text-gray-900">{carga.bultos}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${carga.estado === 'Entregado' ? 'bg-green-100 text-green-800' :
                            carga.estado === 'Rechazado' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                            {carga.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
