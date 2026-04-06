# LogisPro Backend

API REST para el sistema de gestión logística - Transporte Río Lavayén.

## 🚀 Quick Start

### Prerrequisitos

- Node.js 18+
- npm o yarn
- Cuenta de Supabase (para base de datos)

### Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase

# 3. Generar cliente Prisma
npm run prisma:generate

# 4. Ejecutar migraciones (crear tablas)
npm run prisma:migrate

# 5. Iniciar servidor de desarrollo
npm run dev
```

El servidor estará disponible en `http://localhost:3001`

### Verificar que funciona

```bash
curl http://localhost:3001/api/health
```

## 📋 Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Iniciar servidor en modo desarrollo |
| `npm run build` | Compilar TypeScript |
| `npm run start` | Iniciar servidor production |
| `npm run test` | Ejecutar tests |
| `npm run test:watch` | Tests en modo watch |
| `npm run test:cov` | Coverage de tests |
| `npm run prisma:studio` | Abrir Prisma Studio |
| `npm run lint` | Linting de código |

## 🏗️ Estructura del Proyecto

```
backend/
├── src/
│   ├── domain/           # Entidades y reglas de negocio
│   │   ├── entities/     # Modelos del dominio
│   │   └── repositories # Interfaces de repositorio
│   │
│   ├── application/      # Casos de uso
│   │   ├── use-cases/   # Lógica de negocio
│   │   └── dto/         # Data Transfer Objects
│   │
│   ├── infrastructure/   # Implementaciones técnicas
│   │   ├── database/    # Prisma y conexiones
│   │   ├── repositories # Implementaciones de repositorio
│   │   └── auth/        # Servicios de autenticación
│   │
│   └── presentation/     # Capa de presentación
│       ├── controllers  # Controladores HTTP
│       ├── routes/      # Definición de rutas
│       └── middleware/   # Middlewares Express
│
├── tests/
│   ├── unit/            # Tests unitarios
│   └── e2e/             # Tests end-to-end
│
├── prisma/
│   └── schema.prisma    # Definición de la base de datos
│
└── package.json
```

## 🔧 Configuración de Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ir a **Settings → Database**
3. Copiar **Connection String**
4. Pegar en `DATABASE_URL` del archivo `.env`

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Coverage
npm run test:cov
```

## 📝 APIs Disponibles

Por implementar:
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `GET /api/auth/me` - Obtener usuario actual

- `GET/POST /api/depositos` - Gestión de depósitos
- `GET/POST /api/unidades` - Gestión de unidades
- `GET/POST /api/choferes` - Gestión de choferes

- `GET/POST /api/planillas` - Gestión de planillas
- `POST /api/planillas/:id/confirmar-viaje` - Confirmar viaje
- `POST /api/planillas/:id/confirmar-llegada` - Confirmar llegada

- `GET/POST /api/hojas-ruta` - Gestión de hojas de ruta
- `POST /api/hojas-ruta/:id/iniciar-turno` - Iniciar turno
- `POST /api/hojas-ruta/:id/cerrar-turno` - Cerrar turno

## 🐳 Desarrollo con Supabase

### Usar Supabase local (opcional)

```bash
# Instalar CLI de Supabase
npm install -g supabase

# Iniciar container local
supabase start

# Ver estado
supabase status
```

### Realtime con Supabase

El backend está configurado para usar Supabase Realtime cuando sea necesario.

## 📄 Licencia

MIT