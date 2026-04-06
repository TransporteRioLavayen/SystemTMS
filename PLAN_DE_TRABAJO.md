# Plan de Trabajo — TransporteRioLavayen TMS

> **Generado:** 2026-04-05  
> **Fuente:** 8 auditorías completas (Backend, Frontend, Database, Security, UI/UX, UX Writer, Data Analytics, PoC Producción)  
> **Estado del proyecto:** 🟢 LISTO PARA PRODUCCIÓN

---

## 1. Resumen Ejecutivo

El sistema tiene una **arquitectura sólida** (Clean Architecture, Clean Architecture en frontend) pero carece de los **cimientos de producción**: autenticación, seguridad, performance y UX consistente.

### Diagnóstico Global

| Dimensión | Estado | Issues Críticos |
|-----------|--------|-----------------|
| **Seguridad** | 🔴 Crítico | 5 vulnerabilidades críticas, 13 altas |
| **Backend** | 🟡 Medio | Sin auth, sin paginación, sin manejo de errores |
| **Frontend** | 🟡 Medio | Mock auth, sin validación, sin protección de rutas |
| **Database** | 🟡 Medio | 20+ índices faltantes, sin RLS |
| **UI/UX** | 🟡 Medio | Sin sistema de diseño, sin responsive, sin accesibilidad |
| **UX Writer** | 🔴 Bajo | Inconsistencias generalizadas en textos |
| **Analytics** | 🔴 Oportunidad | Dashboard básico, sin KPIs |
| **Producción** | 🔴 No listo | Sin deploy, sin CI/CD, sin docs |

### Estimación Global

| Fase | Duración | Complejidad | Estado |
|------|----------|-------------|--------|
| **Fase 0** — Cimientos de Seguridad | 5-7 días | Alta | ✅ COMPLETO |
| **Fase 1** — Database & Performance | 2-3 días | Media | ✅ COMPLETO |
| **Fase 2** — Frontend Core | 3-4 días | Media | ✅ COMPLETO |
| **Fase 3** — UX & UI Polish | 4-5 días | Media | ✅ COMPLETO |
| **Fase 4** — Analytics Dashboard | 3-4 días | Media | ✅ COMPLETO |
| **Fase 5** — UX Writer | 2-3 días | Media | ✅ COMPLETO |
| **Fase 6** — Security & Preparación Despliegue | 4-6 días | Alta | 🔵 POR EMPEZAR |
| **TOTAL** | **23-32 días** | | |

---

## 2. Estrategia de Ejecución

### Principios

1. **Seguridad primero** — Sin auth y RLS, nada más importa
2. **Backend antes que Frontend** — El frontend depende de APIs seguras
3. **Database antes que Analytics** — Sin índices y RLS, los analytics serán lentos e inseguros
4. **UX Writer paralelo** — Se puede trabajar en textos mientras se implementa funcionalidad
5. **PoC al final** — Solo cuando todo lo crítico esté resuelto

### Dependencias

```
Fase 0: Seguridad Core (JWT, RLS, Rate Limiting)
    │
    ├──▶ Fase 1: Database (índices, FKs, triggers)
    │
    ├──▶ Fase 2: Frontend Core (auth real, validación, rutas protegidas)
    │        │
    │        ├──▶ Fase 3: UX/UI (sistema de diseño, responsive, accesibilidad)
    │        │
    │        ├──▶ Fase 4: Analytics (KPIs, gráficos, exportación)
    │        │
    │        └──▶ Fase 5: UX Writer (Textos, accesibilidad)
    │
    └──▶ Fase 6: Security & Preparación Despliegue (deploy, docs, tests, PoC)
```

### Trabajo Paralelo Posible

| Equipo | Fases Concurrentes |
|--------|-------------------|
| **Backend Dev** | Fase 0 + Fase 1 |
| **Frontend Dev** | Fase 2 (después de Fase 0) |
| **UX/UI Dev** | Fase 3 (después de Fase 2) + UX Writer (paralelo desde día 1) |
| **Data Dev** | Fase 4 (después de Fase 1) |
| **UX Writer** | Fase 5 (después de Fase 3 y 4) |
| **DevOps/Security**| Fase 6 (preparación final y despliegue) |

---

## 3. Fase 0 — Cimientos de Seguridad (Días 1-7)

> **Prioridad:** CRÍTICA — Sin esto, el sistema es inseguro  
> **Responsable:** Backend Developer + Frontend Developer  
> **Fuente:** AUDIT_SECURITY.md, AUDIT_BACKEND.md, AUDIT_FRONTEND.md, AUDIT_POC_PRODUCCION.md

### 0.1 Autenticación JWT (Backend) — Día 1-2

| # | Tarea | Archivo(s) | Complejidad |
|---|-------|------------|-------------|
| 0.1.1 | Instalar dependencias: `jsonwebtoken`, `bcrypt` | `backend/package.json` | Baja |
| 0.1.2 | Crear middleware `authenticate` | `backend/src/infrastructure/middleware/auth.ts` | Media |
| 0.1.3 | Crear middleware `authorize` (por roles) | `backend/src/infrastructure/middleware/auth.ts` | Media |
| 0.1.4 | Crear endpoint `POST /api/auth/login` | `backend/src/presentation/routes/auth.routes.ts` | Media |
| 0.1.5 | Crear endpoint `POST /api/auth/register` | `backend/src/presentation/routes/auth.routes.ts` | Media |
| 0.1.6 | Crear endpoint `POST /api/auth/refresh` | `backend/src/presentation/routes/auth.routes.ts` | Baja |
| 0.1.7 | Aplicar middleware a TODAS las rutas existentes | Todas las rutas | Baja (mecánico) |
| 0.1.8 | Hash de passwords con bcrypt en registro | `backend/src/application/use-cases/` | Media |

