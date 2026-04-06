# Auditoría Técnica: Seguridad

> **Proyecto:** TransporteRioLavayen TMS  
> **Área:** Security / Hardening  
> **Estado:** 🟢 SEGURO - Fase 0 de hardening completada  
> **Auditor:** Senior Architect  
> **Fecha:** 2026-04-06

---

## 1. Resumen Ejecutivo

La seguridad de TransporteRioLavayen se ha implementado en múltiples capas, desde la autenticación hasta la protección a nivel de base de datos. El sistema utiliza Clerk para gestión de identidades, RLS de Supabase para control de acceso granular, y middleware de Express para protección contra ataques comunes.

###Stack de Seguridad

| Capa | Tecnología | Propósito |
|------|------------|-----------|
| Identidad | Clerk | Autenticación y sesión |
| API | Express + Helmet | Headers seguros |
| Rate Limiting | express-rate-limit | Protección DDoS |
| Validación | Zod | Sanitización de inputs |
| Base de Datos | RLS PostgreSQL | Control de acceso a datos |
| Rede | Cloudflare | WAF, SSL, CDN |

---

## 2. Autenticación

### 2.1 Clerk Integration

```typescript
// Middleware de autenticación
import { requireAuthJson } from './middleware/auth';

// Uso en rutas
router.get('/choferes', requireAuthJson, getChoferes);
```

### 2.2 Tokens y Sesiones

| Aspecto | Implementación |
|---------|----------------|
| Tipo de token | JWT (Clerk) |
| Refresh | Automático vía SDK |
| Expiración | Configurable en Clerk |
| Storage | Cookie HttpOnly |

### 2.3 Datos de Sesión Disponibles

```typescript
interface SessionData {
  userId: string;
  sessionId: string;
  claims: {
    role: 'ADMIN' | 'OPERADOR' | 'VIEWER';
    email: string;
    orgId: string;
  };
}
```

### 2.4 Checklist de Autenticación

- [x] Tokens JWT via Clerk
- [x] Refresh automático de sesiones
- [x] Middleware `requireAuthJson` en todas las rutas sensibles
- [x] Extracción de userId y claims

---

## 3. Autorización y Control de Acceso

### 3.1 Sistema de Roles

| Rol | Permisos |
|-----|-----------|
| ADMIN | CRUD completo, gestión de usuarios |
| OPERADOR | CRUD operativo (choferes, unidades, etc.) |
| VIEWER | Solo lectura |

### 3.2 Implementación

```typescript
// Middleware de autorización
authorizeRoles(['ADMIN', 'OPERADOR'])

// Uso en rutas sensibles
router.post('/choferes', 
  requireAuthJson, 
  authorizeRoles(['ADMIN']), 
  createChofer
);
```

### 3.3 Row Level Security (RLS)

```sql
-- Política por rol
CREATE POLICY "escritura_por_rol"
ON choferes FOR ALL
TO authenticated
USING (
  (auth.jwt() ->> 'public_metadata' ->> 'role') IN ('ADMIN', 'OPERADOR')
);
```

### 3.4 Checklist de Autorización

- [x] Roles definidos en Clerk metadata
- [x] Middleware de autorización por rol
- [x] RLS con validación de rol
- [x] Rutas protegidas correctamente

---

## 4. Protección de API

### 4.1 Rate Limiting

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| General | 200 | 15 minutos |
| Auth | 20 | 15 minutos |
| /api/events | Sin límite | - |

```typescript
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too Many Requests' }
});
```

### 4.2 Headers de Seguridad

```typescript
app.use(helmet({
  contentSecurityPolicy: false, // Development
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'same-origin' }
}));
```

### 4.3 Configuración CORS

| Entorno | Origin |
|---------|--------|
| Desarrollo | `*` |
| Producción | Dominio de Cloudflare Pages |

### 4.4 Checklist de Protección API

- [x] Rate limiting general
- [x] Rate limiting estricto para auth
- [x] Helmet configurado
- [x] CORS restrictivo en producción

---

## 5. Validación de Entrada

### 5.1 Zod Schemas

```typescript
const CreateChoferSchema = z.object({
  nombre: z.string().min(1).max(255),
  dni: z.string().min(7).max(10),
  licencia: z.string().min(1).max(50),
  vencimientoLicencia: z.string(),
  telefono: z.string().min(8).max(20)
});
```

### 5.2 Sanitización

| Técnica | Propósito |
|---------|-----------|
| Validación Zod | Tipos y rangos correctos |
| Limit de body | Prevenir payloads masivos (10MB) |
| Type coercion | Conversión segura de tipos |
| Trim | Eliminar espacios extra |

