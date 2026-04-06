// =============================================================================
// HOJA DE RUTA ENTITY - BACKEND
// =============================================================================

export interface RemitoHoja {
  id?: string;  // Optional for creation
  remitoId?: string;  // ID del remito original en la tabla remitos
  cliente: string;    // destinatario del remito
  direccion: string;
  whatsapp?: string;
  bultos: number;
  estado?: 'En Base' | 'En reparto' | 'Entregado' | 'Rechazado';  // Optional for creation
  motivoRechazo?: string;  // Motivo del rechazo (obligatorio si estado = Rechazado)
  notasRechazo?: string;   // Notas adicionales del rechazo (opcional)
}

export interface HojaDeRuta {
  id: string;
  sscc?: string;  // SSCC - Serial Shipping Container Code (GS1, 18 dígitos)
  unidad: string;
  chofer: string;
  acompanante?: string;
  depositoOrigenId?: string;
  tipoFlota: 'propia' | 'tercero';
  tipoServicio: 'larga_distancia' | 'corta_distancia';
  cargas: RemitoHoja[];
  fechaCreacion: Date;
  estado: 'Lista para salir' | 'En reparto' | 'Finalizó reparto' | 'Unidad libre' | 'Completada';
  kmSalida?: number;
  kmLlegada?: number;
  createdAt: Date;
  updatedAt: Date;
}