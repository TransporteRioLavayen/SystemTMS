// =============================================================================
// ENTIDAD: DEPOSITO
// =============================================================================
// Domain Layer - Representa la entidad del negocio
// Sin dependencias externas - solo reglas de negocio puro

export interface Deposito {
  id: string;
  nombre: string;
  ubicacion: string;
  capacidad: number;
  encargado?: string;
  lat?: number;
  lng?: number;
  estado: 'activo' | 'inactivo';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDepositoInput {
  nombre: string;
  ubicacion: string;
  capacidad: number;
  encargado?: string;
  lat?: number;
  lng?: number;
}

export interface UpdateDepositoInput {
  nombre?: string;
  ubicacion?: string;
  capacidad?: number;
  encargado?: string | null;
  lat?: number | null;
  lng?: number | null;
  estado?: 'activo' | 'inactivo';
}

// Factory para crear una entidad válida
export function createDepositoEntity(data: CreateDepositoInput & { id: string }): Deposito {
  return {
    id: data.id,
    nombre: data.nombre,
    ubicacion: data.ubicacion,
    capacidad: data.capacidad,
    encargado: data.encargado,
    lat: data.lat,
    lng: data.lng,
    estado: 'activo',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}