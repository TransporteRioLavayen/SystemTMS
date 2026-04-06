// =============================================================================
// SWAGGER / OPENAPI 3.0 CONFIGURATION
// =============================================================================
// Documentación completa de la API de LogisPro - Transportes Río Lavayén
// Acceder en: http://localhost:3001/api-docs

import swaggerJsdoc from 'swagger-jsdoc';
import { logger } from '../infrastructure/logging/logger';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Transporte Rio Lavayén API',
      version: '1.0.0',
      description: `
API REST para el sistema de gestión logística de Transportes Río Lavayén.

## Arquitectura

Este API sigue una arquitectura Clean Architecture con las siguientes capas:

- **Domain Layer**: Entidades y contratos (interfaces de repositorios)
- **Application Layer**: Casos de uso y DTOs
- **Infrastructure Layer**: Implementaciones de repositorios y servicios externos
- **Presentation Layer**: Controladores HTTP y rutas

## Módulos disponibles

- **Depósitos** - Gestión de sucursales y bodegas
- **Unidades** - Gestión de la flota de camiones
- **Choferes** - Gestión de conductores
- **Terceros** - Gestión de transportistas externos
- **Planillas** - Gestión de planillas de viaje y remitos (flujo completo: borrador → viaje → control → completo)
- **Hojas de Ruta** - Planificación de rutas de reparto y seguimiento de entregas
- **Tracking** - Seguimiento público de envíos por código

## Estados del flujo de planillas

\`borrador\` → \`viaje\` → \`control\` → \`completo\` / \`incompleto\`

## Estados del flujo de hojas de ruta

\`Lista para salir\` → \`En reparto\` → \`Unidad libre\` / \`Completada\`

## Estados de remitos

\`Ingresado\` → \`En viaje\` → \`En Casa Central\` → \`Control Interno\` → \`Preparado\` → \`En Reparto\` → \`Finalizado\` / \`Por reasignar\`
      `,
      contact: {
        name: 'Transportes Río Lavayén',
      },
      license: {
        name: 'Proprietary',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Servidor de desarrollo',
      },
    ],
    tags: [
      { name: 'Health', description: 'Verificación de estado del servicio' },
      { name: 'Depósitos', description: 'Gestión de sucursales y bodegas' },
      { name: 'Unidades', description: 'Gestión de la flota de camiones' },
      { name: 'Choferes', description: 'Gestión de conductores' },
      { name: 'Terceros', description: 'Gestión de transportistas externos' },
      { name: 'Planillas', description: 'Gestión de planillas de viaje y remitos' },
      { name: 'Hojas de Ruta', description: 'Planificación de rutas y seguimiento de entregas' },
    ],
    paths: {
      // =========================================================================
      // HEALTH
      // =========================================================================
      '/api/health': {
        get: {
          tags: ['Health'],
          summary: 'Verificar estado del servicio',
          description: 'Endpoint de health check para verificar que el servidor está operativo.',
          responses: {
            200: {
              description: 'Servicio operativo',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      timestamp: { type: 'string', format: 'date-time' },
                      service: { type: 'string', example: 'logispro-backend' },
                      version: { type: 'string', example: '1.0.0' },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // =========================================================================
      // DEPOSITOS
      // =========================================================================
      '/api/depositos': {
        get: {
          tags: ['Depósitos'],
          summary: 'Listar todos los depósitos',
          parameters: [
            { name: 'incluirInactivos', in: 'query', schema: { type: 'boolean', default: false }, description: 'Incluir depósitos inactivos' },
          ],
          responses: {
            200: { description: 'Lista de depósitos', content: { 'application/json': { schema: { $ref: '#/components/schemas/DepositoListResponse' } } } },
          },
        },
        post: {
          tags: ['Depósitos'],
          summary: 'Crear un nuevo depósito',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateDeposito' } } } },
          responses: {
            201: { description: 'Depósito creado', content: { 'application/json': { schema: { $ref: '#/components/schemas/DepositoResponse' } } } },
            400: { description: 'Error de validación' },
          },
        },
      },
      '/api/depositos/{id}': {
        get: {
          tags: ['Depósitos'],
          summary: 'Obtener depósito por ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            200: { description: 'Depósito encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/DepositoResponse' } } } },
            404: { description: 'Depósito no encontrado' },
          },
        },
        put: {
          tags: ['Depósitos'],
          summary: 'Actualizar depósito',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateDeposito' } } } },
          responses: {
            200: { description: 'Depósito actualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/DepositoResponse' } } } },
            404: { description: 'Depósito no encontrado' },
          },
        },
        delete: {
          tags: ['Depósitos'],
          summary: 'Eliminar depósito (soft delete)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            200: { description: 'Depósito eliminado' },
            404: { description: 'Depósito no encontrado' },
          },
        },
      },

      // =========================================================================
      // UNIDADES
      // =========================================================================
      '/api/unidades': {
        get: {
          tags: ['Unidades'],
          summary: 'Listar todas las unidades',
          parameters: [
            { name: 'incluirInactivos', in: 'query', schema: { type: 'boolean', default: false }, description: 'Incluir unidades inactivas' },
          ],
          responses: {
            200: { description: 'Lista de unidades', content: { 'application/json': { schema: { $ref: '#/components/schemas/UnidadListResponse' } } } },
          },
        },
        post: {
          tags: ['Unidades'],
          summary: 'Crear una nueva unidad',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateUnidad' } } } },
          responses: {
            201: { description: 'Unidad creada', content: { 'application/json': { schema: { $ref: '#/components/schemas/UnidadResponse' } } } },
            400: { description: 'Error de validación' },
          },
        },
      },
      '/api/unidades/{id}': {
        get: {
          tags: ['Unidades'],
          summary: 'Obtener unidad por ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            200: { description: 'Unidad encontrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/UnidadResponse' } } } },
            404: { description: 'Unidad no encontrada' },
          },
        },
        put: {
          tags: ['Unidades'],
          summary: 'Actualizar unidad',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateUnidad' } } } },
          responses: {
            200: { description: 'Unidad actualizada', content: { 'application/json': { schema: { $ref: '#/components/schemas/UnidadResponse' } } } },
            404: { description: 'Unidad no encontrada' },
          },
        },
        delete: {
          tags: ['Unidades'],
          summary: 'Eliminar unidad',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            200: { description: 'Unidad eliminada' },
            404: { description: 'Unidad no encontrada' },
          },
        },
      },

      // =========================================================================
      // CHOFERES
      // =========================================================================
      '/api/choferes': {
        get: {
          tags: ['Choferes'],
          summary: 'Listar todos los choferes',
          parameters: [
            { name: 'incluirInactivos', in: 'query', schema: { type: 'boolean', default: false }, description: 'Incluir choferes inactivos' },
          ],
          responses: {
            200: { description: 'Lista de choferes', content: { 'application/json': { schema: { $ref: '#/components/schemas/ChoferListResponse' } } } },
          },
        },
        post: {
          tags: ['Choferes'],
          summary: 'Crear un nuevo chofer',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateChofer' } } } },
          responses: {
            201: { description: 'Chofer creado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ChoferResponse' } } } },
            400: { description: 'Error de validación' },
          },
        },
      },
      '/api/choferes/{id}': {
        get: {
          tags: ['Choferes'],
          summary: 'Obtener chofer por ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            200: { description: 'Chofer encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ChoferResponse' } } } },
            404: { description: 'Chofer no encontrado' },
          },
        },
        put: {
          tags: ['Choferes'],
          summary: 'Actualizar chofer',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateChofer' } } } },
          responses: {
            200: { description: 'Chofer actualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ChoferResponse' } } } },
            404: { description: 'Chofer no encontrado' },
          },
        },
        delete: {
          tags: ['Choferes'],
          summary: 'Eliminar chofer',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            200: { description: 'Chofer eliminado' },
            404: { description: 'Chofer no encontrado' },
          },
        },
      },

      // =========================================================================
      // TERCEROS
      // =========================================================================
      '/api/terceros': {
        get: {
          tags: ['Terceros'],
          summary: 'Listar todos los terceros',
          parameters: [
            { name: 'incluirInactivos', in: 'query', schema: { type: 'boolean', default: false }, description: 'Incluir terceros inactivos' },
          ],
          responses: {
            200: { description: 'Lista de terceros', content: { 'application/json': { schema: { $ref: '#/components/schemas/TerceroListResponse' } } } },
          },
        },
        post: {
          tags: ['Terceros'],
          summary: 'Crear un nuevo tercero',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateTercero' } } } },
          responses: {
            201: { description: 'Tercero creado', content: { 'application/json': { schema: { $ref: '#/components/schemas/TerceroResponse' } } } },
            400: { description: 'Error de validación' },
          },
        },
      },
      '/api/terceros/{id}': {
        get: {
          tags: ['Terceros'],
          summary: 'Obtener tercero por ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            200: { description: 'Tercero encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/TerceroResponse' } } } },
            404: { description: 'Tercero no encontrado' },
          },
        },
        put: {
          tags: ['Terceros'],
          summary: 'Actualizar tercero',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateTercero' } } } },
          responses: {
            200: { description: 'Tercero actualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/TerceroResponse' } } } },
            404: { description: 'Tercero no encontrado' },
          },
        },
        delete: {
          tags: ['Terceros'],
          summary: 'Eliminar tercero (soft delete)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            200: { description: 'Tercero eliminado' },
            404: { description: 'Tercero no encontrado' },
          },
        },
      },

      // =========================================================================
      // PLANILLAS
      // =========================================================================
      '/api/planillas': {
        get: {
          tags: ['Planillas'],
          summary: 'Listar todas las planillas',
          parameters: [
            { name: 'estado', in: 'query', schema: { type: 'string', enum: ['borrador', 'viaje', 'control', 'completo', 'incompleto'] }, description: 'Filtrar por estado' },
          ],
          responses: {
            200: { description: 'Lista de planillas', content: { 'application/json': { schema: { $ref: '#/components/schemas/PlanillaListResponse' } } } },
          },
        },
        post: {
          tags: ['Planillas'],
          summary: 'Crear una nueva planilla',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreatePlanilla' } } } },
          responses: {
            201: { description: 'Planilla creada', content: { 'application/json': { schema: { $ref: '#/components/schemas/PlanillaResponse' } } } },
            400: { description: 'Error de validación' },
          },
        },
      },
      '/api/planillas/{id}': {
        get: {
          tags: ['Planillas'],
          summary: 'Obtener planilla por ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            200: { description: 'Planilla encontrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/PlanillaResponse' } } } },
            404: { description: 'Planilla no encontrada' },
          },
        },
        put: {
          tags: ['Planillas'],
          summary: 'Actualizar planilla',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdatePlanilla' } } } },
          responses: {
            200: { description: 'Planilla actualizada', content: { 'application/json': { schema: { $ref: '#/components/schemas/PlanillaResponse' } } } },
            404: { description: 'Planilla no encontrada' },
          },
        },
        delete: {
          tags: ['Planillas'],
          summary: 'Eliminar planilla',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            200: { description: 'Planilla eliminada' },
            404: { description: 'Planilla no encontrada' },
          },
        },
      },
      '/api/planillas/{id}/confirmar-viaje': {
        post: {
          tags: ['Planillas'],
          summary: 'Confirmar inicio de viaje (borrador → viaje)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['kmSalida'], properties: { kmSalida: { type: 'number' } } } } } },
          responses: {
            200: { description: 'Viaje confirmado', content: { 'application/json': { schema: { $ref: '#/components/schemas/PlanillaResponse' } } } },
            400: { description: 'Planilla no en estado borrador' },
          },
        },
      },
      '/api/planillas/{id}/confirmar-llegada': {
        post: {
          tags: ['Planillas'],
          summary: 'Confirmar llegada de viaje (viaje → control)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['kmLlegada'], properties: { kmLlegada: { type: 'number' } } } } } },
          responses: {
            200: { description: 'Llegada confirmada', content: { 'application/json': { schema: { $ref: '#/components/schemas/PlanillaResponse' } } } },
            400: { description: 'Planilla no en estado viaje' },
          },
        },
      },
      '/api/planillas/{id}/finalizar-control': {
        post: {
          tags: ['Planillas'],
          summary: 'Finalizar control de bultos (control → completo/incompleto)',
          description: 'Genera códigos de seguimiento para todos los remitos y actualiza estados.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/FinalizarControl' } } },
          },
          responses: {
            200: { description: 'Control finalizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/PlanillaResponse' } } } },
            400: { description: 'Planilla no en estado control' },
          },
        },
      },
      '/api/planillas/remitos/{estado}': {
        get: {
          tags: ['Planillas'],
          summary: 'Obtener remitos por estado',
          description: 'Útil para obtener remitos "Preparado" (listos para hoja de ruta) o "Por reasignar" (rechazados).',
          parameters: [
            { name: 'estado', in: 'path', required: true, schema: { type: 'string', enum: ['Ingresado', 'En viaje', 'En Casa Central', 'Control Interno', 'Preparado', 'En Reparto', 'Finalizado', 'Por reasignar'] } },
          ],
          responses: {
            200: { description: 'Remitos encontrados', content: { 'application/json': { schema: { $ref: '#/components/schemas/RemitoListResponse' } } } },
          },
        },
      },
      '/api/planillas/tracking/{code}': {
        get: {
          tags: ['Planillas'],
          summary: 'Obtener tracking por código de seguimiento',
          description: 'Endpoint público para rastreo de envíos. No requiere autenticación.',
          parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string' }, description: 'Código de seguimiento (ej: TRK-XXXXX)' }],
          responses: {
            200: { description: 'Tracking encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/TrackingResponse' } } } },
            404: { description: 'Código de seguimiento no encontrado' },
          },
        },
      },

      // =========================================================================
      // HOJAS DE RUTA
      // =========================================================================
      '/api/hojas-ruta': {
        get: {
          tags: ['Hojas de Ruta'],
          summary: 'Listar todas las hojas de ruta',
          parameters: [
            { name: 'estado', in: 'query', schema: { type: 'string', enum: ['Lista para salir', 'En reparto', 'Finalizó reparto', 'Unidad libre', 'Completada'] }, description: 'Filtrar por estado' },
          ],
          responses: {
            200: { description: 'Lista de hojas de ruta', content: { 'application/json': { schema: { $ref: '#/components/schemas/HojaDeRutaListResponse' } } } },
          },
        },
        post: {
          tags: ['Hojas de Ruta'],
          summary: 'Crear una nueva hoja de ruta',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateHojaDeRuta' } } } },
          responses: {
            201: { description: 'Hoja de ruta creada', content: { 'application/json': { schema: { $ref: '#/components/schemas/HojaDeRutaResponse' } } } },
            400: { description: 'Error de validación' },
          },
        },
      },
      '/api/hojas-ruta/{id}': {
        get: {
          tags: ['Hojas de Ruta'],
          summary: 'Obtener hoja de ruta por ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            200: { description: 'Hoja de ruta encontrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/HojaDeRutaResponse' } } } },
            404: { description: 'Hoja de ruta no encontrada' },
          },
        },
        put: {
          tags: ['Hojas de Ruta'],
          summary: 'Actualizar hoja de ruta',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: {
            200: { description: 'Hoja de ruta actualizada', content: { 'application/json': { schema: { $ref: '#/components/schemas/HojaDeRutaResponse' } } } },
            404: { description: 'Hoja de ruta no encontrada' },
          },
        },
      },
      '/api/hojas-ruta/chofer/{dni}': {
        get: {
          tags: ['Hojas de Ruta'],
          summary: 'Obtener hojas de ruta por DNI del chofer',
          parameters: [{ name: 'dni', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Hojas de ruta del chofer', content: { 'application/json': { schema: { $ref: '#/components/schemas/HojaDeRutaListResponse' } } } },
          },
        },
      },
      '/api/hojas-ruta/{id}/iniciar-turno': {
        post: {
          tags: ['Hojas de Ruta'],
          summary: 'Iniciar turno (Lista para salir → En reparto)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['kmSalida'], properties: { kmSalida: { type: 'number' } } } } } },
          responses: {
            200: { description: 'Turno iniciado', content: { 'application/json': { schema: { $ref: '#/components/schemas/HojaDeRutaResponse' } } } },
            400: { description: 'Hoja no en estado "Lista para salir"' },
          },
        },
      },
      '/api/hojas-ruta/{id}/terminar-turno': {
        post: {
          tags: ['Hojas de Ruta'],
          summary: 'Terminar turno (En reparto → Unidad libre)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['kmLlegada'], properties: { kmLlegada: { type: 'number' } } } } } },
          responses: {
            200: { description: 'Turno terminado', content: { 'application/json': { schema: { $ref: '#/components/schemas/HojaDeRutaResponse' } } } },
            400: { description: 'Hoja no en estado "En reparto"' },
          },
        },
      },
      '/api/hojas-ruta/{id}/agregar-carga': {
        post: {
          tags: ['Hojas de Ruta'],
          summary: 'Agregar carga a hoja de ruta',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateCarga' } } } },
          responses: {
            200: { description: 'Carga agregada', content: { 'application/json': { schema: { $ref: '#/components/schemas/HojaDeRutaResponse' } } } },
            404: { description: 'Hoja de ruta no encontrada' },
          },
        },
      },
      '/api/hojas-ruta/{id}/remitos/{remitoId}/estado': {
        patch: {
          tags: ['Hojas de Ruta'],
          summary: 'Actualizar estado de remito en hoja de ruta',
          description: 'Permite marcar un remito como Entregado o Rechazado. Si es rechazado, el remito pasa a estado "Por reasignar".',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'ID de la hoja de ruta' },
            { name: 'remitoId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'ID del registro en hoja_ruta_remitos' },
          ],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ActualizarEstadoRemito' } } },
          },
          responses: {
            200: { description: 'Estado actualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/HojaDeRutaResponse' } } } },
            400: { description: 'Remito ya en estado final o falta motivo de rechazo' },
            404: { description: 'Remito no encontrado en la hoja' },
          },
        },
      },
      '/api/hojas-ruta/{id}/confirmar-completada': {
        patch: {
          tags: ['Hojas de Ruta'],
          summary: 'Confirmar hoja de ruta como completada',
          description: 'Solo disponible si todas las entregas están completas (entregadas o rechazadas).',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            200: { description: 'Hoja confirmada como completada', content: { 'application/json': { schema: { $ref: '#/components/schemas/HojaDeRutaResponse' } } } },
            400: { description: 'No todas las entregas están completas' },
            404: { description: 'Hoja de ruta no encontrada' },
          },
        },
      },
    },

    // =========================================================================
    // SCHEMAS
    // =========================================================================
    components: {
      schemas: {
        // --- DEPOSITOS ---
        Deposito: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            nombre: { type: 'string' },
            ubicacion: { type: 'string' },
            capacidad: { type: 'integer' },
            encargado: { type: 'string', nullable: true },
            lat: { type: 'number', nullable: true },
            lng: { type: 'number', nullable: true },
            estado: { type: 'string', enum: ['activo', 'inactivo'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateDeposito: {
          type: 'object',
          required: ['nombre', 'ubicacion', 'capacidad'],
          properties: {
            nombre: { type: 'string', minLength: 3, maxLength: 255 },
            ubicacion: { type: 'string', minLength: 1, maxLength: 500 },
            capacidad: { type: 'integer', minimum: 1 },
            encargado: { type: 'string', maxLength: 255 },
            lat: { type: 'number', minimum: -90, maximum: 90 },
            lng: { type: 'number', minimum: -180, maximum: 180 },
          },
        },
        UpdateDeposito: {
          type: 'object',
          properties: {
            nombre: { type: 'string' },
            ubicacion: { type: 'string' },
            capacidad: { type: 'integer' },
            encargado: { type: 'string', nullable: true },
            lat: { type: 'number', nullable: true },
            lng: { type: 'number', nullable: true },
            estado: { type: 'string', enum: ['activo', 'inactivo'] },
          },
        },
        DepositoResponse: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Deposito' }, message: { type: 'string' } } },
        DepositoListResponse: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/Deposito' } }, count: { type: 'integer' } } },

        // --- UNIDADES ---
        Unidad: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            patente: { type: 'string' },
            marca: { type: 'string' },
            modelo: { type: 'string' },
            anio: { type: 'string' },
            tipo: { type: 'string', enum: ['rígido', 'semirremolque', 'camioneta'] },
            vtv: { type: 'string', nullable: true },
            seguro: { type: 'string', nullable: true },
            estado: { type: 'string', enum: ['DISPONIBLE', 'EN_RUTA', 'MANTENIMIENTO'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateUnidad: {
          type: 'object',
          required: ['patente', 'marca', 'modelo', 'anio', 'tipo'],
          properties: {
            patente: { type: 'string' },
            marca: { type: 'string' },
            modelo: { type: 'string' },
            anio: { type: 'string' },
            tipo: { type: 'string' },
            vtv: { type: 'string' },
            seguro: { type: 'string' },
          },
        },
        UpdateUnidad: {
          type: 'object',
          properties: {
            patente: { type: 'string' },
            marca: { type: 'string' },
            modelo: { type: 'string' },
            anio: { type: 'string' },
            tipo: { type: 'string' },
            vtv: { type: 'string' },
            seguro: { type: 'string' },
            estado: { type: 'string', enum: ['DISPONIBLE', 'EN_RUTA', 'MANTENIMIENTO'] },
          },
        },
        UnidadResponse: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Unidad' }, message: { type: 'string' } } },
        UnidadListResponse: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/Unidad' } }, count: { type: 'integer' } } },

        // --- CHOFERES ---
        Chofer: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            nombre: { type: 'string' },
            dni: { type: 'string' },
            licencia: { type: 'string' },
            vencimientoLicencia: { type: 'string', format: 'date' },
            telefono: { type: 'string' },
            estado: { type: 'string', enum: ['DISPONIBLE', 'EN_RUTA', 'INACTIVO'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateChofer: {
          type: 'object',
          required: ['nombre', 'dni', 'licencia', 'vencimientoLicencia', 'telefono'],
          properties: {
            nombre: { type: 'string' },
            dni: { type: 'string' },
            licencia: { type: 'string' },
            vencimientoLicencia: { type: 'string', format: 'date' },
            telefono: { type: 'string' },
          },
        },
        UpdateChofer: {
          type: 'object',
          properties: {
            nombre: { type: 'string' },
            dni: { type: 'string' },
            licencia: { type: 'string' },
            vencimientoLicencia: { type: 'string', format: 'date' },
            telefono: { type: 'string' },
            estado: { type: 'string', enum: ['DISPONIBLE', 'EN_RUTA', 'INACTIVO'] },
          },
        },
        ChoferResponse: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Chofer' }, message: { type: 'string' } } },
        ChoferListResponse: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/Chofer' } }, count: { type: 'integer' } } },

        // --- TERCEROS ---
        Tercero: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            razonSocial: { type: 'string' },
            tipoDocumento: { type: 'string', enum: ['CUIT', 'DNI', 'CUIL'] },
            numeroDocumento: { type: 'string' },
            telefono: { type: 'string', nullable: true },
            email: { type: 'string', nullable: true },
            patenteTractor: { type: 'string' },
            patenteAcoplado: { type: 'string', nullable: true },
            tipoUnidad: { type: 'string', enum: ['Semi', 'Chasis', 'Acoplado', 'Utilitario'] },
            vencimientoSeguro: { type: 'string', nullable: true },
            vencimientoVtv: { type: 'string', nullable: true },
            nombreChofer: { type: 'string', nullable: true },
            dniChofer: { type: 'string', nullable: true },
            vencimientoLicencia: { type: 'string', nullable: true },
            vencimientoLinti: { type: 'string', nullable: true },
            estado: { type: 'string', enum: ['activo', 'inactivo'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateTercero: {
          type: 'object',
          required: ['razonSocial', 'tipoDocumento', 'numeroDocumento', 'patenteTractor', 'tipoUnidad'],
          properties: {
            razonSocial: { type: 'string' },
            tipoDocumento: { type: 'string', enum: ['CUIT', 'DNI', 'CUIL'] },
            numeroDocumento: { type: 'string' },
            telefono: { type: 'string' },
            email: { type: 'string', format: 'email' },
            patenteTractor: { type: 'string' },
            patenteAcoplado: { type: 'string' },
            tipoUnidad: { type: 'string', enum: ['Semi', 'Chasis', 'Acoplado', 'Utilitario'] },
            vencimientoSeguro: { type: 'string', format: 'date' },
            vencimientoVtv: { type: 'string', format: 'date' },
            nombreChofer: { type: 'string' },
            dniChofer: { type: 'string' },
            vencimientoLicencia: { type: 'string', format: 'date' },
            vencimientoLinti: { type: 'string', format: 'date' },
          },
        },
        UpdateTercero: {
          type: 'object',
          properties: {
            razonSocial: { type: 'string' },
            tipoDocumento: { type: 'string', enum: ['CUIT', 'DNI', 'CUIL'] },
            numeroDocumento: { type: 'string' },
            telefono: { type: 'string' },
            email: { type: 'string', format: 'email' },
            patenteTractor: { type: 'string' },
            patenteAcoplado: { type: 'string' },
            tipoUnidad: { type: 'string', enum: ['Semi', 'Chasis', 'Acoplado', 'Utilitario'] },
            vencimientoSeguro: { type: 'string', format: 'date' },
            vencimientoVtv: { type: 'string', format: 'date' },
            nombreChofer: { type: 'string' },
            dniChofer: { type: 'string' },
            vencimientoLicencia: { type: 'string', format: 'date' },
            vencimientoLinti: { type: 'string', format: 'date' },
            estado: { type: 'string', enum: ['activo', 'inactivo'] },
          },
        },
        TerceroResponse: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Tercero' }, message: { type: 'string' } } },
        TerceroListResponse: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/Tercero' } }, count: { type: 'integer' } } },

        // --- PLANILLAS ---
        Remito: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            remitente: { type: 'string' },
            numeroRemito: { type: 'string' },
            destinatario: { type: 'string' },
            bultos: { type: 'integer' },
            valorDeclarado: { type: 'number' },
            seguimiento: { type: 'string', nullable: true },
            direccion: { type: 'string', nullable: true },
            whatsapp: { type: 'string', nullable: true },
            estado: { type: 'string', enum: ['Ingresado', 'En viaje', 'En Casa Central', 'Control Interno', 'Preparado', 'En Reparto', 'Finalizado', 'Por reasignar'] },
            resultado: { type: 'string', enum: ['Entregado', 'Rechazado'], nullable: true },
            bultosRecibidos: { type: 'integer', nullable: true },
            pesoTotal: { type: 'number', nullable: true },
          },
        },
        Planilla: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            sucursal: { type: 'string' },
            fechaSalida: { type: 'string', format: 'date-time' },
            fechaLlegada: { type: 'string', format: 'date-time', nullable: true },
            camion: { type: 'string' },
            chofer: { type: 'string' },
            remitos: { type: 'array', items: { $ref: '#/components/schemas/Remito' } },
            estado: { type: 'string', enum: ['borrador', 'viaje', 'control', 'completo', 'incompleto'] },
            comentarios: { type: 'string', nullable: true },
            kmSalida: { type: 'integer', nullable: true },
            kmLlegada: { type: 'integer', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreatePlanilla: {
          type: 'object',
          required: ['sucursal', 'fechaSalida', 'camion', 'chofer'],
          properties: {
            sucursal: { type: 'string' },
            fechaSalida: { type: 'string', format: 'date-time' },
            fechaLlegada: { type: 'string', format: 'date-time' },
            camion: { type: 'string' },
            chofer: { type: 'string' },
            comentarios: { type: 'string' },
            remitos: { type: 'array', items: { $ref: '#/components/schemas/Remito' } },
          },
        },
        UpdatePlanilla: {
          type: 'object',
          properties: {
            sucursal: { type: 'string' },
            fechaSalida: { type: 'string', format: 'date-time' },
            fechaLlegada: { type: 'string', format: 'date-time' },
            camion: { type: 'string' },
            chofer: { type: 'string' },
            estado: { type: 'string', enum: ['borrador', 'viaje', 'control', 'completo', 'incompleto'] },
            comentarios: { type: 'string' },
            kmSalida: { type: 'integer' },
            kmLlegada: { type: 'integer' },
            remitos: { type: 'array', items: { $ref: '#/components/schemas/Remito' } },
          },
        },
        FinalizarControl: {
          type: 'object',
          required: ['remitos'],
          properties: {
            remitos: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                required: ['id', 'bultosRecibidos', 'pesoTotal', 'direccion', 'whatsapp'],
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  bultosRecibidos: { type: 'integer', minimum: 0 },
                  pesoTotal: { type: 'number', minimum: 0 },
                  direccion: { type: 'string', minLength: 1 },
                  whatsapp: { type: 'string', minLength: 10, maxLength: 10 },
                },
              },
            },
          },
        },
        PlanillaResponse: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Planilla' }, message: { type: 'string' } } },
        PlanillaListResponse: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/Planilla' } }, count: { type: 'integer' } } },
        RemitoListResponse: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/Remito' } }, message: { type: 'string' } } },

        // --- TRACKING ---
        TrackingEvent: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            remito_id: { type: 'string', format: 'uuid' },
            tracking_code: { type: 'string' },
            estado: { type: 'string' },
            evento: { type: 'string' },
            descripcion: { type: 'string' },
            ubicacion: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        TrackingResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                remito: { $ref: '#/components/schemas/Remito' },
                events: { type: 'array', items: { $ref: '#/components/schemas/TrackingEvent' } },
              },
            },
            message: { type: 'string' },
          },
        },

        // --- HOJAS DE RUTA ---
        RemitoHoja: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            remitoId: { type: 'string', format: 'uuid', nullable: true },
            cliente: { type: 'string' },
            direccion: { type: 'string' },
            whatsapp: { type: 'string', nullable: true },
            bultos: { type: 'integer' },
            estado: { type: 'string', enum: ['En Base', 'En reparto', 'Entregado', 'Rechazado'] },
            motivoRechazo: { type: 'string', nullable: true },
            notasRechazo: { type: 'string', nullable: true },
          },
        },
        HojaDeRuta: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            unidad: { type: 'string' },
            chofer: { type: 'string' },
            acompanante: { type: 'string', nullable: true },
            cargas: { type: 'array', items: { $ref: '#/components/schemas/RemitoHoja' } },
            fechaCreacion: { type: 'string', format: 'date-time' },
            estado: { type: 'string', enum: ['Lista para salir', 'En reparto', 'Finalizó reparto', 'Unidad libre', 'Completada'] },
            kmSalida: { type: 'integer', nullable: true },
            kmLlegada: { type: 'integer', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateHojaDeRuta: {
          type: 'object',
          required: ['unidad', 'chofer'],
          properties: {
            unidad: { type: 'string' },
            chofer: { type: 'string' },
            acompanante: { type: 'string' },
            cargas: {
              type: 'array',
              items: {
                type: 'object',
                required: ['cliente', 'direccion', 'bultos'],
                properties: {
                  remitoId: { type: 'string', format: 'uuid' },
                  cliente: { type: 'string' },
                  direccion: { type: 'string' },
                  whatsapp: { type: 'string' },
                  bultos: { type: 'integer', minimum: 1 },
                },
              },
            },
          },
        },
        CreateCarga: {
          type: 'object',
          required: ['cliente', 'direccion', 'bultos'],
          properties: {
            remitoId: { type: 'string', format: 'uuid' },
            cliente: { type: 'string' },
            direccion: { type: 'string' },
            whatsapp: { type: 'string' },
            bultos: { type: 'integer', minimum: 1 },
          },
        },
        ActualizarEstadoRemito: {
          type: 'object',
          required: ['estado'],
          properties: {
            estado: { type: 'string', enum: ['En Base', 'En reparto', 'Entregado', 'Rechazado'] },
            motivoRechazo: { type: 'string', description: 'Obligatorio cuando estado = "Rechazado"' },
            notasRechazo: { type: 'string' },
          },
        },
        HojaDeRutaResponse: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/HojaDeRuta' }, message: { type: 'string' } } },
        HojaDeRutaListResponse: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/HojaDeRuta' } }, count: { type: 'integer' } } },
      },
    },
  },
  apis: [], // Sin JSDoc — toda la doc está inline. apis glob era lento en WSL2
};

// Generación lazy — solo se ejecuta cuando alguien visita /api-docs
// para no bloquear el arranque del servidor en WSL2
let _cachedSpec: any = null;
export const getSwaggerSpec = () => {
  if (!_cachedSpec) {
    logger.info('[Swagger] Generando documentación (primera visita)...');
    _cachedSpec = swaggerJsdoc(options);
  }
  return _cachedSpec;
};

// Compatibilidad con imports existentes (lazy)
export const swaggerSpec = new Proxy({} as any, {
  get: (_, prop) => getSwaggerSpec()[prop],
});