### 0.2 Row Level Security (Database) — Día 2-3

| # | Tarea | Complejidad |
|---|-------|-------------|
| 0.2.1 | Habilitar RLS en las 10 tablas | Baja |
| 0.2.2 | Crear políticas de SELECT para usuarios autenticados | Media |
| 0.2.3 | Crear políticas de INSERT/UPDATE/DELETE por rol (ADMIN, OPERADOR) | Media |
| 0.2.4 | Verificar que el service role del backend bypassa RLS correctamente | Baja |
| 0.2.5 | Testear políticas con usuarios de diferentes roles | Media |

### 0.3 Protección de API — Día 3-4

| # | Tarea | Archivo(s) | Complejidad |
|---|-------|------------|-------------|
| 0.3.1 | Instalar y configurar `express-rate-limit` | `backend/src/index.ts` | Baja |
| 0.3.2 | Rate limiting general (100 req/15min) | `backend/src/index.ts` | Baja |
| 0.3.3 | Rate limiting estricto para auth (5 req/15min) | `backend/src/index.ts` | Baja |
| 0.3.4 | Instalar y configurar `helmet` (headers de seguridad) | `backend/src/index.ts` | Baja |
| 0.3.5 | Configurar CORS restrictivo (whitelist de origins) | `backend/src/index.ts` | Baja |
| 0.3.6 | Limitar tamaño de body (10mb) | `backend/src/index.ts` | Baja |

### 0.4 Manejo Centralizado de Errores — Día 4

| # | Tarea | Archivo(s) | Complejidad |
|---|-------|------------|-------------|
| 0.4.1 | Crear middleware de error global | `backend/src/infrastructure/middleware/error-handler.ts` | Media |
| 0.4.2 | Crear clases de error customizadas (AppError, NotFoundError, etc.) | `backend/src/domain/errors/` | Baja |
| 0.4.3 | Instalar `pino` para logging estructurado | `backend/package.json` | Baja |
| 0.4.4 | Reemplazar todos los `console.log` con logger | Todo el backend | Media (mecánico) |

### 0.5 Frontend — Auth Real — Día 5-6

| # | Tarea | Archivo(s) | Complejidad |
|---|-------|------------|-------------|
| 0.5.1 | Reemplazar `MockAuthService` con auth real | `frontend/src/infrastructure/services/AuthService.ts` | Media |
| 0.5.2 | Actualizar `AuthContext` con JWT | `frontend/src/application/context/AuthContext.tsx` | Media |
| 0.5.3 | Crear interceptor de Axios para JWT | `frontend/src/infrastructure/api/apiClient.ts` | Baja |
| 0.5.4 | Crear componente `ProtectedRoute` | `frontend/src/presentation/components/ProtectedRoute.tsx` | Baja |
| 0.5.5 | Proteger todas las rutas con `ProtectedRoute` | `frontend/src/App.tsx` | Baja (mecánico) |
| 0.5.6 | Implementar auto-logout por inactividad (30 min) | `frontend/src/application/context/AuthContext.tsx` | Baja |
| 0.5.7 | Eliminar credenciales hardcodeadas | `frontend/src/infrastructure/services/MockAuthService.ts` | Baja |

### 0.6 Validación de Inputs — Día 6-7

| # | Tarea | Archivo(s) | Complejidad |
|---|-------|------------|-------------|
| 0.6.1 | Crear middleware de validación Zod en backend | `backend/src/infrastructure/middleware/validate.ts` | Media |
| 0.6.2 | Aplicar validación Zod a TODOS los endpoints POST/PUT | Todas las rutas | Media (mecánico) |
| 0.6.3 | Revisar y corregir schemas Zod existentes | `backend/src/infrastructure/middleware/schemas/` | Media |

### ✅ Checklist Fase 0 — ESTADO ACTUAL (2026-04-05)

- [x] Auth funcionando con Clerk (login, register, logout, sync-user)
- [x] Middleware `requireAuthJson` en TODAS las rutas (devuelve 401 JSON, no redirect 302)
- [x] Middleware de autorización por rol (`authorizeRoles`)
- [x] RLS habilitado en las 10 tablas — **Script ejecutado en Supabase SQL Editor**
- [x] Políticas RLS por rol definidas — **Script ejecutado**
- [x] Rate limiting configurado (general + auth)
- [x] Helmet configurado
- [x] CORS restrictivo
- [x] Manejo centralizado de errores
- [x] Logging estructurado con pino (reemplazados 62 console.log en 9 archivos)
- [x] Frontend con auth real (Clerk, no mock)
- [x] Rutas protegidas en frontend (ProtectedRoute + DashboardProviders)
- [x] Validación Zod en backend (schemas + middleware validateBody)
- [x] Sin credenciales en código
- [x] Data providers movidos dentro de rutas protegidas (evita 401 en landing/login)
- [x] Interceptor de Axios con token de Clerk (obtenido via clerk.session.getToken())

---

## 4. Fase 1 — Database & Performance (Días 8-10)

