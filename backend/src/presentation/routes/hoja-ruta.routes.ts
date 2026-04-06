// =============================================================================
// ROUTES: HOJA DE RUTA
// =============================================================================
// Presentation Layer - Rutas HTTP para el módulo de hojas de ruta

import { Router } from 'express';
import { requireAuthJson } from '../../infrastructure/middleware/clerk-auth';
import { hojaDeRutaController } from '../controllers/hoja-ruta.controller';

const router = Router();

router.use(requireAuthJson());

// =============================================================================
// RUTAS HOJAS DE RUTA
// =============================================================================

// GET /api/hojas-ruta - Listar todas las hojas de ruta
router.get('/', hojaDeRutaController.list.bind(hojaDeRutaController));

// GET /api/hojas-ruta/flota-disponible - Listar flota disponible (unidades + terceros)
router.get('/flota-disponible', hojaDeRutaController.flotaDisponible.bind(hojaDeRutaController));

// GET /api/hojas-ruta/chofer/:dni - Obtener hojas de ruta por DNI del chofer (ANTES de /:id)
router.get('/chofer/:dni', hojaDeRutaController.findByChoferDni.bind(hojaDeRutaController));

// GET /api/hojas-ruta/:id - Obtener una hoja de ruta por ID
router.get('/:id', hojaDeRutaController.getById.bind(hojaDeRutaController));

// POST /api/hojas-ruta - Crear una nueva hoja de ruta
router.post('/', hojaDeRutaController.create.bind(hojaDeRutaController));

// PUT /api/hojas-ruta/:id - Actualizar una hoja de ruta
router.put('/:id', hojaDeRutaController.update.bind(hojaDeRutaController));

// POST /api/hojas-ruta/:id/iniciar-turno - Iniciar turno
router.post('/:id/iniciar-turno', hojaDeRutaController.iniciarTurno.bind(hojaDeRutaController));

// POST /api/hojas-ruta/:id/terminar-turno - Terminar turno
router.post('/:id/terminar-turno', hojaDeRutaController.terminarTurno.bind(hojaDeRutaController));

// POST /api/hojas-ruta/:id/agregar-carga - Agregar una carga
router.post('/:id/agregar-carga', hojaDeRutaController.agregarCarga.bind(hojaDeRutaController));

// PATCH /api/hojas-ruta/:id/remitos/:remitoId/estado - Actualizar estado de remito
router.patch('/:id/remitos/:remitoId/estado', hojaDeRutaController.actualizarEstadoRemito.bind(hojaDeRutaController));

// PATCH /api/hojas-ruta/:id/confirmar-completada - Confirmar hoja como completada
router.patch('/:id/confirmar-completada', hojaDeRutaController.confirmarCompletada.bind(hojaDeRutaController));

export default router;