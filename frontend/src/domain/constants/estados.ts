export const ESTADOS_CHOFER = {
  DISPONIBLE: 'DISPONIBLE',
  EN_RUTA: 'EN_RUTA',
  INACTIVO: 'INACTIVO',
} as const;

export const ESTADOS_UNIDAD = {
  DISPONIBLE: 'DISPONIBLE',
  EN_RUTA: 'EN_RUTA',
  MANTENIMIENTO: 'MANTENIMIENTO',
} as const;

export const ESTADOS_TERCERO = {
  ACTIVO: 'activo',
  INACTIVO: 'inactivo',
} as const;

export const ESTADOS_DEPOSITO = {
  ACTIVO: 'activo',
  INACTIVO: 'inactivo',
} as const;

export const ESTADOS_PLANILLA = {
  BORRADOR: 'borrador',
  VIAJE: 'viaje',
  CONTROL: 'control',
  COMPLETO: 'completo',
  INCOMPLETO: 'incompleto',
} as const;

export const ESTADOS_HOJA_RUTA = {
  PREPARANDO: 'preparando',
  LISTA_PARA_SALIR: 'Lista para salir',
  EN_REPARTO: 'En reparto',
  FINALIZO_REPARTO: 'Finalizó reparto',
  UNIDAD_LIBRE: 'Unidad libre',
  COMPLETADA: 'Completada',
} as const;

export const ESTADOS_REMITO = {
  INGRESADO: 'Ingresado',
  EN_VIAJE: 'En viaje',
  EN_CASA_CENTRAL: 'En Casa Central',
  CONTROL_INTERNO: 'Control Interno',
  PREPARADO: 'Preparado',
  EN_REPARTO: 'En Reparto',
  FINALIZADO: 'Finalizado',
  POR_REASIGNAR: 'Por reasignar',
} as const;