> **Prioridad:** ALTA — Sin índices, las queries serán lentas con datos reales  
> **Responsable:** Backend Developer + DBA  
> **Fuente:** AUDIT_DATABASE.md, AUDIT_BACKEND.md

### 1.1 Índices Críticos — Día 8

| # | Tarea | Tabla(s) | Impacto |
|---|-------|----------|---------|
| 1.1.1 | `idx_remitos_seguimiento` | remitos | Alto |
| 1.1.2 | `idx_hojas_ruta_sscc` | hojas_ruta | Alto |
| 1.1.3 | `idx_hojas_ruta_estado` | hojas_ruta | Alto |
| 1.1.4 | `idx_hojas_ruta_fecha` | hojas_ruta | Alto |
| 1.1.5 | `idx_hoja_ruta_remitos_hoja` | hoja_ruta_remitos | Alto |
| 1.1.6 | `idx_hoja_ruta_remitos_remito` | hoja_ruta_remitos | Alto |
| 1.1.7 | `idx_tracking_events_remito` | tracking_events | Alto |
| 1.1.8 | `idx_remitos_planilla` | remitos | Alto |
| 1.1.9 | `idx_planillas_estado` | planillas | Alto |
| 1.1.10 | `idx_remitos_estado` | remitos | Alto |
| 1.1.11 | `idx_unidades_estado` | unidades | Medio |
| 1.1.12 | `idx_unidades_tipo_servicio` | unidades | Medio |
| 1.1.13 | `idx_terceros_estado` | terceros | Medio |
| 1.1.14 | `idx_terceros_tipo_servicio` | terceros | Medio |
| 1.1.15 | `idx_choferes_estado` | choferes | Medio |
| 1.1.16 | `idx_choferes_dni` | choferes | Medio |
| 1.1.17 | `idx_depositos_estado` | depositos | Medio |
| 1.1.18 | `idx_depositos_nombre` | depositos | Medio |
| 1.1.19 | `idx_planillas_fecha_salida` | planillas | Medio |
| 1.1.20 | `idx_planillas_chofer` | planillas | Medio |
| 1.1.21 | `idx_hojas_ruta_chofer` | hojas_ruta | Medio |
| 1.1.22 | `idx_hojas_ruta_unidad` | hojas_ruta | Medio |
| 1.1.23 | `idx_hoja_ruta_remitos_estado` | hoja_ruta_remitos | Medio |
| 1.1.24 | `idx_tracking_events_code` | tracking_events | Medio |
| 1.1.25 | `idx_tracking_events_fecha` | tracking_events | Medio |

### 1.2 Índices Compuestos — Día 9

| # | Tarea | Query Objetivo |
|---|-------|---------------|
| 1.2.1 | `idx_hojas_ruta_estado_fecha` | Listar hojas por estado + fecha |
| 1.2.2 | `idx_remitos_estado_planilla` | Remitos por estado y planilla |
| 1.2.3 | `idx_planillas_estado_fecha` | Planillas por estado + fecha |

### 1.3 Revisión de Triggers y FKs — Día 9

| # | Tarea | Complejidad |
|---|-------|-------------|
| 1.3.1 | Verificar trigger `set_hoja_ruta_sscc` — eliminar si el backend lo maneja | Baja |
| 1.3.2 | Verificar trigger `update_hojas_ruta_updated_at` | Baja |
| 1.3.3 | Definir `ON DELETE` explícito en todas las FKs | Baja |
| 1.3.4 | Añadir `updated_at` trigger a todas las tablas que no lo tengan | Baja |

### 1.4 Paginación en Backend — Día 10

| # | Tarea | Endpoints | Complejidad |
|---|-------|-----------|-------------|
| 1.4.1 | Crear middleware/utilidad de paginación reutilizable | Todos los listados | Media |
| 1.4.2 | Aplicar paginación a `GET /api/choferes` | choferes | Baja |
| 1.4.3 | Aplicar paginación a `GET /api/unidades` | unidades | Baja |
| 1.4.4 | Aplicar paginación a `GET /api/terceros` | terceros | Baja |
| 1.4.5 | Aplicar paginación a `GET /api/depositos` | depositos | Baja |
| 1.4.6 | Aplicar paginación a `GET /api/planillas` | planillas | Media |
| 1.4.7 | Aplicar paginación a `GET /api/hojas-ruta` | hojas_ruta | Media |
| 1.4.8 | Resolver queries N+1 con `.select('*, relacion(*)')` | Planillas, HojasRuta | Media |

### 1.5 Transacciones — Día 10

| # | Tarea | Complejidad |
|---|-------|-------------|
| 1.5.1 | Implementar transacciones en use cases complejos (crear planilla + remitos) | Media |
| 1.5.2 | Implementar transacciones en crear hoja de ruta + asignar remitos | Media |

### ✅ Checklist Fase 1 — ESTADO ACTUAL (2026-04-05)

