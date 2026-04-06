// =============================================================================
// DTO: UNIDAD RESPONSE
// =============================================================================
export interface UnidadResponseDTO {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
  anio: string;
  tipo: string;
  vtv?: string;
  seguro?: string;
  estado: string;
  createdAt: string;
  updatedAt: string;
}