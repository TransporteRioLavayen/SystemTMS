# Auditoría Técnica: Arquitectura del Sistema

> **Proyecto:** TransporteRioLavayen TMS  
> **Área:** Architecture / Software Design  
> **Estado:** 🟢 SÓLIDO - Clean Architecture implementado  
> **Auditor:** Senior Architect  
> **Fecha:** 2026-04-06

---

## 1. Resumen Ejecutivo

La arquitectura de TransporteRioLavayen está basada en principios de Clean Architecture (también conocida como Arquitectura de la Cebolla), implementada de manera consistente tanto en el backend como en el frontend. Este enfoque garantiza que el sistema sea mantenible, testeable y escalable, con una separación clara de responsabilidades que facilita el desarrollo y la evolución del producto.

### Principios Aplicados

| Principio | Implementación |
|-----------|-----------------|
| **Single Responsibility** | Cada capa tiene una responsabilidad específica |
| **Dependency Inversion** | Las dependencias van hacia el dominio |
| **Interface Segregation** | Interfaces pequeñas y específicas |
| **Domain Driven** | El dominio dicta la lógica, no los frameworks |

---

## 2. Arquitectura del Backend

### 2.1 Estructura de Capas

```
backend/src/
├── domain/                    # 🔴 CORE - Sin dependencias externas
│   ├── entities/             # Entidades del negocio
│   ├── repositories/        # Interfaces de repositorios
│   └── errors/               # Errores customizados
│
├── application/              # 🟡 CASOS DE USO - Lógica de negocio
│   ├── dto/                 # Data Transfer Objects
│   ├── use-cases/           # Casos de uso concretos
│   └── interfaces/          # Interfaces de aplicación
│
├── infrastructure/           # 🟢 IMPLEMENTACIÓN - Detalles técnicos
│   ├── repositories/        # Implementaciones de repositorios
│   ├── database/             # Cliente Supabase
│   ├── auth/                # Cliente Clerk
│   └── logging/             # Configuración de Pino
│
└── presentation/            # 🔵 INTERFAZ - Rutas y controladores
    ├── routes/              # Rutas Express
    ├── controllers/        # Controladores
    └── middleware/         # Middleware (auth, validation)
```

### 2.2 Flujo de Dependencias

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO DE DEPENDENCIAS                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   presentation ──► application ──► domain ◄── infrastructure│
│                                                             │
│   ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←   │
│                                                             │
│   Las dependencias siempre apuntan hacia el dominio.      │
│   La infraestructura se "inyecta" en la aplicación.       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Beneficios Obtenidos

- **Testabilidad:** Los casos de uso pueden probarse sin base de datos real
- **Mantenibilidad:** Cambios en la infraestructura no afectan la lógica de negocio
- **Flexibilidad:** Easy migration a otros proveedores (ej. Clerk → Auth0)
- **Escalabilidad:** La estructura soporta crecimiento sin refactorización masiva

---

## 3. Arquitectura del Frontend

### 3.1 Estructura de Carpetas

```
frontend/src/
├── domain/                    # 🔴 MODELOS - Tipos y esquemas
│   ├── models/               # Tipos TypeScript
│   ├── schemas/              # Esquemas Zod
│   ├── constants/            # Constantes (estados, tipos)
│   └── labels/               # Etiquetas i18n
│
├── application/              # 🟡 LÓGICA - Contextos y hooks
│   ├── contexts/             # Contextos globales
│   ├── hooks/               # Custom hooks
│   └── use-cases/           # Lógica de negocio reutilizable
│
├── infrastructure/           # 🟢 SERVICIOS - API externa
│   ├── api/                 # Cliente Axios + interceptores
│   ├── services/            # Servicios de dominio
│   └── storage/             # LocalStorage utilities
│
└── presentation/            # 🔵 UI - Componentes y páginas
    ├── components/           # Componentes reutilizables
    ├── pages/               # Páginas completas
    ├── layouts/             # Layouts (Dashboard, etc.)
    └── hooks/               # Hooks de UI
```

### 3.2 Patrones Aplicados

| Patrón | Uso |
|--------|-----|
| **Container/Presentational** | Separación de lógica y presentación |
| **Compound Components** | Componentes extensibles (DataTable) |
| **Custom Hooks** | Lógica reutilizable (useAuth, useRealtime) |
| **Provider Pattern** | Context API para estado global |

