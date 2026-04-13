// =============================================================================
// ENTIDAD: ZONE (Zona Geográfica)
// =============================================================================
// Domain Layer - Representa la entidad del negocio
// Sin dependencias externas - solo reglas de negocio puro

export interface Zone {
  id: string;
  numero: number; // 1, 2, 3, 4
  nombre: string;
  descripcion?: string;
  estado: 'activo' | 'inactivo';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateZoneInput {
  numero: number;
  nombre: string;
  descripcion?: string;
}

export interface UpdateZoneInput {
  numero?: number;
  nombre?: string;
  descripcion?: string;
  estado?: 'activo' | 'inactivo';
}

export function createZoneEntity(data: CreateZoneInput & { id: string }): Zone {
  return {
    id: data.id,
    numero: data.numero,
    nombre: data.nombre,
    descripcion: data.descripcion,
    estado: 'activo',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function updateZoneEntity(zone: Zone, data: UpdateZoneInput): Zone {
  return {
    ...zone,
    numero: data.numero ?? zone.numero,
    nombre: data.nombre ?? zone.nombre,
    descripcion: data.descripcion ?? zone.descripcion,
    estado: data.estado ?? zone.estado,
    updatedAt: new Date(),
  };
}