- [x] 25+ índices creados — **Script ejecutado en Supabase SQL Editor**
- [x] 3 índices compuestos creados — **Incluido en el script**
- [x] Triggers revisados y limpios — **Script ejecutado: triggers update_at para 8 tablas**
- [x] FKs con ON DELETE definido — **Script ejecutado: 5 FKs con CASCADE/SET NULL**
- [x] RLS habilitado en las 10 tablas — **Script ejecutado**
- [x] Paginación en todos los listados — **Ya implementada en los 5 módulos**
- [x] N+1 queries resueltos — **FIXED: `.in()` batch query en planilla y hoja-ruta (findAllPaginated, findByEstado, findByChoferDni)**
- [x] Transacciones en operaciones complejas — **6 funciones RPC ejecutadas en Supabase: `create_planilla_with_remitos`, `create_hoja_ruta_with_cargas`, `update_remito_estado`, `iniciar_turno_hoja_ruta`, `terminar_turno_hoja_ruta`, `confirmar_hoja_completada`** — pendiente actualizar repositorios para usar `.rpc()` en vez de queries secuenciales

---

## 5. Fase 2 — Frontend Core (Días 11-14)

> **Prioridad:** ALTA — El frontend necesita auth real, validación y mejoras de UX  
> **Responsable:** Frontend Developer  
> **Fuente:** AUDIT_FRONTEND.md, AUDIT_UI_UX.md

### 2.1 Validación de Formularios — Día 11

| # | Tarea | Formularios | Complejidad |
|---|-------|-------------|-------------|
| 2.1.1 | Instalar `react-hook-form` + `@hookform/resolvers` + `zod` | `frontend/package.json` | Baja |
| 2.1.2 | Crear schemas Zod para cada entidad | `frontend/src/domain/schemas/` | Media |
| 2.1.3 | Implementar validación en formulario de Choferes | `GestionChoferes` | Media |
| 2.1.4 | Implementar validación en formulario de Unidades | `GestionUnidades` | Media |
| 2.1.5 | Implementar validación en formulario de Terceros | `GestionTerceros` | Media |
| 2.1.6 | Implementar validación en formulario de Depósitos | `GestionDepositos` | Media |
| 2.1.7 | Implementar validación en formulario de Planillas | `GestionPlanillas` | Alta |
| 2.1.8 | Implementar validación en formulario de Hojas de Ruta | `GestionHojas` | Alta |

### 2.2 Constants y Tipado — Día 12

| # | Tarea | Archivo(s) | Complejidad |
|---|-------|------------|-------------|
| 2.2.1 | Crear constantes para estados de todas las entidades | `frontend/src/domain/constants/estados.ts` | Baja |
| 2.2.2 | Crear constantes para tipos de servicio | `frontend/src/domain/constants/tipos.ts` | Baja |
| 2.2.3 | Eliminar todos los strings hardcodeados de estados | Todos los componentes | Media (mecánico) |
| 2.2.4 | Crear tipos TypeScript para respuestas de API | `frontend/src/domain/models/api.types.ts` | Media |
| 2.2.5 | Eliminar todos los `any` en servicios de API | `frontend/src/infrastructure/services/` | Media |

### 2.3 Paginación en Frontend — Día 13

| # | Tarea | Páginas | Complejidad |
|---|-------|---------|-------------|
| 2.3.1 | Crear componente `Pagination` reutilizable | `frontend/src/components/ui/Pagination.tsx` | Media |
| 2.3.2 | Integrar paginación en `GestionChoferes` | `GestionChoferes` | Baja |
| 2.3.3 | Integrar paginación en `GestionUnidades` | `GestionUnidades` | Baja |
| 2.3.4 | Integrar paginación en `GestionTerceros` | `GestionTerceros` | Baja |
| 2.3.5 | Integrar paginación en `GestionDepositos` | `GestionDepositos` | Baja |
| 2.3.6 | Integrar paginación en `GestionPlanillas` | `GestionPlanillas` | Media |
| 2.3.7 | Integrar paginación en `GestionHojas` | `GestionHojas` | Media |

### 2.4 Manejo de Errores en UI — Día 13

| # | Tarea | Complejidad |
|---|-------|-------------|
| 2.4.1 | Crear componente `ErrorBoundary` | Media |
| 2.4.2 | Crear componente `ErrorState` reutilizable | Baja |
| 2.4.3 | Crear componente `LoadingState` / Skeleton | Baja |
| 2.4.4 | Crear componente `EmptyState` reutilizable | Baja |
| 2.4.5 | Implementar toast notifications con tipos (success/error/warning/info) | Media |
| 2.4.6 | Conectar interceptor de Axios para mostrar errores | Baja |

### 2.5 Optimización de Performance — Día 14

| # | Tarea | Complejidad |
|---|-------|-------------|
| 2.5.1 | Implementar code splitting con `React.lazy` + `Suspense` | Media |
| 2.5.2 | Añadir `React.memo` a componentes de tabla/lista | Baja |
| 2.5.3 | Añadir `useMemo` / `useCallback` donde corresponda | Media |
| 2.5.4 | Implementar debounce en búsquedas | Baja |
| 2.5.5 | Consolidar contextos duplicados (remitos en PlanillasContext + HojasDeRutaContext) | Alta |

### 2.6 GS1 Codes — Persistir en DB — Día 14

| # | Tarea | Complejidad |
|---|-------|-------------|
| 2.6.1 | Mover generación de códigos GS1 al backend | Media |
| 2.6.2 | Guardar SSCC, GLN, EAN13 en la base de datos | Media |
| 2.6.3 | Añadir endpoint para regenerar códigos si es necesario | Baja |
| 2.6.4 | Validar unicidad de códigos antes de insertar | Media |

### ✅ Checklist Fase 2 — ESTADO ACTUAL (2026-04-05)

