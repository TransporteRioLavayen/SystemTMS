# Auditoría Técnica: UX Writer y copy

> **Proyecto:** TransporteRioLavayen TMS  
> **Área:** UX Writing / Content Strategy  
> **Estado:** 🟢 ESTÁNDAR - Diccionario centralizado implementado  
> **Auditor:** Senior Architect  
> **Fecha:** 2026-04-06

---

## 1. Resumen Ejecutivo

El lenguaje y la comunicación visual de TransporteRioLavayen han sido estandarizados para mantener coherencia en toda la aplicación. Después de implementar el diccionario `labels.ts` como fuente única de verdad, el equipo ahora cuenta con un sistema de etiquetas que garantiza consistencia, reduce errores y facilita el mantenimiento.

###Stack de Contenido

| Componente | Propósito |
|------------|-----------|
| `labels.ts` | Fuente única de etiquetas |
| Zod + Labels | Mensajes de validación humanizados |
| Toasts | Feedback contextual |
| Empty States | Orientación al usuario |

---

## 2. Principios de Comunicación

### 2.1 Voz y Tono

| Aspecto | Definición |
|---------|------------|
| **Voz** | Profesional, técnica pero accesible |
| **Tono** | Tranquilizador, orientado a la acción |
| **Idioma** | Español argentino/latinoamericano |
| **Tratamiento** | Vos (voseo) |

### 2.2 Guía de Estilo

| Elemento | Regla |
|----------|-------|
| Títulos | Title Case (Primera letra mayúscula) |
| Botones | Infinitivo (Guardar, Eliminar, Crear) |
| Cuerpo | Oración completa con punto |
| Estados | Title Case (Pendiente, Completado, En Proceso) |
| Códigos | Monospace (SSCC, GLN, EAN13) |

---

## 3. Sistema de Etiquetas

### 3.1 Estructura de labels.ts

```typescript
// domain/constants/labels.ts

export const LABELS = {
  common: {
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    create: 'Crear',
    search: 'Buscar',
    loading: 'Cargando...',
    noData: 'No hay datos',
  },
  choferes: {
    title: 'Choferes',
    createTitle: 'Crear chofer',
    editTitle: 'Editar chofer',
    fields: {
      nombre: 'Nombre completo',
      dni: 'DNI',
      licencia: 'Número de licencia',
      vencimientoLicencia: 'Vencimiento de licencia',
      telefono: 'Teléfono',
    },
  },
  // ...
};
```

### 3.2 Uso en Componentes

```typescript
import { LABELS } from '@/domain/constants/labels';

<Button>{LABELS.common.save}</Button>
<Input label={LABELS.choferes.fields.nombre} />
```

### 3.3 Checklist de Implementación

- [x] `labels.ts` creado y centralizado
- [x] Todas las etiquetas pasan por el diccionario
- [x] No hay strings hardcodeadas en componentes

---

## 4. Verbos de Acción

### 4.1 Estandarización

| Acción | Verbo | Contexto |
|--------|-------|----------|
| Guardar registro | `Guardar` | Formularios |
| Crear nuevo | `Crear` | Primary action |
| Modificar | `Editar` | Detalle |
| Eliminar | `Eliminar` | with confirmation |
| Cancelar operación | `Cancelar` | Formularios |
| Confirmar acción | `Confirmar` | Acciones críticas |
| Iniciar proceso | `Iniciar` | Turnos, hojas |
| Finalizar proceso | `Finalizar` | Turnos, hojas |
| Descargar | `Descargar` | Reportes |
| Subir | `Subir` | Archivos |

### 4.2 Diferenciación Semántica

| verbo | Uso correcto | Incorrecto |
|-------|-------------|------------|
| Guardar | Formularios, cambios | - |
| Confirmar | Acciones irreversibles | "Aceptar" |
| Rechazar | Rechazos formales | "Cancelar" |
| Cerrar | Cierre de modales | "Terminar" |

---

## 5. Mensajes de Validación

### 5.1 Integración Zod + Labels

```typescript
const CreateChoferSchema = z.object({
  nombre: z.string().min(1, LABELS.errors.required),
  dni: z.string().min(7, LABELS.errors.minLength(7)),
  licencia: z.string().min(1, LABELS.errors.required),
});
```

