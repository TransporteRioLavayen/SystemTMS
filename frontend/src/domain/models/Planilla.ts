export interface Remito {
  id: string;
  remitente: string;
  numeroRemito: string;
  destinatario: string;
  bultos: number;
  valorDeclarado: number;
  seguimiento?: string;
  bultosRecibidos?: number;
  pesoTotal?: number;
  direccion?: string;
  whatsapp?: string;
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
  createdAt?: Date;
  updatedAt?: Date;
}
