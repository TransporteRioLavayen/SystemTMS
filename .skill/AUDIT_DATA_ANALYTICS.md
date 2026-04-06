# Auditoría Técnica: Data Analytics

> **Proyecto:** TransporteRioLavayen TMS  
> **Área:** Analytics / Business Intelligence  
> **Estado:** 🟢 FUNCIONAL - Dashboard con KPIs implementado  
> **Auditor:** Senior Architect  
> **Fecha:** 2026-04-06

---

## 1. Resumen Ejecutivo

El módulo de analytics de TransporteRioLavayen proporciona visibilidad en tiempo real sobre las operaciones logísticas a través de un dashboard interactivo. El sistema ofrece KPIs clave, visualizaciones de tendencias, y capacidad de exportación de reportes para la toma de decisiones operativas.

### Stack de Analytics

| Componente | Tecnología | Versión |
|------------|------------|---------|
| Visualización | Recharts | 3.x |
| PDF Export | jsPDF + jspdf-autotable | latest |
| Time Range | Custom hook | - |
| Grids | Custom DataTable | - |

---

## 2. Dashboard de KPIs

### 2.1 Métricas Principales

| KPI | Descripción | Fórmula |
|-----|-------------|---------|
| **Remitos Hoy** | Entregas programadas para el día | `COUNT(remitos WHERE fecha = hoy)` |
| **En Ruta** | Hojas de ruta actualmente activas | `COUNT(hojas_ruta WHERE estado = 'EN_RUTA')` |
| **Entregados (Mes)** | Entregas exitosas del mes | `COUNT(remitos WHERE estado = 'ENTREGADO' AND mes)` |
| **Tasa de Éxito** | Porcentaje de entregas exitosas | `ENTREGADOS / TOTAL * 100` |

### 2.2 Visualización

```
┌─────────────────────────────────────────────┐
│  📊 DASHBOARD ANALYTICS                     │
├─────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────┐ │
│  │ HOY     │ │ EN RUTA │ │ MES    │ │ %   │ │
│  │ 45      │ │ 12      │ │ 892    │ │95%  │ │
│  │ remitos │ │ hojas   │ │ entr.  │ │éxito│ │
│  └─────────┘ └─────────┘ └─────────┘ └─────┘ │
├─────────────────────────────────────────────┤
│  ┌───────────────────┐ ┌───────────────────┐ │
│  │   EVOLUCIÓN       │ │  DISTRIBUCIÓN     │ │
│  │   (Area Chart)    │ │   (Pie Chart)     │ │
│  └───────────────────┘ └───────────────────┘ │
└─────────────────────────────────────────────┘
```

### 2.3 Componentes de Dashboard

- **KPICard:** Métrica individual con trend
- **AreaChart:** Evolución temporal (30 días)
- **PieChart:** Distribución por estado
- **DataTable:** Tabla de registros

---

## 3. Gráficos y Visualizaciones

### 3.1 Área Chart (Evolución)

```typescript
<AreaChart data={data}>
  <XAxis dataKey="fecha" />
  <YAxis />
  <Tooltip />
  <Area 
    type="monotone" 
    dataKey="total" 
    stroke="#3b82f6" 
    fill="#3b82f6" 
    fillOpacity={0.3} 
  />
</AreaChart>
```

### 3.2 Pie Chart (Distribución)

```typescript
<PieChart>
  <Pie
    data={data}
    dataKey="count"
    nameKey="estado"
    cx="50%"
    cy="50%"
    outerRadius={80}
  >
    {data.map((entry, index) => (
      <Cell key={index} fill={COLORS[index]} />
    ))}
  </Pie>
  <Tooltip />
  <Legend />
</PieChart>
```

### 3.3 Colores por Estado

| Estado | Color | Hex |
|--------|-------|-----|
| ENTREGADO | Verde | #22c55e |
| EN_RUTA | Azul | #3b82f6 |
| PENDIENTE | Amarillo | #eab308 |
| RECHAZADO | Rojo | #ef4444 |
| CANCELADO | Gris | #6b7280 |

---

## 4. Filtros y Rangos de Tiempo

### 4.1 Selector de Rango

```typescript
const timeRanges = [
  { label: 'Hoy', value: 'today' },
  { label: 'Últimos 7 días', value: '7d' },
  { label: 'Últimos 30 días', value: '30d' },
  { label: 'Este mes', value: 'month' },
  { label: 'Personalizado', value: 'custom' },
];
```

### 4.2 Filtros Adicionales