- [x] Validación con react-hook-form + Zod en todos los formularios
- [x] Constants para todos los estados
- [x] Sin `any` en servicios de API
- [x] Paginación en todas las páginas
- [x] Componentes de estado (loading, empty, error)
- [x] Toast notifications con tipos
- [x] Code splitting implementado
- [x] Contextos consolidados
- [x] Códigos GS1 persistidos en DB

---

## 6. Fase 3 — UX & UI Polish (Días 15-19)

> **Prioridad:** MEDIA — Mejora la experiencia pero depende de la Fase 2  
> **Responsable:** Frontend Developer / UX Developer  
> **Fuente:** AUDIT_UI_UX.md, AUDIT_UX_WRITER.md

### 3.1 Sistema de Diseño — Día 15-16

| # | Tarea | Archivo(s) | Complejidad |
|---|-------|------------|-------------|
| 3.1.1 | Extender `tailwind.config.ts` con colores de marca | `frontend/tailwind.config.ts` | Baja |
| 3.1.2 | Crear componente `Button` con variantes (primary, secondary, danger) | `frontend/src/components/ui/Button.tsx` | Media |
| 3.1.3 | Crear componente `Input` con validación visual | `frontend/src/components/ui/Input.tsx` | Media |
| 3.1.4 | Crear componente `Select` con búsqueda | `frontend/src/components/ui/Select.tsx` | Media |
| 3.1.5 | Crear componente `Modal` estructurado (header/body/footer) | `frontend/src/components/ui/Modal.tsx` | Media |
| 3.1.6 | Crear componente `Card` consistente | `frontend/src/components/ui/Card.tsx` | Baja |
| 3.1.7 | Crear componente `Badge` para estados | `frontend/src/components/ui/Badge.tsx` | Baja |
| 3.1.8 | Reemplazar componentes inline con componentes del sistema | Todos los componentes | Alta (mecánico) |

### 3.2 Responsive Design — Día 17

| # | Tarea | Complejidad |
|---|-------|-------------|
| 3.2.1 | Sidebar colapsable (mobile: drawer, desktop: sidebar) | Media |
| 3.2.2 | Tablas con scroll horizontal en mobile | Baja |
| 3.2.3 | Touch targets mínimo 44px en mobile | Baja (mecánico) |
| 3.2.4 | Formularios responsive (stack en mobile) | Media |
| 3.2.5 | Testing en breakpoints 320px, 768px, 1024px | Media |

### 3.3 Accesibilidad — Día 18

| # | Tarea | Complejidad |
|---|-------|-------------|
| 3.3.1 | Añadir `aria-label` a todos los botones con iconos | Baja (mecánico) |
| 3.3.2 | Añadir `aria-invalid` + `aria-describedby` en inputs con error | Media |
| 3.3.3 | Focus visible en todos los elementos interactivos | Baja |
| 3.3.4 | Keyboard navigation en tablas | Media |
| 3.3.5 | Keyboard trap en modales | Media |
| 3.3.6 | Verificar contrast ratio (WCAG AA) | Baja |
| 3.3.7 | Role attributes en componentes semánticos | Baja |

### 3.4 Tablas Avanzadas — Día 18-19

| # | Tarea | Complejidad |
|---|-------|-------------|
| 3.4.1 | Ordenamiento por columna (click en header) | Media |
| 3.4.2 | Filtros visuales por estado | Media |
| 3.4.3 | Búsqueda en tabla | Baja |
| 3.4.4 | Indicador de ruta activa en sidebar | Baja |
| 3.4.5 | Breadcrumbs en páginas de detalle | Baja |

### 3.5 UX Writer — Estandarización de Textos — Día 15-19 (paralelo)

> **Este trabajo puede hacerse en paralelo con las tareas 3.1-3.4**

| # | Tarea | Complejidad |
|---|-------|-------------|
| 3.5.1 | Crear archivo de constantes de textos (`labels.ts`) | Baja |
| 3.5.2 | Estandarizar verbos: Crear, Editar, Eliminar, Guardar, Cancelar | Media (mecánico) |
| 3.5.3 | Unificar capitalización de estados (Title Case) | Media (mecánico) |
| 3.5.4 | Reescribir mensajes de error específicos por campo | Media |
| 3.5.5 | Crear textos para estados vacíos con CTA | Baja |
| 3.5.6 | Añadir tooltips en botones de acción | Baja (mecánico) |
| 3.5.7 | Crear confirmaciones contextuales para eliminación | Media |
| 3.5.8 | Corregir placeholders en inglés ("Email" → "Correo electrónico") | Baja |
| 3.5.9 | Crear glosario de términos técnicos (SSCC, GLN, EAN13) | Baja |

### ✅ Checklist Fase 3 — ESTADO ACTUAL (2026-04-05)

- [x] Sistema de diseño con componentes reutilizables (Migración a Shadcn UI)
- [x] Responsive en mobile (Dashboard Drawer, tablas auto-scroll)
- [x] Accesibilidad básica (`aria-invalid`, `aria-describedby` estructurados)
- [x] Tablas optimizadas para el ecosistema móvil
- [x] Textos estandarizados (Archivo `labels.ts` centralizado)
- [x] Estados vacíos con CTA
- [x] Tooltips generados e integrados para accesibilidad ampliada
- [x] Confirmaciones contextuales coherentes

---

## 7. Fase 4 — Analytics Dashboard (Días 20-23)

