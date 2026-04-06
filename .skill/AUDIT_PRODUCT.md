# Auditoría Técnica: Producto y Funcionalidad

> **Proyecto:** TransporteRioLavayen TMS  
> **Área:** Product / Funcionalidad del Negocio  
> **Estado:** 🟢 OPERATIVO - Ciclo logístico cerrado  
> **Auditor:** Senior Architect  
> **Fecha:** 2026-04-06

---

## 1. Resumen Ejecutivo

TransporteRioLavayen es un sistema de gestión de transporte y logística (TMS) que abarca todo el ciclo operativo: desde la recepción de mercadería hasta la entrega final. Después de las fases de desarrollo, el sistema cuenta con todos los módulos necesarios para operar un servicio logístico profesional, con trazabilidad completa y estados consistentes.

### Módulos del Sistema

| Módulo | Descripción | Estado |
|--------|-------------|--------|
| Gestión de Recursos | Choferes, Unidades, Terceros, Depósitos | ✅ |
| Planillas | Creación y gestión de viajes | ✅ |
| Hojas de Ruta | Distribución a última milla | ✅ |
| Portal del Chofer | Vista móvil para choferes | ✅ |
| Tracking Público | Consulta de estado | ✅ |
| Analytics | Dashboard y reportes | ✅ |

---

## 2. Flujo Operativo Completo

### 2.1 Diagrama del Ciclo Logístico

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FLUJO LOGÍSTICO                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐            │
│  │  RECEPCIÓN   │────▶│  PLANIFICACIÓN│────▶│  DESPACHO   │            │
│  │              │     │              │     │              │            │
│  │ • Choferes   │     │ • Planillas  │     │ • Hojas Ruta│            │
│  │ • Unidades   │     │ • Remitos    │     │ • SSCC      │            │
│  │ • Terceros   │     │ • Asignación│     │ • Carga     │            │
│  └──────────────┘     └──────────────┘     └──────────────┘            │
│                                                      │                   │
│                                                      ▼                   │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐            │
│  │  SEGUIMIENTO │◀────│   ENTREGA    │◀────│  TRANSITO    │            │
│  │              │     │              │     │              │            │
│  │ • Tracking   │     │ • Chofer    │     │ • Estado     │            │
│  │ • Eventos    │     │ • Rechazos  │     │ • Ubicación │            │
│  │ • Historial  │     │ • Confirmar │     │ • Updates   │            │
│  └──────────────┘     └──────────────┘     └──────────────┘            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Detalle de Fases

#### Fase 1: Recepción y Planificación

| Proceso | Descripción |
|--------|-------------|
| Alta de recursos | Alta/baja/modificación de choferes, unidades, terceros |
| Depósitos | Gestión de puntos de origen y destino |
| Planillas | Creación de viajes con asignación de remitos |
| atomicidad | Guardado consistente de planilla + remitos |

#### Fase 2: Control Interno

| Proceso | Descripción |
|--------|-------------|
| Confirmar salida | Cambio de estado a "EN_VIAJE" |
| Recepción | Confirmar llegada a destino |
| Control de bultos | Validar recibidos vs declarados |
| Discrepancias | Manejo de diferencias |

#### Fase 3: Despacho a Última Milla

| Proceso | Descripción |
|--------|-------------|
| Hojas de Ruta | Consolidar remitos por zona |
| SSCC | Códigos GS1-18 únicos por unidad |
| Asignación | Arrastrar remitos a unidades |

#### Fase 4: Entrega y Seguimiento

| Proceso | Descripción |
|--------|-------------|
| Portal Chofer | Vista móvil simplificada |
| Entregas | Confirmar entrega/rechazo |
| Tracking | Consulta pública por código |

---

## 3. Gestión de Recursos

### 3.1 Choferes

| Campo | Tipo | Validación |
|-------|------|------------|
| Nombre | String | Requerido |
| DNI | String | Único, 7-10 dígitos |
| Licencia | String | Requerida |
| Vencimiento | Date | Required, futuro |
| Teléfono | String | Mínimo 8 dígitos |
| Estado | Enum | DISPONIBLE/EN_RUTA/INACTIVO |

### 3.2 Unidades

| Campo | Tipo | Validación |
|-------|------|------------|
| Patente | String | Única |
| Marca/Modelo | String | Requerido |
| Año | String | - |
| Tipo | Enum | Semi/Chasis/Acoplado/Utilitario |
| VTV | Date | Required |
| Seguro | Date | Required |
| Tipo Servicio | Enum | LARGA_DISTANCIA/CORTA_DISTANCIA |

### 3.3 Terceros

| Campo | Tipo | Validación |
|-------|------|------------|
| Razón Social | String | Requerido |
| Tipo Documento | Enum | CUIT/DNI/CUIL |
| Número | String | Único según tipo |
| Unidad | Enum | Semi/Chasis/Acoplado/Utilitario |
| Contacto | String | Teléfono válido |

### 3.4 Depósitos