### 5.2 Catálogo de Errores

| Error | Mensaje |
|-------|---------|
| Required | Este campo es obligatorio |
| Min length | Mínimo {min} caracteres |
| Max length | Máximo {max} caracteres |
| Email | Correo electrónico inválido |
| Pattern | Formato inválido |
| Unique | Este valor ya existe |

### 5.3 Checklist de Validación

- [x] Errores en español
- [x] Mensajes específicos por campo
- [x] Integración con react-hook-form
- [x] Traducción automática vía labels

---

## 6. Estados Vacíos (Empty States)

### 6.1 Estructura

```typescript
<EmptyState
  title="No hay choferes"
  description="Aún no hay choferes cargados en el sistema. 
               Crea el primero para comenzar."
  action={{
    label: 'Crear chofer',
    onClick: () => navigate('/choferes/new')
  }}
/>
```

### 6.2 Principios

1. **No culpar al usuario:** "No hay datos" → "Aún no hay registros"
2. **Invitar a la acción:** Siempre incluir CTA
3. **Explicar contexto:** Por qué está vacío y qué hacer

### 6.3 Checklist de Empty States

- [x] Todos los listados tienen EmptyState
- [x] Mensajes orientadores
- [x] CTAs claros

---

## 7. Notificaciones y Feedback

### 7.1 Tipos de Toast

| Tipo | Uso | Color |
|------|-----|-------|
| Success | Operaciones exitosas | Verde |
| Error | Errores críticos | Rojo |
| Warning | Advertencias | Amarillo |
| Info | Información general | Azul |

### 7.2 Mensajes de Éxito

| Operación | Mensaje |
|-----------|---------|
| Crear | "{entidad} creado exitosamente" |
| Editar | "{entidad} actualizado" |
| Eliminar | "{entidad} eliminado" |
| Guardar | "Cambios guardados" |

### 7.3 Confirmaciones

```typescript
// Diálogo de confirmación
<AlertDialog>
  <AlertDialogTrigger>Eliminar</AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogTitle>
      ¿Estás seguro de eliminar este registro?
    </AlertDialogTitle>
    <AlertDialogDescription>
      Esta acción no se puede deshacer. 
      Se eliminará permanentemente.
    </AlertDialogDescription>
    <AlertDialogFooter>
      <Button variant="outline">Cancelar</Button>
      <Button variant="destructive">Eliminar</Button>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## 8. Glosario Técnico

### 8.1 Siglas Logísticas

| Sigla | Significado | Descripción |
|-------|-------------|-------------|
| SSCC | Serial Shipping Container Code | Código de contenedor |
| GLN | Global Location Number | Número de ubicación |
| EAN13 | European Article Number | Código de producto |
| VTV | Verificación Técnica Vehicular | Revisión vehicular |
| RTL | Revisión Técnica Local | Revisión local |

### 8.2 Tooltips

Todos los términos técnicos incluyen tooltip explicativo:

```typescript
<Badge tooltip="Serial Shipping Container Code">
  SSCC
</Badge>
```

---

## 9. Internacionalización (i18n)

### 9.1 Preparación

El sistema `labels.ts` está diseñado para migración futura a `i18next`:

```typescript
// Estructura compatible con i18n
const es = {
  common: { save: 'Guardar' },
};

const en = {
  common: { save: 'Save' },
};
```

### 9.2 Checklist i18n

- [x] Estructura preparada para i18n
- [x] No hay strings hardcodeadas
- [x] Easy migration path

---

## 10. Mejoras Futuras

### 10.1 Corto Plazo
1. Documentar todas las etiquetas en wiki
2. Crear guía de estilo para nuevos integrantes

### 10.2 Mediano Plazo
1. Implementar i18n para inglés
2. Agregar más variantes regionales

### 10.3 Largo Plazo
1. Sistema de traducciones community-driven
2. Lokalise o Crowdin integration

---

## 11. Referencias

- **Diccionario:** `frontend/src/domain/constants/labels.ts`
- **Errores:** `frontend/src/domain/schemas/`
- **Componentes:** `frontend/src/components/ui/`
- **Toast:** `frontend/src/components/ui/use-toast.ts`
