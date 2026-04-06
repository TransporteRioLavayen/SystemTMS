export const BUTTON_LABELS = {
  create: (entity: string) => `Crear ${entity}`,
  edit: 'Editar',
  delete: 'Eliminar',
  save: 'Guardar',
  cancel: 'Cancelar',
  confirm: 'Confirmar',
  back: 'Volver',
  search: 'Buscar',
  filter: 'Filtrar',
  download: 'Descargar',
  print: 'Imprimir',
} as const;

export const ESTADOS = {
  chofer: {
    disponible: 'Disponible',
    en_ruta: 'En Ruta',
    inactivo: 'Inactivo',
  },
  unidad: {
    disponible: 'Disponible',
    en_ruta: 'En Ruta',
    mantenimiento: 'Mantenimiento',
  },
  planilla: {
    borrador: 'Borrador',
    viaje: 'En Viaje',
    control: 'En Control',
    completo: 'Completo',
    incompleto: 'Incompleto',
  },
} as const;

export const MESSAGES = {
  errors: {
    required: (field: string) => `El campo "${field}" es obligatorio`,
    invalid: (field: string) => `El campo "${field}" no es válido`,
    server: 'Hubo un problema. Intenta más tarde.',
    network: 'Sin conexión. Verifica tu internet.',
  },
  empty: {
    title: 'Sin registros',
    description: 'No hay datos para mostrar.',
    action: 'Crear primer registro',
  },
} as const;

export const TECHNICAL_TERMS = {
  SSCC: "SSCC (Serial Shipping Container Code): Código único que identifica el envío.",
  GLN: "GLN (Global Location Number): Código que identifica la ubicación.",
  EAN13: "EAN-13: Código de barras estándar de productos.",
  larga_distancia: "Viajes de más de 200km",
  corta_distancia: "Viajes dentro de la ciudad o región",
} as const;