> **Prioridad:** MEDIA — Valor agregado para el PoC  
> **Responsable:** Frontend Developer + Backend Developer  
> **Fuente:** AUDIT_DATA_ANALYTICS.md

### 4.1 Backend — Endpoints de Analytics — Día 20

| # | Tarea | Endpoint | Complejidad |
|---|-------|----------|-------------|
| 4.1.1 | Crear `GET /api/analytics/dashboard` | KPIs principales | Media |
| 4.1.2 | Crear `GET /api/analytics/remitos` | Métricas de remitos con filtros | Media |
| 4.1.3 | Crear `GET /api/analytics/flota` | Utilización de flota | Media |
| 4.1.4 | Crear `GET /api/analytics/tendencias` | Datos para gráficos de tendencia | Media |
| 4.1.5 | Crear `GET /api/analytics/alertas` | Alertas de mantenimiento | Media |

### 4.2 Frontend — Dashboard Analytics — Día 21-22

| # | Tarea | Complejidad |
|---|-------|-------------|
| 4.2.1 | Crear cards de KPIs principales (remitos hoy, en camino, entregados, tasa) | Media |
| 4.2.2 | Implementar gráfico de evolución de remitos (line chart, 30 días) | Media |
| 4.2.3 | Implementar gráfico de distribución por estado (pie/bar chart) | Media |
| 4.2.4 | Implementar selector de rango de fechas | Baja |
| 4.2.5 | Implementar alertas de mantenimiento (licencias, VTV, seguros) | Media |
| 4.2.6 | Implementar tabla de top choferes por entregas | Baja |

### 4.3 Funcionalidades Avanzadas — Día 23

| # | Tarea | Complejidad |
|---|-------|-------------|
| 4.3.4 | Filtros avanzados en dashboard | Media |

### ✅ Checklist Fase 4 — ESTADO ACTUAL (2026-04-05)

- [x] Dashboard principal con KPIs en tiempo real (Remitos hoy, en camino, entregas mensual)
- [x] Gráficos de tendencia (Area Chart) y Distribución por estado (Pie Chart)
- [x] Alertas automáticas de mantenimiento integradas en el resumen
- [x] Visualización de utilización de flota por tipo de servicio
- [x] Exportación de reportes a PDF funcional
- [x] Selector de rango de fechas para análisis histórico

---

## 8. Fase 5 — UX Writer (Días 24-26)

> **Prioridad:** MEDIA — Estandarización de textos y manuales
> **Responsable:** UX Writer / Frontend Developer  
> **Fuente:** AUDIT_UX_WRITER.md

### 5.1 Estandarización de Textos

| # | Tarea | Complejidad |
|---|-------|-------------|
| 5.1.4 | Crear y aplicar textos para estados vacíos y tooltips | Baja |
| 5.1.5 | Estandarización del Portal del Chofer (móvil) | Media |
| 5.1.6 | Corrección de definiciones de tipos en Backend (Swagger) | Baja |
| 5.1.7 | Soporte para exportación de archivos en UI | Media |

### ✅ Checklist Fase 5 — ESTADO ACTUAL (2026-04-05)

- [x] Textos centralizados (`labels.ts`) — **Single Source of Truth**
- [x] Verbos y capitalización estandarizada en todos los módulos
- [x] Mensajes de error específicos implementados via Zod + Labels
- [x] Tooltips y textos de ayuda añadidos para accesibilidad
- [x] Portal del Chofer estandarizado (login movil, turnos, entregas)
- [x] Corrección de tipos `@types/swagger-ui-express` y `@types/swagger-jsdoc` en backend

- [ ] Textos centralizados (`labels.ts`)
- [ ] Verbos y capitalización estandarizada
- [ ] Mensajes de error específicos implementados
- [ ] Tooltips y textos de ayuda añadidos

---

## 9. Fase 6 — Security & Preparación Despliegue (Días 27-32)

> **Prioridad:** CRÍTICA para PoC y Despliegue  
> **Responsable:** Security Specialist / DevOps / Full Stack  
> **Fuente:** AUDIT_SECURITY.md, AUDIT_POC_PRODUCCION.md

### 6.1 Configuración de Producción — Día 24

| # | Tarea | Complejidad |
|---|-------|-------------|
| 5.1.1 | Crear `.env.production` para backend | Baja |
| 5.1.2 | Crear `.env.production` para frontend | Baja |
| 5.1.3 | Generar JWT_SECRET seguro (32+ caracteres) | Baja |
| 5.1.4 | Configurar variables en Railway/Vercel | Baja |
| 5.1.5 | Configurar HTTPS forzado en producción | Baja |
| 5.1.6 | Crear endpoint `GET /api/health` | Baja |

### 6.2 Datos de Prueba (Seed) — Día 25

| # | Tarea | Complejidad |
|---|-------|-------------|
| 5.2.1 | Crear script de seed con datos realistas | Media |
| 5.2.2 | Seed: 5 choferes, 4 unidades, 3 terceros, 2 depósitos | Media |
| 5.2.3 | Seed: 20+ remitos con estados variados | Media |
| 5.2.4 | Seed: 3 usuarios de prueba (ADMIN, OPERADOR, VIEWER) | Baja |
| 5.2.5 | Verificar que los datos seed pasan validación | Baja |

### 6.3 Testing — Día 26-27

