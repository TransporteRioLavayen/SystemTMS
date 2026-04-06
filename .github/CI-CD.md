# CI/CD - GitHub Actions

## Estructura de Ramas

| Rama | Entorno | Deploy | Aprobación Requerida |
|------|---------|--------|---------------------|
| `desarrollo` | Staging | Automático | ❌ No |
| `main` | Production | Automático | ✅ Sí |
| `produccion` | Production | Automático | ✅ Sí |

## Workflows Configurados

### Backend → Railway
**Archivo:** `.github/workflows/backend-railway.yml`

| Rama | Trigger | Ambiente | Aprobación |
|------|---------|----------|------------|
| `desarrollo` | Push a `backend/**` | Staging | No |
| `main` | Push a `backend/**` | Production | **Sí** |
| `produccion` | Push a `backend/**` | Production | **Sí** |

### Frontend → Cloudflare Pages
**Archivo:** `.github/workflows/frontend-cloudflare.yml`

| Rama | Trigger | Ambiente | Aprobación |
|------|---------|----------|------------|
| `desarrollo` | Push a `frontend/**` | Preview | No |
| `main` | Push a `frontend/**` | Production | **Sí** |
| `produccion` | Push a `frontend/**` | Production | **Sí** |

## Flujo de Trabajo

```
┌─────────────────────────────────────────────────────────────┐
│                     PUSH A MAIN/PRODUCCION                  │
│                         (deploy)                            │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
              ┌───────────────────────┐
              │   GitHub Review       │
              │   (Approval Required) │
              └───────────────────────┘
                          ▼
              ┌───────────────────────┐
              │   Deploy Production    │
              │   (Railway + CF Pages) │
              └───────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     PUSH A DESARROLLO                       │
│                         (deploy)                            │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
              ┌───────────────────────┐
              │   Deploy Staging       │
              │   (Automático)        │
              └───────────────────────┘
```

## Cómo Configurar las Aprobaciones en GitHub

### 1. Crear Ambientes

1. Ir a **Repository Settings** → **Environments**
2. Crear **staging** environment:
   - ✅ Deploy from branch: `desarrollo`
   - ❌ Required reviewers
3. Crear **production** environment:
   - ✅ Deploy from branch: `main`, `produccion`
   - ✅ Required reviewers: 1 persona

### 2. Configurar Secrets

| Secret | Descripción | Dónde obtenerlo |
|--------|-------------|-----------------|
| `RAILWAY_TOKEN` | Token de API Railway | Railway → Account Settings → Tokens |
| `RAILWAY_PROJECT_ID` | ID del proyecto | Railway → Proyecto → Settings |
| `CLOUDFLARE_API_TOKEN` | Token de Cloudflare | Cloudflare → Profile → API Tokens |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID | Cloudflare Dashboard → Overview |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clave pública Clerk | Clerk Dashboard → API Keys |

### 3. Configurar Variables

| Variable | Valor |
|----------|-------|
| `VITE_API_URL` | `https://transporteriolavayen.up.railway.app` |
| `CLOUDFLARE_PAGES_PROJECT` | Nombre del proyecto Pages |
| `VITE_CLERK_PUBLISHABLE_KEY` | (desde secrets) |

## Pasos para Activar CI/CD

1. **Subir los workflows a GitHub:**
   ```bash
   git add .
   git commit -m "Add CI/CD workflows"
   git push
   ```

2. **Crear Environments en GitHub:**
   - Settings → Environments → New environment
   - Crear `staging` y `production`

3. **Configurar Secrets y Variables**
   - Settings → Secrets and variables → Actions

4. **Configurar aprobadores** (production):
   - Environment → `production` → Required reviewers

---

## Notas Importantes

- El workflow **no se ejecuta** hasta que no esté mergeado a las ramas correspondientes
- Push directo a `main` o `produccion` requiere aprobación de un reviewer
- Push a `desarrollo` deploya automáticamente a staging
- Los cambios en `backend/**` solo triggerea el backend workflow
- Los cambios en `frontend/**` solo triggerea el frontend workflow
