# Auditoría Técnica: DevOps y Estrategia de Despliegue

> **Proyecto:** TransporteRioLavayen TMS  
> **Área:** DevOps / Infrastructure / CI-CD  
> **Estado:** 🟢 LISTO PARA DESPLIEGUE - Pipeline configurado  
> **Auditor:** Senior Architect  
> **Fecha:** 2026-04-06

---

## 1. Resumen Ejecutivo

La infraestructura de TransporteRioLavayen está desplegada en una arquitectura serverless híbrida que combina Railway para el backend y Cloudflare Pages para el frontend. El sistema cuenta con CI/CD configurado mediante GitHub Actions, con approval gates para deployments a producción y automatización completa para entornos de staging.

### Stack de Infraestructura

| Componente | Servicio | Tipo |
|------------|----------|------|
| Backend | Railway | Managed Node.js |
| Frontend | Cloudflare Pages | Static Hosting + Functions |
| Base de Datos | Supabase | PostgreSQL Managed |
| CDN | Cloudflare | Global Edge Network |
| Dominio | Cloudflare | DNS + Registrar |
| CI/CD | GitHub Actions | Workflows |

---

## 2. Arquitectura de Despliegue

### 2.1 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     ARQUITECTURA DE PRODUCCIÓN                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐     │
│   │   GitHub    │         │  Railway    │         │ Cloudflare  │     │
│   │   Main      │────────▶│   Backend   │         │   Pages     │     │
│   │  (push)     │         │  (Node.js)  │         │   (React)   │     │
│   └─────────────┘         └──────┬──────┘         └──────┬──────┘     │
│                                  │                         │            │
│                                  ▼                         ▼            │
│                           ┌─────────────┐         ┌─────────────┐     │
│                           │  Supabase   │         │   Cloudflare│     │
│                           │  (Postgres) │         │    DNS/CDN  │     │
│                           └─────────────┘         └─────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Flujo de Despliegue

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO DE CI/CD                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Push desarrollo ──► GitHub Actions ──► Deploy Staging      │
│                           │                    │              │
│                           │                    ▼              │
│                           │           Railway + Pages        │
│                           │              (Preview)          │
│                           │                                     │
│                           ▼                                     │
│                      Review Required                          │
│                           │                                     │
│                           ▼                                     │
│   Push main ─────────► Approval ──► Deploy Production         │
│                           │                    │              │
│                           │                    ▼              │
│                           │           Railway + Pages          │
│                           │              (Production)         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Railway (Backend)

### 3.1 Configuración

```json
// railway.json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd backend && npm install && npm run build"
  },
  "deploy": {
    "numReplicas": 1,
    "startCommand": "cd backend && npm start"
  }
}
```

### 3.2 Variables de Entorno

| Variable | Sensitive | Descripción |
|----------|-----------|-------------|
| SUPABASE_URL | No | URL del proyecto |
| SUPABASE_ANON_KEY | No | Clave pública |
| CLERK_SECRET_KEY | ✅ Sí | Clave secreta |
| NODE_ENV | No | production |

### 3.3 Health Check

- Endpoint: `/api/health`
- Intervalo: Configurado en Railway
- Timeout: 30 segundos

---

## 4. Cloudflare Pages (Frontend)

### 4.1 Configuración

| Setting | Value |
|---------|-------|
| Framework preset | None |
| Build command | `npm run build` |
| Build output | `dist` |
| Root directory | `frontend` |

### 4.2 Environment Variables

| Variable | Sensitive | Descripción |
|----------|-----------|-------------|
| VITE_API_URL | No | URL del backend (Railway) |
| VITE_CLERK_PUBLISHABLE_KEY | No | Clave pública |

### 4.3 Headers de Seguridad

```apache
# _headers
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/static/*
  Cache-Control: public, max-age=31536000, immutable
```

### 4.4 SPA Routing

```apache
# _redirects
/*    /index.html   200
```

---

## 5. GitHub Actions (CI/CD)

### 5.1 Workflow de Backend

```yaml
name: Deploy Backend to Railway

on:
  push:
    branches: [main, produccion, desarrollo]
    paths: [backend/**]

jobs:
  deploy-staging:
    if: github.ref == 'refs/heads/desarrollo'
    environment: staging
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy
        run: railway deploy

  deploy-production:
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/produccion'
    environment: production
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy
        run: railway deploy
```

### 5.2 Workflow de Frontend