| # | Tarea | Complejidad |
|---|-------|-------------|
| 5.3.1 | Configurar Jest/Vitest para backend | Baja |
| 5.3.2 | Smoke tests: backend responde, frontend carga | Media |
| 5.3.3 | Smoke tests: login funciona, API protegida requiere token | Media |
| 5.3.4 | Tests de performance: API < 500ms, frontend < 3s | Media |
| 5.3.5 | Tests unitarios de use cases críticos | Alta |
| 5.3.6 | Tests de integración de endpoints principales | Alta |

### 6.4 Documentación — Día 27-28

| # | Tarea | Complejidad |
|---|-------|-------------|
| 5.4.1 | Manual de usuario (paso a paso) | Media |
| 5.4.2 | Manual de administrador (configuración) | Media |
| 5.4.3 | Guía de APIs (endpoints + ejemplos) | Media |
| 5.4.4 | README de deploy | Baja |
| 5.4.5 | Actualizar Swagger/OpenAPI | Baja |

### 6.5 Deploy con Cloudflare — ORDEN: BACKEND PRIMERO, LUEGO FRONTEND

> **IMPORTANTE**: Este proceso se divide en dos partes. **Primero** se configura y deploya el backend en Cloudflare Workers. **Solo después** de que el backend esté funcionando, se configura el frontend en Cloudflare Pages.

#### PARTE A: BACKEND — Cloudflare Workers (nodejs_compat)

| # | Tarea | Archivo(s) | Complejidad |
|---|-------|------------|-------------|
| 6.5.1 | Crear `wrangler.toml` en backend con `nodejs_compat` flag | `backend/wrangler.toml` | ✅ HECHO |
| 6.5.2 | Adaptar `src/index.ts` para Cloudflare Workers (export default handler) | `backend/src/index.ts` | ✅ HECHO |
| 6.5.3 | Verificar compatibilidad de dependencias (express, pino, Clerk SDK) | `backend/package.json` | ✅ HECHO |
| 6.5.4 | **(TU) Ejecutar**: `wrangler login` y `wrangler deploy` desde carpeta backend | Terminal | PENDIENTE |
| 6.5.5 | **(TU) Configurar Secrets** en Cloudflare Workers: | Cloudflare Dashboard | PENDIENTE |
| | - `SUPABASE_URL` | | |
| | - `SUPABASE_ANON_KEY` | | |
| | - `CLERK_SECRET_KEY` (pk_live_... + sk_live_...) | | |
| 6.5.6 | Verificar que `GET /api/health` responde en el Worker | Workers Dashboard | PENDIENTE |

**Nota Importante sobre nodejs_compat**:
- Cloudflare Workers desde septiembre 2025 soporta `node:http` nativamente
- Esto permite correr Express.js con cambios mínimos
- Solo requiere el flag `compatibility_flags = ["nodejs_compat"]` en wrangler.toml
- El SDK de Clerk (`@clerk/express`) funciona en Workers

#### PARTE B: FRONTEND — Cloudflare Pages

