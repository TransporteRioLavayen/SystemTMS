// =============================================================================
// PLANILLA ENTITY - BACKEND
// =============================================================================

export interface Remito {
  id: string;
  remitente: string;
  numeroRemito: string;
  destinatario: string;
  bultos: number;
  valorDeclarado: number;
  seguimiento?: string;
  direccion?: string;
  whatsapp?: string;
  // Nuevos campos para el flujo de entregas
  estado?: 'Ingresado' | 'En viaje' | 'En Casa Central' | 'Control Interno' | 'Preparado' | 'En Reparto' | 'Finalizado' | 'Por reasignar';
  resultado?: 'Entregado' | 'Rechazado';
  // Campos de control (para cuando la planilla está en estado 'control' o 'completo')
  bultosRecibidos?: number;
  pesoTotal?: number;
}

export interface Planilla {
  id: string;
  sucursalOrigen: string;
  sucursalDestino?: string;
  fechaSalidaEstimada: string;
  fechaLlegadaEstimada?: string;
  camion: string;
  chofer: string;
  remitos: Remito[];
  estado: 'borrador' | 'viaje' | 'control' | 'completo' | 'incompleto';
  comentarios?: string;
  kmSalida?: number;
  kmLlegada?: number;
  createdAt: Date;
  updatedAt: Date;
}
