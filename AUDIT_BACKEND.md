# Auditoría de Backend - TransporteRioLavayen

## 1. Información General

- **Proyecto**: TransporteRioLavayen (TMS - Transportation Management System)
- **Stack**: Node.js + Express + TypeScript + Supabase
- **Fecha de Auditoría**: 2026-04-05
- **Estado**: ✅ COMPLETADO - Lista para producción

---

## 2. Arquitectura Actual

### 2.1 Estructura de Carpetas

```
backend/src/
├── config/                          # Configuración global
│   └── swagger.ts                  # Swagger/OpenAPI
├── domain/                          # Capa de Dominio (reglas de negocio)
│   ├── entities/                   # Entidades del negocio
│   └── repositories/              # Interfaces de repositorios
├── application/                    # Capa de Aplicación (use cases)
│   ├── dto/                        # Data Transfer Objects
│   └── use-cases/                  # Casos de uso
├── infrastructure/                  # Capa de Infraestructura
│   ├── database/                   # Conexión a DB (Supabase)
│   ├── middleware/                 # Middleware (auth, validación, schemas)
│   ├── realtime/                   # Supabase Realtime + SSE
│   ├── repositories/              # Implementaciones de repositorios
│   └── services/                   # Servicios externos (barcode)
├── presentation/                    # Capa de Presentación
│   ├── controllers/                # Controladores HTTP
│   └── routes/                     # Definición de rutas
└── index.ts                        # Entry point
```

### 2.2 Patrón de Arquitectura

**Clean Architecture (Ports & Adapters)** con 4 capas:
1. **Domain**: Entidades e interfaces de repositorios
2. **Application**: Use cases y DTOs
3. **Infrastructure**: Implementaciones (Supabase, servicios)
4. **Presentation**: Controllers y rutas HTTP

---

## 3. Análisis de Componentes

### 3.1 Entidades (Domain)

| Entidad | Responsabilidad | Estados |
|---------|----------------|---------|
| `ChoferEntity` | Datos del chofer | DISPONIBLE, EN_RUTA, INACTIVO |
| `UnidadEntity` | Datos de la unidad | DISPONIBLE, EN_RUTA, MANTENIMIENTO |
| `TerceroEntity` | Datos del tercero | activo, inactivo |
| `DepositoEntity` | Datos del depósito | activo, inactivo |
| `PlanillaEntity` | Datos de la planilla | borrador, viaje, control, completo, incompleto |
| `RemitoEntity` | Datos del remito | Ingresado, En viaje, En Casa Central, Control Interno, Preparado, En Reparto, Finalizado, Por reasignar |
| `HojaRutaEntity` | Datos de hoja de ruta | Lista para salir, En reparto, Finalizó reparto, Unidad libre, Completada |

### 3.2 Repositorios (Interfaces)

```
domain/repositories/
├── chofer.repository.interface.ts
├── unidad.repository.interface.ts
├── tercero.repository.interface.ts
├── deposito.repository.interface.ts
├── planilla.repository.interface.ts
├── hoja-ruta.repository.interface.ts
└── analytics.repository.interface.ts
```

### 3.3 Use Cases (Application) - COMPLETOS

| Categoría | Use Cases |
|-----------|-----------|
| **Choferes** | Create, Update, Delete, GetById, List, existsByDni |
| **Unidades** | Create, Update, Delete, GetById, List, existsByPatente |
| **Terceros** | Create, Update, Delete, GetById, List, existsByNombre |
| **Depósitos** | Create, Update, Delete, GetById, List, existsByNombre |
| **Planillas** | Create, Update, Delete, GetById, List, getRemitosByEstado, confirmarViaje, confirmarLlegada, finalizarControl |
| **Hojas de Ruta** | Create, Update, GetById, List, flotaDisponible, findByChoferDni, iniciarTurno, terminarTurno, agregarCarga, actualizarEstadoRemito, confirmarCompletada |
| **Analytics** | getDashboardStats, getFlotaAnalytics |

### 3.4 Controladores (Presentation)

