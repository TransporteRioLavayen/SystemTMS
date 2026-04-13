// =============================================================================
// ROUTES: DEPOSITO
// =============================================================================
// Presentation Layer - Definición de rutas del módulo de depósitos

import { Router, Request, Response } from 'express';
import { requireAuthJson } from '../../infrastructure/middleware/clerk-auth';
import { depositoController } from '../controllers/deposito.controller';
import { getSupabaseClient } from '../../infrastructure/database/supabase/client';
import { logger } from '../../infrastructure/logging/logger';

const router = Router();

// =============================================================================
// RUTAS PÚBLICAS (Sin autenticación)
// =============================================================================
// GET /api/depositos/public - Lista depósitos activos para la landing page
router.get('/public', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('[deposito.routes] /public endpoint called');
    
    // Query directa para debug
    const supabase = getSupabaseClient();
    const { data, error, count } = await supabase
      .from('depositos')
      .select('*', { count: 'exact' })
      .eq('estado', 'activo');
    
    console.log('[deposito.routes] Direct query result:', { dataCount: data?.length, count, error });
    
    if (error) {
      console.error('[deposito.routes] Supabase error:', error);
      throw new Error(`Supabase error: ${error.message}`);
    }
    
    logger.info({ count: data?.length || 0 }, 'Public deposits retrieved');
    res.json({ data: data || [] });
  } catch (error) {
    console.error('[deposito.routes] Error:', error);
    logger.error({ error }, 'Error getting public deposits');
    res.status(400).json({ error: (error as Error).message });
  }
});

// =============================================================================
// RUTAS PROTEGIDAS (Requieren autenticación)
// =============================================================================
router.use(requireAuthJson());

// Rutas para el módulo de depósitos
router.get('/', depositoController.list.bind(depositoController));
router.get('/:id', depositoController.getById.bind(depositoController));
router.post('/', depositoController.create.bind(depositoController));
router.put('/:id', depositoController.update.bind(depositoController));
router.delete('/:id', depositoController.delete.bind(depositoController));

export default router;