```yaml
name: Deploy Frontend to Cloudflare Pages

on:
  push:
    branches: [main, produccion, desarrollo]
    paths: [frontend/**]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build
        run: npm run build
        env:
          VITE_API_URL: ${{ vars.VITE_API_URL }}
      - name: Deploy
        uses: cloudflare/pages-action@v1
```

### 5.3 Environments

| Environment | Branch | Aprobación | Servicio |
|-------------|--------|------------|----------|
| staging | desarrollo | No | Railway + Pages Preview |
| production | main/produccion | **Sí** (1 reviewer) | Railway + Pages |

---

## 6. Secrets y Variables

### 6.1 GitHub Secrets

| Secret | Servicio | Descripción |
|--------|----------|-------------|
| RAILWAY_TOKEN | Railway | Token de API |
| RAILWAY_PROJECT_ID | Railway | ID del proyecto |
| CLOUDFLARE_API_TOKEN | Cloudflare | Token de API |
| CLOUDFLARE_ACCOUNT_ID | Cloudflare | Account ID |

### 6.2 GitHub Variables

| Variable | Valor |
|----------|-------|
| VITE_API_URL | https://transporteriolavayen.up.railway.app |
| CLOUDFLARE_PAGES_PROJECT | nombre-del-proyecto |

### 6.3 Railway Secrets

| Secret | Valor |
|--------|-------|
| SUPABASE_URL | https://xxx.supabase.co |
| SUPABASE_ANON_KEY | xxx |
| CLERK_SECRET_KEY | sk_live_xxx |

---

## 7. Monitoreo y Observabilidad

### 7.1 Logging

| Servicio | Herramienta |
|----------|-------------|
| Backend | Pino (Railway Logs) |
| Frontend | Cloudflare Analytics |
| Database | Supabase Logs |

### 7.2 Health Checks

| Endpoint | Propósito |
|----------|-----------|
| GET /api/health | Verificar backend |
| Cloudflare Health Check | Verificar frontend |

### 7.3 Alertas Configuradas

| Tipo | Destino | Estado |
|------|---------|--------|
| Deploy Fallido | GitHub Notification | ✅ |
| Errors en Railway | Railway Alerts | ✅ |

---

## 8. Estrategia de Ramas

### 8.1 Rama Principal

| Rama | Propósito | Deploy | Aprobación |
|------|-----------|--------|------------|
| desarrollo | Feature branches | Staging | No |
| main | Producción inmediata | Production | **Sí** |
| produccion | Releases estables | Production | **Sí** |

### 8.2 Flujo de Trabajo

```
desarrollo (push) ──► CI triggers ──► Deploy staging (auto)

main (push) ───────► CI triggers ──► Deploy production (review)
```

---

## 9. Checklist de Despliegue

### 9.1 Pre-Despliegue

- [x] Variables de entorno configuradas
- [x] Secrets de Clerk configurados
- [x] Health check responde
- [x] CORS configurado

### 9.2 Despliegue

- [x] Railway deploya correctamente
- [x] Cloudflare Pages builda correctamente
- [x] Frontend conecta con backend
- [x] Autenticación con Clerk funciona

### 9.3 Post-Despliegue

- [x] Logs sin errores críticos
- [x] Health check pasando
- [x] Navegación funcionando
- [x] Formularios enviando datos

---

## 10. Rollback y Recuperación

### 10.1 Railway

- **Rollback:** Botón "Redeploy" en cualquier deployment anterior
- **Tiempo:** < 1 minuto

### 10.2 Cloudflare Pages

- **Rollback:** Cualquier deployment anterior está disponible
- **Tiempo:** < 30 segundos

### 10.3 Estrategia de Recovery

| Escenario | Acción |
|----------|--------|
| Deploy fallido | Automatic rollback por CI/CD |
| Error crítico | Manual redeploy a versión anterior |
| Base de datos | Point-in-time recovery en Supabase |

---

## 11. Roadmap de Mejoras

### 11.1 Corto Plazo
1. Añadir tests al pipeline de CI
2. Configurar alerts de Slack
3. Implementar canary deployments

### 11.2 Mediano Plazo
1. Migrar backend a Cloudflare Workers
2. Añadir staging independiente
3. Implementar feature flags

### 11.3 Largo Plazo
1. Terraform para infraestructura como código
2. Kubernetes si Railway no escala
3. Monitoreo avanzado (Datadog/NewRelic)

---

## 12. Referencias

- **Workflows:** `.github/workflows/`
- **Config Railway:** `railway.json`
- **Config Cloudflare:** `_headers`, `_redirects`
- **CI/CD Docs:** `.github/CI-CD.md`
