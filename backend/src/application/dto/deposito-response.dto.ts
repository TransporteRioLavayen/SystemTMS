// =============================================================================
// DTO: DEPOSITO RESPONSE
// =============================================================================
// Application Layer - Respuesta estandarizada para el cliente

import { Deposito } from '../../domain/entities/deposito.entity';

export interface DepositoResponseDTO {
  id: string;
  nombre: string;
  ubicacion: string;
  capacidad: number;
  encargado?: string;
  lat?: number;
  lng?: number;
  estado: 'activo' | 'inactivo';
  createdAt: string;
  updatedAt: string;
}

// Mapper de entidad a DTO de respuesta
export function toDepositoResponseDTO(deposito: Deposito): DepositoResponseDTO {
  return {
    id: deposito.id,
    nombre: deposito.nombre,
    ubicacion: deposito.ubicacion,
    capacidad: deposito.capacidad,
    encargado: deposito.encargado,
    lat: deposito.lat,
    lng: deposito.lng,
    estado: deposito.estado,
    createdAt: deposito.createdAt.toISOString(),
    updatedAt: deposito.updatedAt.toISOString(),
  };
}