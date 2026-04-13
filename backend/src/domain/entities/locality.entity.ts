// =============================================================================
// ENTIDAD: LOCALITY (Localidad/Ciudad)
// =============================================================================
// Domain Layer

export interface Locality {
  id: string;
  zoneId: string;
  nombre: string;
  lat: number;
  lng: number;
  estado: 'activo' | 'inactivo';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLocalityInput {
  zoneId: string;
  nombre: string;
  lat: number;
  lng: number;
}

export interface UpdateLocalityInput {
  nombre?: string;
  lat?: number;
  lng?: number;
  estado?: 'activo' | 'inactivo';
}

export function createLocalityEntity(data: CreateLocalityInput & { id: string }): Locality {
  return {
    id: data.id,
    zoneId: data.zoneId,
    nombre: data.nombre,
    lat: data.lat,
    lng: data.lng,
    estado: 'activo',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function updateLocalityEntity(locality: Locality, data: UpdateLocalityInput): Locality {
  return {
    ...locality,
    nombre: data.nombre ?? locality.nombre,
    lat: data.lat ?? locality.lat,
    lng: data.lng ?? locality.lng,
    estado: data.estado ?? locality.estado,
    updatedAt: new Date(),
  };
}