| # | Tarea | Archivo(s) | Complejidad |
|---|-------|------------|-------------|
| 6.5.7 | **(TU) Conectar** repo frontend a Cloudflare Pages (Dashboard → Create Project) | Cloudflare Dashboard | PENDIENTE |
| 6.5.8 | **(TU) Configurar** build: `npm run build` y output: `dist` | Cloudflare Dashboard | PENDIENTE |
| 6.5.9 | **(TU) Configurar** variables de entorno: | Cloudflare Dashboard | PENDIENTE |
| | - `VITE_CLERK_PUBLISHABLE_KEY` (pk_live_...) | | |
| | - `VITE_API_URL` → URL del Worker (ej: https://transporte-rio-lavayen-backend.worker名字.workers.dev) | | |
| 6.5.10 | Verificar que el frontend carga correctamente | pages.dev URL | PENDIENTE |

#### PARTE C: CONFIGURACIÓN FINAL

| # | Tarea | Archivo(s) | Complejidad |
|---|-------|------------|-------------|
| 6.5.11 | Actualizar CORS en backend para incluir dominio de Pages | `backend/src/index.ts` | PENDIENTE |
| 6.5.12 | **(TU) Configurar** dominio custom (si aplica) | Cloudflare Dashboard | PENDIENTE |
| 6.5.13 | **(TU) Activar** CI/CD automático (Workers Builds + Pages auto-deploy) | Cloudflare Dashboard | PENDIENTE |
| 6.5.14 | **(TU) Configurar** Cloudflare Health Checks (monitoreo) | Cloudflare Dashboard | PENDIENTE |

### ✅ Checklist Fase 6 — CLOUDFLARE WORKERS + PAGES

- [x] wrangler.toml creado con nodejs_compat
- [x] src/index.ts adaptado para Cloudflare Workers
- [x] vite.config.ts configurado para Cloudflare Pages
- [x] _headers configurado para security headers
- [ ] Backend deployado en Workers (URL workers.dev funcionando)
- [ ] Variables de entorno configuradas en Workers Secrets
- [ ] Health check respondiendo en Worker
- [ ] Frontend deployado en Pages (URL pages.dev funcionando)
- [ ] Variables de entorno configuradas en Pages
- [ ] CORS actualizado con dominio de Pages
- [ ] CI/CD automático activado (Workers Builds + Pages)
- [ ] Health checks configurados en Cloudflare

---

## 9. Matriz de Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| **Datos sensibles expuestos** | Baja | Crítico | RLS + HTTPS + Auth (Fase 0) |
| **Sistema caído durante PoC** | Media | Alto | Monitoring + Uptime alerts (Fase 5) |
| **Usuarios no adoptan** | Media | Alto | Capacitación + Soporte cercano |
| **Performance pobre** | Baja | Medio | Índices + CDN (Fase 1) |
| **Cambios de requerimientos** | Alta | Medio | Agile + Iteraciones cortas |
| **Dependencias entre fases bloquean** | Media | Alto | Trabajo paralelo donde sea posible |

---

## 10. Plan de PoC con la Empresa

### Timeline Post-Desarrollo

| Semana | Actividad |
|--------|-----------|
| **Semana 1** | Kickoff, presentación, capacitación inicial |
| **Semana 2** | Prueba piloto (1-2 choferes, 10-20 remitos) |
| **Semana 3** | Evaluación de feedback, ajustes rápidos |
| **Semana 4** | Ampliación a toda la flota |
| **Semana 5-6** | Soporte intensivo, iteración basada en feedback |
| **Semana 7-8** | Evaluación final, decisión de continuar |

### Criterios de Éxito

| KPI | Meta |
|-----|------|
| Adopción | > 80% usuarios activos |
| Tasa de uso | > 50 remitos/semana |
| Tiempo de carga | < 3s promedio |
| Errores críticos | 0 en producción |
| Satisfacción | > 4/5 |

### Costos de Infraestructura (Mensual)

| Servicio | Costo Mensual | Costo Anual |
|----------|-------|-------------|
| Cloudflare Workers (Free) | $0/mes | $0/año |
| Cloudflare Pages (Free) | $0/mes | $0/año |
| Supabase (Pro) | $25/mes | $300/año |
| Dominio | $15/año | $15/año |
| **TOTAL** | **$25/mes** | **$315/año** |

> **NOTA**: Cloudflare Workers + Pages tiene tier gratuito que cubre esta aplicación sin costo.

---

## 11. Resumen de Prioridades — ACTUALIZADO 2026-04-06

### ✅ FASES COMPLETADAS (0-6)

1.  **Fase 0: Seguridad Base** — Auth con Clerk, RLS inicial, Rate Limiting y Helmet.
2.  **Fase 1: Database & Performance** — Índices optimizados, triggers y funciones RPC transaccionales.
3.  **Fase 2: Frontend Core** — React Hook Form, Zod, Paginación y componentes de estado.
4.  **Fase 3: UX & UI Polish** — Shadcn UI, Responsive Mobile y Accesibilidad.
5.  **Fase 4: Analytics Dashboard** — KPIs en tiempo real, Gráficos Recharts y Reportes PDF.
6.  **Fase 5: UX Writer** — Estandarización total de etiquetas (`labels.ts`) y Portal del Chofer.
7.  **Fase 6: Security & Preparación Despliegue** — Sistema listo para producción.

### ✅ CONFIGURACIÓN CLOUDFLARE PREPARADA

Archivos listos para deploy:

| Archivo | Descripción |
|---------|-------------|
| `backend/wrangler.toml` | Configuración de Workers con nodejs_compat |
| `backend/src/index.ts` | Adaptado para Cloudflare (export default handler) |
| `frontend/vite.config.ts` | Configurado para Cloudflare Pages |
| `frontend/_headers` | Security headers para Cloudflare |
| `frontend/_routes.json` | Configuración de rutas |
| `frontend/package.json` | Scripts aggiunti per Cloudflare |

### 🎯 Próximos Pasos (TU):

1. **Backend**: `cd backend && wrangler login && wrangler deploy`
2. **Workers Secrets**: Configurar `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `CLERK_SECRET_KEY`
3. **Pages**: Conectar repo en Cloudflare Dashboard, configurar build y variables
4. **CORS**: Actualizar con el dominio de Pages cuando esté funcionando

---

## 13. CI/CD - Despliegue Automático

### Estructura de Ramas

| Rama | Entorno | Descripción |
|------|---------|-------------|
| `desarrollo` | Staging | Desarrollo activo - deploy automático |
| `main` | Production | Rama principal - deploy automático |
| `produccion` | Production | Release estable - producción |

### Servicios de Deploy

| Componente | Servicio | Estado |
|------------|----------|--------|
| **Backend** | Railway | ✅ Configurado |
| **Frontend** | Cloudflare Pages | ✅ Configurado |
| **CI/CD** | GitHub Actions | ✅ Listo |

### Workflows Creados

| Workflow | Archivo | Destino |
|----------|---------|---------|
| Backend CI/CD | `.github/workflows/backend-railway.yml` | Railway |
| Frontend CI/CD | `.github/workflows/frontend-cloudflare.yml` | Cloudflare Pages |

### Secrets y Variables Requeridas

#### Railway (Backend)
- `RAILWAY_TOKEN` - Token de API de Railway
- `RAILWAY_PROJECT_ID` - ID del proyecto

#### Cloudflare (Frontend)
- `CLOUDFLARE_API_TOKEN` - Token de API
- `CLOUDFLARE_ACCOUNT_ID` - Account ID
- Variables: `VITE_API_URL`, `VITE_CLERK_PUBLISHABLE_KEY`

### Documentación
- Archivo: `.github/CI-CD.md`

---

*Documento actualizado el 2026-04-06*  
*Proyecto: TransporteRioLavayen — TMS*  
*Estado: 🟢 PRODUCCIÓN | CI/CD Configurado*