### 3.3 Flujo de Datos en Frontend

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   UI Layer   │────▶│   Hook/      │────▶│   Service    │
│  Componentes │     │   Context    │     │   (API)      │
└──────────────┘     └──────────────┘     └──────────────┘
       ▲                                             │
       │              Response                        │
       └─────────────────────────────────────────────┘
```

---

## 4. Inyección de Dependencias

### 4.1 Backend

```typescript
// Repository interface en dominio
interface IChoferRepository {
  findById(id: string): Promise<Chofer | null>;
  create(data: CreateChoferInput): Promise<Chofer>;
}

// Implementación en infraestructura
class SupabaseChoferRepository implements IChoferRepository {
  // ...
}

// Inyección en el constructor del use case
class CreateChoferUseCase {
  constructor(private repository: IChoferRepository) {}
  
  async execute(data: CreateChoferDTO): Promise<Chofer> {
    return this.repository.create(data);
  }
}
```

### 4.2 Frontend

```typescript
// Context como provider
const PlanillasProvider = ({ children }) => {
  const [planillas, setPlanillas] = useState([]);
  
  const value = {
    planillas,
    createPlanilla: (data) => api.post('/planillas', data),
  };
  
  return (
    <PlanillasContext.Provider value={value}>
      {children}
    </PlanillasContext.Provider>
  );
};
```

---

## 5. Comunicación en Tiempo Real

### 5.1 Server-Sent Events (SSE)

El sistema utiliza SSE para actualizaciones en tiempo real:

```typescript
// RealtimeContext usa una única conexión SSE
const eventSource = new EventSource(`${API_URL}/api/events`);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Actualizar estados globalmente
};
```

### 5.2 Beneficios de SSE

| Aspecto | Beneficio |
|---------|-----------|
| Conexión única | Un solo socket para todo el sistema |
| Reconexión auto | Manejado por el navegador |
| Firewall-friendly | Usa HTTP estándar |
| Bidireccional | No necesario, el servidor push es suficiente |

---

## 6. Gestión de Estado

### 6.1 Estados Identificados

| Tipo de Estado | Solución | Ejemplo |
|----------------|----------|---------|
| Global | Context API | AuthContext, PlanillasContext |
| Local | useState | Estados de componentes |
| Server | Fetch manual | Datos de API |
| URL | React Router | Filtros en URL |

### 6.2 Consideraciones de Arquitectura

**Decisión:** No usar Redux o TanStack Query todavía.

**Razón:** La complejidad actual no lo justifica. Los contextos y el fetch manual son suficientes y más simples de mantener.

**Futuro:** Si el sistema crece, migrar a TanStack Query para manejo de caché y deduplicación de requests.

---

## 7. Checklist de Arquitectura

### 7.1 Principios

- [x] El dominio no tiene dependencias externas
- [x] La lógica de negocio está en use cases
- [x] Las interfaces desacoplan la infraestructura
- [x] Las dependencias fluyen hacia el dominio

### 7.2 Frontend

- [x] Flujo de datos predecible (Context/Hooks)
- [x] Componentes reutilizables
- [x] Sin "prop drilling" excesivo
- [x]分离 de lógica y presentación

### 7.3 Backend

- [x] Sin "fat controllers"
- [x] Lógica en repositories o use cases
- [x] Transacciones en la base de datos (RPC)
- [x] Manejo de errores centralizado

---

## 8. Conclusiones Técnicas

### 8.1 Fortalezas

1. **Separación clara de responsabilidades** - Cada capa sabe su trabajo
2. **Alta testabilidad** - Los casos de uso se prueban sin基础设施
3. **Mantenibilidad** - Cambios localizados sin efecto dominó
4. **Escalabilidad** - La estructura soporta crecimiento

### 8.2 Recomendaciones

| Área | Recomendación | Prioridad |
|------|---------------|-----------|
| Frontend | Evaluar TanStack Query si cresce | Media |
| Testing | Añadir unit tests en use cases | Alta |
| Docs | Documentar decisiones arquitectónicas | Media |

---

## 9. Referencias

- **Backend structure:** `backend/src/`
- **Frontend structure:** `frontend/src/`
- **Use cases:** `backend/src/application/use-cases/`
- **Repositories:** `backend/src/infrastructure/repositories/`
- **Contexts:** `frontend/src/application/contexts/`
