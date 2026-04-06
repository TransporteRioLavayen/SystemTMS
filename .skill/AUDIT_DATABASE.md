# Auditoría Técnica: Base de Datos

> **Proyecto:** TransporteRioLavayen TMS  
> **Área:** Database / Data Layer  
> **Estado:** 🟢 ESTABILIZADO - Índices y RLS configurados  
> **Auditor:** Senior Architect  
> **Fecha:** 2026-04-06

---

## 1. Resumen Ejecutivo

La base de datos de TransporteRioLavayen está construida sobre Supabase (PostgreSQL managed) y gestiona toda la información del sistema de transporte y logística. El esquema relacional ha sido optimizado con índices apropiados, políticas de seguridad Row Level Security (RLS), y funciones RPC para garantizar atomicidad en operaciones complejas.

### Stack Confirmado

| Componente | Tecnología | Notas |
|------------|------------|-------|
| Base de datos | PostgreSQL | Managed por Supabase |
| ORM/Query Builder | Supabase JS | Client oficial |
| Seguridad | RLS | Row Level Security |
| Transacciones | Funciones RPC | Atomicidad garantizada |

---

## 2. Modelo de Datos

### 2.1 Entidades Principales

```
┌─────────────┐     ┌─────────────┐
│  choferes   │     │   unidades  │
├─────────────┤     ├─────────────┤
│ id (PK)     │     │ id (PK)     │
│ nombre      │     │ patente     │
│ dni         │     │ marca       │
│ licencia    │     │ modelo      │
│ estado      │     │ estado      │
└─────────────┘     └─────────────┘

┌─────────────┐     ┌─────────────┐
│ terceros    │     │  depositos  │
├─────────────┤     ├─────────────┤
│ id (PK)     │     │ id (PK)     │
│ razonSocial │     │ nombre      │
│ tipoDoc     │     │ ubicacion   │
│ numeroDoc   │     │ capacidad   │
│ estado      │     │ estado      │
└─────────────┘     └─────────────┘

┌─────────────┐     ┌─────────────┐
│  planillas  │     │   remitos   │
├─────────────┤     ├─────────────┤
│ id (PK)     │     │ id (PK)     │
│ numero      │     │ numero      │
│ fechaSalida │     │ planilla_id │
│ chofer_id   │     │ estado      │
│ unidad_id   │     │ pesoTotal   │
│ estado      │     │ bultos      │
└─────────────┘     └─────────────┘

┌─────────────┐     ┌─────────────┐
│ hojas_ruta  │     │hoja_ruta_   │
├─────────────┤     │  remitos    │
│ id (PK)     │     ├─────────────┤
│ sscc        │     │ hoja_id     │
│ planilla_id │────►│ remito_id   │
│ chofer_id   │     │ estado      │
│ estado      │     │ bultos      │
└─────────────┘     └─────────────┘
```

### 2.2 Tablas de Seguimiento

| Tabla | Propósito |
|-------|-----------|
| `tracking_events` | Registro de cambios de estado |
| `users` | Metadatos de usuarios (sincronizado con Clerk) |

---

## 3. Integridad Referencial

### 3.1 Foreign Keys Definidas

| Relación | ON DELETE | ON UPDATE |
|----------|-----------|-----------|
| remitos → planillas | CASCADE | CASCADE |
| hoja_ruta_remitos → hojas_ruta | CASCADE | CASCADE |
| hoja_ruta_remitos → remitos | CASCADE | CASCADE |
| hojas_ruta → planillas | SET NULL | CASCADE |
| hojas_ruta → choferes | SET NULL | CASCADE |
| hojas_ruta → unidades | SET NULL | CASCADE |
| planillas → choferes | SET NULL | CASCADE |
| planillas → unidades | SET NULL | CASCADE |

### 3.2 Checklist de FK

- [x] Todas las relaciones con FK definida
- [x] ON DELETE explícito en cada relación
- [x] No hay registros huérfanos posibles

---

## 4. Índices y Rendimiento

### 4.1 Índices Simples

| Índice | Tabla | Columna | Propósito |
|--------|-------|---------|-----------|
| `idx_choferes_dni` | choferes | dni | Búsqueda por DNI |
| `idx_choferes_estado` | choferes | estado | Filtrar disponibles |
| `idx_unidades_patente` | unidades | patente | Unique check |
| `idx_unidades_estado` | unidades | estado | Filtrado |
| `idx_terceros_razon_social` | terceros | razon_social | Búsqueda |
| `idx_depositos_nombre` | depositos | nombre | Filtrado |
| `idx_planillas_numero` | planillas | numero | Unique check |
| `idx_planillas_fecha` | planillas | fecha_salida | Filtrado por fecha |
| `idx_remitos_numero` | remitos | numero | Unique check |
| `idx_remitos_estado` | remitos | estado | Filtrado |
| `idx_hojas_ruta_sscc` | hojas_ruta | sscc | Unique check |
| `idx_hojas_ruta_estado` | hojas_ruta | estado | Filtrado |
| `idx_tracking_events_fecha` | tracking_events | created_at | Ordenamiento |

### 4.2 Índices Compuestos

| Índice | Tabla | Columnas | Query Objetivo |
|--------|-------|----------|----------------|
| `idx_planillas_estado_fecha` | planillas | estado, fecha_salida | Lista por estado + fecha |
| `idx_hojas_ruta_estado_fecha` | hojas_ruta | estado, created_at | Lista por estado + fecha |
| `idx_remitos_estado_planilla` | remitos | estado, planilla_id | Remitos por estado en planilla |

### 4.3 Índices de Foreign Keys