| Campo | Tipo | Validación |
|-------|------|------------|
| Nombre | String | Requerido |
| Ubicación | String | - |
| Capacidad | Number | - |
| Encargado | String | - |
| Coordenadas | Lat/Lng | Para mapping |

---

## 4. Planillas y Remitos

### 4.1 Estados de Planilla

| Estado | Descripción | Transiciones |
|--------|-------------|---------------|
| BORRADOR | Creada, sin confirmar | → CONFIRMADO |
| CONFIRMADA | Lista para salir | → EN_VIAJE |
| EN_VIAJE | En tránsito | → LLEGADA |
| LLEGADA | Llegó a destino | → COMPLETADA |
| COMPLETADA | Proceso finalizado | Terminal |
| INCOMPLETA | Con discrepancias | → COMPLETADA |

### 4.2 Estados de Remito

| Estado | Descripción |
|--------|-------------|
| PENDIENTE | Esperando asignación |
| ASIGNADO | En una planilla |
| EN_TRANSITO | En viaje |
| ENTREGADO | Entregado al cliente |
| RECHAZADO | Rechazado por el cliente |
| ANULADO | Dado de baja |

### 4.3 atomicidad

Las operaciones complejas usan funciones RPC de Supabase:

- `create_planilla_with_remitos` - Crea planilla + remitos en una transacción
- `update_remito_estado` - Actualiza estado + registra en tracking

---

## 5. Hojas de Ruta

### 5.1 Propósito

Las hojas de ruta permiten subdividir una planilla grande en múltiples entregas por unidad/chofer para distribución a última milla.

### 5.2 Características

- **SSCC**: Código único GS1-18 por hoja
- **Drag & Drop**: Arrastrar remitos entre hojas
- **Tracking**: Seguimiento en tiempo real
- **Confirmación**: El chofer confirma entregas

### 5.3 Estados

| Estado | Descripción |
|--------|-------------|
| PENDIENTE | Creada, sin iniciar |
| EN_CURSO | Turno iniciado |
| COMPLETADA | Todas las entregas confirmadas |

---

## 6. Portal del Chofer

### 6.1 Funcionalidades

| Feature | Descripción |
|---------|-------------|
| Ver turnos | Hojas de ruta asignadas |
| Confirmar entrega | Marcar como entregado |
| Registrar rechazo | Registrar motivo |
| Foto evidencia | Subir foto (futuro) |
| Firma digital | Capturar firma (futuro) |

### 6.2 Diseño Mobile-First

- Interfaz simplificada
- Botones grandes (touch-friendly)
- Sin funcionalidades innecesarias
- Funciona offline parcial

---

## 7. Trazabilidad

### 7.1 Tracking Events

Cada cambio de estado genera un evento:

```typescript
{
  remito_id: "uuid",
  estado_anterior: "EN_TRANSITO",
  estado_nuevo: "ENTREGADO",
  fecha: "2026-04-06T10:30:00Z",
  usuario_id: "user_xxx",
  observaciones: "Entregado en mostrador"
}
```

### 7.2 Consulta Pública

Landing page donde el cliente puede ingresar el código de seguimiento (TRK-XXXXX) para ver el estado de su remito.

---

## 8. Requisitos Funcionales Cumplidos

### 8.1 Checklist

- [x] Trazabilidad completa de remitos
- [x] Gestión de flota propia y terceros
- [x] Alertas de vencimiento (VTV, Licencias, Seguros)
- [x] Integridad de datos (no hay despachos sin control)
- [x] Sincronización en tiempo real (SSE)
- [x] Exportación de manifiestos (PDF)
- [x] Prevención de carga doble

### 8.2 Flujo Intuitivo

| Pregunta | Respuesta |
|----------|-----------|
| ¿El flujo es claro? | Sí, guiado por estados |
| ¿Manejo de rechazos? | Sí, con motivos |
| ¿Export PDF? | Sí, jsPDF |
| ¿Previene carga doble? | Sí, validaciones |
| ¿Valida km/odómetro? | En cada tramo |

---

## 9. Roadmap de Funcionalidades

### 9.1 Corto Plazo
1. Mejora de Portal del Chofer
2. Evidencia foto por entrega
3. Firma digital del receptor

### 9.2 Mediano Plazo
1. Módulo de facturación
2. Liquidación de terceros
3. Integración con GPS real

### 9.3 Largo Plazo
1. App nativa (React Native)
2. Tracking en tiempo real (GPS)
3. Integración con ERPs de clientes

---

## 10. Referencias

- **Planillas:** `frontend/src/presentation/pages/GestionPlanillas.tsx`
- **Hojas de Ruta:** `frontend/src/presentation/pages/GestionHojas.tsx`
- **Portal Chofer:** `frontend/src/presentation/pages/PortalChofer.tsx`
- **Tracking:** `frontend/src/presentation/pages/TrackingPublico.tsx`
- **API:** `backend/src/presentation/routes/planilla.routes.ts`