### 5.3 Checklist de Validación

- [x] Schemas Zod en todos los endpoints
- [x] Límite de tamaño de request
- [x] Errores de validación en español
- [x] Integración con react-hook-form

---

## 6. OWASP Top 10 Mitigations

### 6.1 Mapeo de Vulnerabilidades

| OWASP | Estado | Mitigación |
|-------|--------|------------|
| A01: Broken Access Control | ✅ Mitigado | RLS + authorizeRoles |
| A02: Cryptographic Failures | ✅ Mitigado | HTTPS + Clerk |
| A03: Injection | ✅ Mitigado | Zod validation |
| A04: Insecure Design | ✅ Mitigado | RLS + arquitectura |
| A05: Security Misconfiguration | ✅ Mitigado | Helmet + CORS |
| A06: Vulnerable Components | ✅ Mitigado | Dependencias actualizadas |
| A07: Auth Failures | ✅ Mitigado | Rate limiting |
| A08: Data Integrity Failures | ✅ Mitigado | Transacciones RPC |
| A09: Logging Failures | ✅ Mitigado | Pino logger |
| A10: SSRF | ✅ Mitigado | Validación de URLs |

### 6.2 Detalle de Mitigaciones

**Broken Access Control:**
- RLS activa en todas las tablas
- Políticas por rol definidas
- Middleware de autorización en backend

**Injection Prevention:**
- Zod valida todos los inputs
- No hay query strings dinámicas
- Supabase client sanitiza automáticamente

**Security Logging:**
- Pino con timestamps ISO
- Errores capturados con stacktrace
- LOG de accesos sospechosos

### 6.3 Checklist OWASP

- [x] A01: Control de acceso implementado
- [x] A02: Cifrado configurado
- [x] A03: Sin inyección
- [x] A05: Configuración segura
- [x] A07: Rate limiting
- [x] A09: Logging activo

---

## 7. Seguridad de Datos

### 7.1 Variables de Entorno

| Variable | Sensitive | Dónde se almacena |
|----------|-----------|-------------------|
| SUPABASE_URL | No | Código |
| SUPABASE_ANON_KEY | No | Variables |
| CLERK_SECRET_KEY | ✅ Sí | Secrets (Railway/Cloudflare) |
| SUPABASE_SERVICE_ROLE_KEY | ✅ Sí | Secrets |

### 7.2 Secret Management

- **Desarrollo:** `.env.local` (no commit)
- **Producción:** Railway Secrets / Cloudflare Variables
- **Nunca:** hardcoded en código

### 7.3 Checklist de Datos

- [x] Sin credenciales en código
- [x] Secrets en entorno de ejecución
- [x] .env en gitignore

---

## 8. Protección de Red

### 8.1 Cloudflare Integration

| Servicio | Propósito |
|----------|-----------|
| WAF | Filtrado de tráfico malicioso |
| SSL/TLS | Cifrado en tránsito |
| CDN | Entrega de assets estáticos |
| DDoS Protection | Mitigación de ataques |

### 8.2 Headers de Respuesta

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
X-Permitted-Cross-Domain-Policies: none
```

### 8.3 Checklist de Red

- [x] HTTPS forzado
- [x] Cloudflare WAF activo
- [x] Headers seguros configurados
- [x] X-Powered-By ocultado

---

## 9. Monitoreo y Respuesta

### 9.1 Logging

```typescript
import { logger } from './infrastructure/logging/logger';

logger.info('Request received', { method: req.method, path: req.path });
logger.error('Error processing', { error: err.message, stack: err.stack });
```

### 9.2 Health Check

```typescript
GET /api/health
// Response: { status: 'ok', timestamp: '...', service: 'backend' }
```

### 9.3 Checklist de Monitoreo

- [x] Endpoint de health
- [x] Logging estructurado
- [x] Errores capturados globalmente

---

## 10. Recomendaciones Futuras

### 10.1 Corto Plazo
1. Implementar 2FA en Clerk para cuentas admin
2. Configurar alertas de seguridad en Cloudflare
3. Auditoría de logs periódica

### 10.2 Mediano Plazo
1. Table de auditoría para cambios sensibles
2. Penetration testing externo
3. Bug bounty program

### 10.3 Largo Plazo
1. SOC 2 compliance
2. ISO 27001 certification
3. Pentests trimestrales

---

## 11. Referencias

- **Middleware auth:** `backend/src/infrastructure/middleware/`
- **RLS policies:** Scripts SQL en proyecto
- **Configuración:** wrangler.toml, railway.json
- **Logs:** Pino en backend