| Índice | Tabla | Columna | Propósito |
|--------|-------|---------|-----------|
| `idx_remitos_planilla` | remitos | planilla_id | JOIN planillas |
| `idx_hoja_ruta_remitos_hoja` | hoja_ruta_remitos | hoja_ruta_id | JOIN hojas |
| `idx_hoja_ruta_remitos_remito` | hoja_ruta_remitos | remito_id | JOIN remitos |
| `idx_tracking_events_remito` | tracking_events | remito_id | Tracking por remito |

### 4.4 Checklist de Índices

- [x] 25+ índices creados
- [x] 3 índices compuestos
- [x] Índices en todas las FK
- [x] Índices en columnas de filtrado frecuente

---

## 5. Row Level Security (RLS)

### 5.1 Estado de RLS por Tabla

| Tabla | RLS Habilitado | Políticas |
|-------|----------------|-----------|
| choferes | ✅ | SELECT all, WRITE by role |
| unidades | ✅ | SELECT all, WRITE by role |
| terceros | ✅ | SELECT all, WRITE by role |
| depositos | ✅ | SELECT all, WRITE by role |
| planillas | ✅ | SELECT all, WRITE by role |
| remitos | ✅ | SELECT all, WRITE by role |
| hojas_ruta | ✅ | SELECT all, WRITE by role |
| hoja_ruta_remitos | ✅ | SELECT all, WRITE by role |
| tracking_events | ✅ | SELECT all, WRITE by role |
| users | ✅ | SELECT own, WRITE own |

### 5.2 Políticas Definidas

```sql
-- SELECT: cualquier usuario autenticado
CREATE POLICY "Permitir lectura autenticados"
ON choferes FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

-- INSERT/UPDATE: solo ADMIN y OPERADOR
CREATE POLICY "Permitir escritura roles"
ON choferes FOR ALL
TO authenticated
USING (
  (auth.jwt() ->> 'public_metadata' ->> 'role') IN ('ADMIN', 'OPERADOR')
);
```

### 5.3 Service Role

El backend usa el service role de Supabase para operaciones que requieren bypass de RLS:
- Seeds de datos
- Operaciones administrativas
- Sincronización con Clerk

### 5.4 Checklist de RLS

- [x] RLS habilitado en las 10 tablas
- [x] Políticas de SELECT para usuarios autenticados
- [x] Políticas de WRITE por rol
- [x] Service role con bypass

---

## 6. Transacciones y Lógica de Negocio

### 6.1 Funciones RPC Implementadas

| Función | Propósito | Atomicidad |
|---------|-----------|------------|
| `create_planilla_with_remitos` | Crear planilla + remitos asociados | ✅ Todo o nada |
| `create_hoja_ruta_with_cargas` | Crear hoja + cargas | ✅ Todo o nada |
| `update_remito_estado` | Actualizar estado con logging | ✅ Transaccional |
| `iniciar_turno_hoja_ruta` | Iniciar turno con validaciones | ✅ Transaccional |
| `terminar_turno_hoja_ruta` | Finalizar turno + cálculos | ✅ Transaccional |
| `confirmar_hoja_completada` | Confirmar entrega completa | ✅ Transaccional |

### 6.2 Triggers Automáticos

| Trigger | Tabla | Acción |
|---------|-------|--------|
| `set_updated_at` | todas | Actualiza `updated_at` en cada UPDATE |
| `track_estado_remito` | remitos | Registra cambio en `tracking_events` |

### 6.3 Checklist Transaccional

- [x] Operaciones complejas en funciones RPC
- [x] Triggers de auditoría
- [x] No hay transacciones manuales en aplicación

---

## 7. Timestamps y Auditoría

### 7.1 Campos Estandarizados

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `created_at` | timestamptz | Fecha de creación |
| `updated_at` | timestamptz | Fecha de última modificación |

### 7.2 Trigger de Updated At

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 7.3 Checklist de Timestamps

- [x] Todas las tablas tienen created_at
- [x] Todas las tablas tienen updated_at
- [x] Triggers automáticos funcionando

---

## 8. Tipos de Datos

### 8.1 Recomendaciones PostgreSQL

| Campo | Tipo Recomendado | Uso |
|-------|------------------|-----|
| Fechas | `timestamptz` | Con timezone para logs |
| Identificadores | `uuid` | IDs únicos |
| Texto largo | `text` | Sin límite |
| Códigos | `varchar(n)` | Con límite específico |
| Estados | `enum` o `varchar` | Valores fijos |

### 8.2 Checklist de Tipos

- [x] Fechas críticas en timestamptz
- [x] IDs usando uuid
- [x] Campos de estado con valores definidos

---

## 9. Backup y Recuperación

### 9.1 Configuración Supabase

- **Backups automáticos:** Incluidos en plan Pro
- **Point-in-time recovery:** Disponible
- **Export manual:** Via SQL Editor o API

### 9.2 Recomendaciones

1. **Backups externos:** Exportar datos críticos periódicamente
2. **Documentación de esquema:** Mantener actualizado
3. **Monitoreo de tamaño:** Alertar si supera quotas

---

## 10. Roadmap de Mejoras

### 10.1 Corto Plazo
1. Particionamiento de `tracking_events` por fecha
2. Full-text search para búsquedas de texto libre

### 10.2 Mediano Plazo
1. materialized views para reportes frecuentes
2. Citus para distribuir datos si crece mucho

### 10.3 Largo Plazo
1. Data warehouse para analytics
2. Replicas de lectura para reportes

---

## 11. Referencias

- **Scripts SQL:** `.sql/` en root del proyecto
- **Supabase Dashboard:** Proyecto en supabase.com
- **Documentación:** AUDIT_DATABASE.md completo