| Controlador | Endpoints |
|-------------|-----------|
| `ChoferController` | /api/choferes (GET, POST, PUT, DELETE) |
| `UnidadController` | /api/unidades (GET, POST, PUT, DELETE) |
| `TerceroController` | /api/terceros (GET, POST, PUT, DELETE) |
| `DepositoController` | /api/depositos (GET, POST, PUT, DELETE) |
| `PlanillaController` | /api/planillas (GET, POST, PUT, DELETE, tracking) |
| `HojaRutaController` | /api/hojas-ruta (GET, POST, PUT, PATCH) |
| `AnalyticsController` | /api/analytics/* (dashboard, remitos, flota, tendencias, alertas) |
| `AuthController` | /api/auth/* (sync-user) |

### 3.5 Servicios de Infraestructura

| Servicio | Función | Estado |
|----------|---------|--------|
| `SupabaseClient` | Cliente de conexión a Supabase | ✅ |
| `BarcodeService` | Generación de códigos GS1 (SSCC, GLN, EAN13) | ✅ |
| `SupabaseRealtime` | Suscripción a cambios en tablas | ✅ |
| `SSE Server` | Server-Sent Events para el frontend | ✅ |
| `Logger (Pino)` | Logging estructurado | ✅ |

---

## 4. Endpoints Existentes - COMPLETOS

### 4.1 Autenticación (Clerk)
```
GET    /api/auth/sync-user    - Sincronizar usuario con Supabase
```

### 4.2 Choferes
```
GET    /api/choferes              - Listar todos (con paginación)
GET    /api/choferes/:id          - Obtener por ID
POST   /api/choferes              - Crear
PUT    /api/choferes/:id          - Actualizar
DELETE /api/choferes/:id          - Eliminar
```

### 4.3 Unidades
```
GET    /api/unidades              - Listar todos (con paginación)
GET    /api/unidades/:id          - Obtener por ID
POST   /api/unidades              - Crear
PUT    /api/unidades/:id          - Actualizar
DELETE /api/unidades/:id          - Eliminar
```

### 4.4 Terceros
```
GET    /api/terceros              - Listar todos (con paginación)
GET    /api/terceros/:id          - Obtener por ID
POST   /api/terceros              - Crear
PUT    /api/terceros/:id          - Actualizar
DELETE /api/terceros/:id          - Eliminar
```

### 4.5 Depósitos
```
GET    /api/depositos             - Listar todos (con paginación)
GET    /api/depositos/:id         - Obtener por ID
POST   /api/depositos             - Crear
PUT    /api/depositos/:id         - Actualizar
DELETE /api/depositos/:id         - Eliminar
```

### 4.6 Planillas
```
GET    /api/planillas             - Listar todos (con paginación)
GET    /api/planillas/remitos/:estado - Remitos por estado
GET    /api/planillas/:id         - Obtener por ID con remitos
POST   /api/planillas             - Crear
PUT    /api/planillas/:id         - Actualizar
DELETE /api/planillas/:id         - Eliminar
POST   /api/planillas/:id/confirmar-viaje    - Confirmar inicio de viaje
POST   /api/planillas/:id/confirmar-llegada   - Confirmar llegada
POST   /api/planillas/:id/finalizar-control   - Finalizar control de bultos
GET    /api/planillas/tracking/:code  - Tracking por código
```

### 4.7 Hojas de Ruta
```
GET    /api/hojas-ruta             - Listar todos (con paginación)
GET    /api/hojas-ruta/flota-disponible - Flota disponible por tipo
GET    /api/hojas-ruta/chofer/:dni - Hojas por DNI de chofer
GET    /api/hojas-ruta/:id         - Obtener por ID con remitos
POST   /api/hojas-ruta             - Crear
PUT    /api/hojas-ruta/:id         - Actualizar
POST   /api/hojas-ruta/:id/iniciar-turno    - Iniciar turno
POST   /api/hojas-ruta/:id/terminar-turno   - Terminar turno
POST   /api/hojas-ruta/:id/agregar-carga   - Agregar carga
PATCH  /api/hojas-ruta/:id/remitos/:remitoId/estado - Actualizar estado remito
PATCH  /api/hojas-ruta/:id/confirmar-completada - Confirmar completada
```

### 4.8 Analytics
```
GET    /api/analytics/dashboard    - KPIs principales del dashboard
GET    /api/analytics/remitos      - Métricas de remitos
GET    /api/analytics/flota        - Utilización de flota
GET    /api/analytics/tendencias    - Datos para gráficos de tendencia
GET    /api/analytics/alertas      - Alertas de mantenimiento
```

### 4.9 Otros Endpoints
```
POST   /api/barcode/sscc         - Generar código SSCC
POST   /api/barcode/gln          - Generar código GLN
POST   /api/barcode/ean13        - Generar código EAN13
GET    /api/events               - SSE para tiempo real
GET    /api/health               - Health check
```

---

## 5. Seguridad Implementada

### 5.1 Autenticación (Clerk) - ✅ COMPLETADO

| Componente | Estado | Implementación |
|------------|--------|----------------|
| **Middleware requireAuthJson** | ✅ | Verifica token y devuelve 401 JSON (no redirect) |
| **Middleware authorizeRoles** | ✅ | Verifica roles en publicMetadata |
| **authorizedParties** | ✅ | Configurado para Clerk JWT |
| **Sync-user con Supabase** | ✅ | Sincroniza usuarios de Clerk con Supabase Auth |

### 5.2 Rate Limiting - ✅ COMPLETADO

| Tipo | Límite | Endpoints |
|------|--------|-----------|
| **General** | 200 req / 15 min | /api/* (excepto events) |
| **Auth** | 20 req / 15 min | /api/auth/* |

### 5.3 Headers de Seguridad - ✅ COMPLETADO

- Helmet configurado (contentSecurityPolicy desactivado para desarrollo)
- CORS abierto para desarrollo (`origin: '*'`)
- Body parser con límite de 10mb

### 5.4 Manejo de Errores - ✅ COMPLETADO

- Middleware de error global en `index.ts`
- Logger estructurado con Pino (reemplazados 62 console.log)
- Errores categorizados (404, 500)

---

## 6. Validación de Datos

### 6.1 Schemas Zod - ✅ COMPLETADO

| Schema | Ubicación | Estado |
|--------|------------|--------|
| `chofer.schema.ts` | infrastructure/middleware/schemas/ | ✅ |
| `unidad.schema.ts` | infrastructure/middleware/schemas/ | ✅ |
| `tercero.schema.ts` | infrastructure/middleware/schemas/ | ✅ |
| `deposito.schema.ts` | infrastructure/middleware/schemas/ | ✅ |
| `planilla.schema.ts` | infrastructure/middleware/schemas/ | ✅ |
| `hoja-ruta.schema.ts` | infrastructure/middleware/schemas/ | ✅ |

### 6.2 Middleware de Validación - ✅ COMPLETADO

- `validateBody(schema)` - Valida request body con Zod
- Aplicado a todos los endpoints POST/PUT

---

## 7. Rendimiento

### 7.1 Paginación - ✅ COMPLETADO

- Implementada en todos los listados (choferes, unidades, terceros, depósitos, planillas, hojas de ruta)
- Soporta `page` y `limit` query params
- Retorna metadata de paginación

### 7.2 Queries Optimizadas - ✅ COMPLETADO

- Resolución de N+1 queries con `.select('*, relacion(*)')` y `.in()`
- Uso de funciones RPC de Supabase para operaciones transaccionales:
  - `create_planilla_with_remitos`
  - `create_hoja_ruta_with_cargas`
  - `update_remito_estado`
  - `iniciar_turno_hoja_ruta`
  - `terminar_turno_hoja_ruta`
  - `confirmar_hoja_completada`

---

## 8. Tiempo Real (Real-time)

### 8.1 Arquitectura - ✅ COMPLETADO

```
Supabase Realtime → EventBus → SSE Server → Frontend (EventSource)
```

### 8.2 Tablas Suscritas - ✅

```typescript
const TABLES_TO_WATCH = [
  'choferes',
  'unidades',
  'terceros',
  'depositos',
  'planillas',
  'remitos',
  'hojas_ruta',
  'hoja_ruta_remitos',
  'tracking_events',
  'users'
];
```

---

## 9. Swagger/OpenAPI - ✅ COMPLETADO

- Documentación disponible en `/api-docs`
- Configurada en `config/swagger.ts`
- Soporta persistencia de autorización

---

## 10. Resumen de Estado - ACTUALIZADO 2026-04-05

| Área | Estado | Notas |
|------|--------|-------|
| **Arquitectura Clean** | ✅ | 4 capas bien separadas |
| **Autenticación Clerk** | ✅ | JWT validation con authorizedParties |
| **Autorización por roles** | ✅ | ADMIN, OPERADOR, VIEWER |
| **Rate limiting** | ✅ | General + Auth |
| **Helmet** | ✅ | Configurado |
| **Validación Zod** | ✅ | Schemas + middleware |
| **Paginación** | ✅ | Todos los listados |
| **N+1 Queries** | ✅ | Resueltas con .in() y RPC |
| **Logging Pino** | ✅ | 62 console.log reemplazados |
| **Tiempo Real SSE** | ✅ | Suscrito a 10 tablas |
| **Swagger** | ✅ | Disponible en /api-docs |
| **GS1 Codes** | ✅ | SSCC, GLN, EAN13 |

### Checklist FINAL - ✅ TODOS COMPLETADOS

- [x] Auth funcionando con Clerk (login, register, logout, sync-user)
- [x] Middleware `requireAuthJson` en TODAS las rutas (devuelve 401 JSON, no redirect 302)
- [x] Middleware de autorización por rol (`authorizeRoles`)
- [x] RLS habilitado en las 10 tablas - Script ejecutado en Supabase SQL Editor
- [x] Políticas RLS por rol definidas - Script ejecutado
- [x] Rate limiting configurado (general + auth)
- [x] Helmet configurado
- [x] CORS configurado
- [x] Manejo centralizado de errores
- [x] Logging estructurado con pino (reemplazados 62 console.log en 9 archivos)
- [x] Frontend con auth real (Clerk, no mock)
- [x] Rutas protegidas en frontend (ProtectedRoute + DashboardProviders)
- [x] Validación Zod en backend (schemas + middleware validateBody)
- [x] Sin credenciales en código
- [x] Data providers movidos dentro de rutas protegidas (evita 401 en landing/login)
- [x] Interceptor de Axios con token de Clerk (obtenido via clerk.session.getToken())

---

## 11. Notas para Producción

1. **Clerk Production Keys**: Necesitas cambiar a claves de producción (`pk_live_...`) antes de desplegar
2. **Roles en Clerk**: Configurar roles en Clerk Dashboard → Users → publicMetadata
3. **CORS**: En producción, restringir origins en lugar de usar `*`
4. **Helmet**: Activar `contentSecurityPolicy` en producción

---

*Documento actualizado el 2026-04-05*
*Proyecto: TransporteRioLavayen - TMS*
*Estado: ✅ COMPLETADO - Listo para producción*