| Filtro | Tipo | Opciones |
|--------|------|----------|
| Chofer | Select | Lista de choferes |
| Unidad | Select | Lista de unidades |
| Estado | Multi-select | Estados disponibles |
| Fecha | Date range | Desde/hasta |

### 4.3 Persistencia

- Filtros guardados en URL params
- Permiten compartir views
- History de filtros recientes

---

## 5. Exportación de Reportes

### 5.1 PDF Export

```typescript
const generateReport = async () => {
  const doc = new jsPDF();
  
  doc.autoTable({
    head: [['Fecha', 'Chofer', 'Unidad', 'Remitos', 'Estado']],
    body: data.map(row => [
      row.fecha,
      row.chofer,
      row.unidad,
      row.remitos,
      row.estado
    ]),
  });
  
  doc.save('reporte-operativo.pdf');
};
```

### 5.2 Contenido del Reporte

| Sección | Contenido |
|---------|-----------|
| Header | Logo, fecha, título |
| KPIs | Métricas principales |
| Detalle | Tabla con filtros aplicados |
| Footer | Página, fecha de generación |

---

## 6. Alertas de Mantenimiento

### 6.1 Alertas Automáticas

| Tipo | Condición | Notificación |
|------|-----------|--------------|
| Licencia próxima | Vence en 30 días | Warning toast |
| VTV próxima | Vence en 30 días | Warning toast |
| Seguro próximo | Vence en 30 días | Warning toast |
| Mantenimiento overdue | Fecha pasada | Error toast |

### 6.2 Visualización

```
⚠️ ALERTAS DE MANTENIMIENTO
├── Licencia: Juan Pérez - Vence en 15 días
├── VTV: ABC-123 (Scania) - Vence en 7 días
└── Seguro: XYZ-987 (Ford) - Vence en 3 días
```

---

## 7. Utilización de Flota

### 7.1 Vista por Tipo de Servicio

| Tipo | Descripción | Métrica |
|------|-------------|---------|
| LARGA_DISTANCIA | Rutas interurbanas | km, horas |
| CORTA_DISTANCIA | Rutas urbanas | entregas |

### 7.2 Visualización

```
┌─────────────────────────────────────┐
│  UTILIZACIÓN DE FLOTA               │
├─────────────────────────────────────┤
│  Larga Distancia: ████████░░ 80%   │
│  Corta Distancia: ██████░░░░ 60%   │
└─────────────────────────────────────┘
```

---

## 8. API de Analytics

### 8.1 Endpoints

| Endpoint | Descripción |
|----------|-------------|
| `GET /api/analytics/dashboard` | KPIs principales |
| `GET /api/analytics/remitos` | Métricas de remitos |
| `GET /api/analytics/flota` | Utilización de flota |
| `GET /api/analytics/tendencias` | Datos para gráficos |
| `GET /api/analytics/alertas` | Alertas de mantenimiento |

### 8.2 Respuesta de Dashboard

```json
{
  "remitos_hoy": 45,
  "en_ruta": 12,
  "entregados_mes": 892,
  "tasa_exito": 95.2,
  "alertas": [
    { "tipo": "licencia", "chofer": "Juan Pérez", "dias": 15 }
  ]
}
```

---

## 9. Rendimiento

### 9.1 Optimizaciones

- **Caching:** Datos cacheados por 5 minutos
- **Pagination:** Tablas con paginación
- **Lazy loading:** Grcharts cargan on-demand
- **Server-side aggregation:** Queries agregadas en DB

### 9.2 Métricas

| Métrica | Valor | Objetivo |
|---------|-------|----------|
| Load time dashboard | <2s | <1.5s |
| Render charts | <500ms | <300ms |
| Export PDF | <3s | <2s |

---

## 10. Roadmap de Mejoras

### 10.1 Corto Plazo
1. Más gráficos interactivos
2. Dashboards por usuario
3. Comparativas período a período

### 10.2 Mediano Plazo
1. Export a Excel
2. Scheduled reports por email
3. Drill-down en gráficos

### 10.3 Largo Plazo
1. ML para predicciones
2. Data warehouse dedicado
3. BI advanced (Metabase)

---

## 11. Referencias

- **Dashboard:** `frontend/src/presentation/pages/AnalyticsDashboard.tsx`
- **API routes:** `backend/src/presentation/routes/analytics.routes.ts`
- **Recharts:** https://recharts.org/
- **jsPDF:** https://parall.ax/jspdf
