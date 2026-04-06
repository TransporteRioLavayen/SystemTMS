// =============================================================================
// CENTRALIZED UI LABELS - UX WRITER 
// =============================================================================

export const LABELS = {
  common: {
    actions: {
      search: 'Buscar',
      save: 'Guardar',
      cancel: 'Cancelar',
      edit: 'Editar',
      delete: 'Eliminar',
      confirm: 'Confirmar',
      back: 'Volver',
      refresh: 'Actualizar',
      loading: 'Cargando...',
      exportReport: 'Exportar Reporte',
      downloadPdf: 'Reporte PDF',
    },
    status: {
      active: 'Activo',
      inactive: 'Inactivo',
      pending: 'Pendiente',
      completed: 'Completada',
      cancelled: 'Cancelada',
      inTransit: 'En Reparto',
      atBase: 'En Base',
    }
  },
  dashboard: {
    title: 'Panel de Control Analítico',
    subtitle: 'Monitoreo de KPIs logísticos y operativos en tiempo real',
    kpis: {
        remitosHoy: {
            title: 'Remitos Hoy',
            description: 'Envíos generados hoy',
        },
        enCamino: {
            title: 'En Camino',
            description: 'Unidades en reparto',
        },
        entregadosMes: {
            title: 'Entregados Mes',
            description: 'Completados con éxito',
        },
        tasaEntrega: {
            title: 'Tasa de Entrega',
            description: 'Eficiencia de reparto',
        }
    },
    charts: {
        trend: {
            title: 'Evolución de Envíos',
            description: 'Volumen diario de remitos (últimos 30 días)',
        },
        status: {
            title: 'Distribución por Estado',
            description: 'Estados actuales de la mercadería',
        },
        fleet: {
            title: 'Estado de Flota',
            description: 'Distribución y disponibilidad de unidades',
            utilization: 'Utilización General',
            byService: 'Por Tipo de Servicio',
        }
    },
    alerts: {
        title: 'Alertas de Mantenimiento',
        description: 'Vencimientos de licencias, VTV y seguros',
        noAlerts: 'No hay alertas activas',
        expiresOn: 'Vence el:',
    }
  },
  logistics: {
    planillas: {
        title: 'Gestión de Planillas',
        new: 'Nueva Planilla',
        createNew: 'Crear Planilla',
        edit: 'Editar Planilla',
        subtitle: 'Administra y supervisa los viajes y remitos de la sucursal',
        subtitleNew: 'Complete los datos para registrar un nuevo viaje',
        draftTitle: 'Planillas en Borrador',
        tripTitle: 'Planillas en Viaje',
        historyTitle: 'Historial de Planillas',
        noDrafts: 'No hay planillas en borrador',
        noTrips: 'No hay planillas en viaje',
        noHistory: 'No hay planillas registradas',
        headerCompleteMsg: 'Complete Sucursal Origen y Fecha Salida para habilitar remitos',
        step1: 'Paso 1: Cabecera',
        step2: 'Paso 2: Carga de Remitos',
        saveDraft: 'Guardar en Borrador',
        confirmTripTitle: 'Confirmar Viaje',
        kmSalida: 'Kilometraje de Salida',
        detailsTitle: 'Detalle de Planilla',
    },
    hojasRuta: {
        title: 'Gestión de Hojas de Ruta',
        subtitle: 'Control de entregas y seguimiento de unidades de última milla',
        new: 'Nueva Hoja de Ruta',
        createNew: 'Crear Hoja de Ruta',
        edit: 'Editar Hoja de Ruta',
        detailsTitle: 'Detalle de Hoja de Ruta',
        startTrip: 'Iniciar Turno',
        endTrip: 'Terminar Turno',
        confirmComplete: 'Confirmar Completada',
        kmSalida: 'KM de Salida',
        kmLlegada: 'KM de Llegada',
        noHojas: 'No hay hojas de ruta disponibles',
        historyTitle: 'Historial de Operaciones',
        activeTitle: 'Hojas en Proceso',
        pendingTitle: 'Hojas Pendientes',
    }
  },
  fleet: {
    choferes: {
      title: 'Gestión de Choferes',
      subtitle: 'Administra el personal de conducción, su disponibilidad y asignaciones',
      new: 'Nuevo Chofer',
      edit: 'Editar Chofer',
      registerNew: 'Registrar Nuevo Chofer',
      listTitle: 'Choferes Registrados',
      noChoferes: 'No hay choferes registrados',
      licenseWillExpire: 'Licencias por Vencer (30 días)',
      licenseExpired: 'Licencias Vencidas',
      confirmDelete: '¿Estás seguro de que deseas eliminar este chofer?',
    },
    unidades: {
        title: 'Gestión de Unidades',
        subtitle: 'Control de flota, mantenimiento y disponibilidad de vehículos',
        new: 'Nueva Unidad',
        edit: 'Editar Unidad',
        listTitle: 'Unidades de la Flota',
        noUnidades: 'No hay unidades registradas',
        confirmDelete: '¿Estás seguro de que deseas eliminar esta unidad?',
    }
  },
  admin: {
    cargas: {
      title: 'Control de Cargas',
      subtitle: 'Recepción y auditoría de remitos para su distribución',
      new: 'Nueva Carga',
      edit: 'Editar Carga',
      listTitle: 'Remitos en Stock',
      noCargas: 'No hay cargas registradas',
    },
    depositos: {
      title: 'Gestión de Depósitos',
      subtitle: 'Administración de sedes y puntos de transferencia',
      new: 'Nuevo Depósito',
      edit: 'Editar Depósito',
    },
    terceros: {
      title: 'Gestión de Terceros',
      subtitle: 'Administración de transportistas externos y aliados logísticos',
      new: 'Nuevo Tercero',
      edit: 'Editar Tercero',
      listTitle: 'Terceros Registrados',
      noTerceros: 'No hay terceros registrados',
    }
  },
  driverPortal: {
    title: 'Portal del Chofer',
    subtitle: 'Ingrese su DNI para acceder',
    dniLabel: 'DNI del Chofer',
    loginButton: 'Ingresar',
    myRoutes: 'Mis Rutas',
    greeting: 'Hola',
    startTurn: 'Comenzar Turno',
    endTurn: 'Terminar Turno',
    activeTurn: 'Turno activo - Entregando',
    inactiveTurn: 'Turno no iniciado - Presioná "Play" para comenzar',
    noRoutes: 'No tienes hojas de ruta activas',
    deliveries: 'Entregas',
    deliveryDetail: 'Detalle de Entrega',
    markDelivered: 'Marcar como Entregado',
    markRejected: 'No Entregado',
  }
};
