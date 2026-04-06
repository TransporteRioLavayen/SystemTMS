// =============================================================================
// ROUTES: BARCODE
// =============================================================================
// Presentation Layer - Rutas HTTP para generación de códigos de barras
// 
// Endpoints:
//   GET /api/barcodes/:type/:id         -> Imagen PNG del código
//   GET /api/barcodes/:type/:id/json    -> Info del código (debug)
//   POST /api/barcodes/validate         -> Validar código GS1

import { Router, Request, Response, NextFunction } from 'express';
import { requireAuthJson } from '../../infrastructure/middleware/clerk-auth';
import { barcodeService } from '../../infrastructure/services/barcode.service';

const router = Router();

// Todas las rutas requieren autenticación
router.use(requireAuthJson());

// =============================================================================
// HELPER: Obtener entidad y código
// =============================================================================

async function getEntityBarcodeInfo(
  type: string,
  id: string
): Promise<{
  code: string;
  symbology: 'gs1-128' | 'qr' | 'datamatrix' | 'ean13';
  humanReadable: string;
  label: string;
}> {
  const { getSupabaseClient } = await import('../../infrastructure/database/supabase/client');
  const supabase = getSupabaseClient();

  switch (type) {
    case 'hoja-ruta': {
      const { data, error } = await supabase
        .from('hojas_ruta')
        .select('id, sscc, chofer, unidad')
        .eq('id', id)
        .single();

      if (error || !data) throw new Error('Hoja de ruta no encontrada');
      if (!data.sscc) throw new Error('SSCC no generado para esta hoja de ruta');

      return {
        code: data.sscc,
        symbology: 'gs1-128',
        humanReadable: `SSCC: ${barcodeService.formatSSCC(data.sscc)} - ${data.chofer} - ${data.unidad}`,
        label: `Hoja de Ruta ${data.id.slice(0, 8)}`,
      };
    }

    case 'remito': {
      const { data, error } = await supabase
        .from('remitos')
        .select('id, seguimiento, destinatario, numero_remito')
        .eq('id', id)
        .single();

      if (error || !data) throw new Error('Remito no encontrado');
      if (!data.seguimiento) throw new Error('Código de seguimiento no generado');

      return {
        code: data.seguimiento,
        symbology: 'gs1-128',
        humanReadable: `TRK: ${data.seguimiento} - ${data.destinatario}`,
        label: `Remito ${data.numero_remito}`,
      };
    }

    case 'deposito': {
      const { data, error } = await supabase
        .from('depositos')
        .select('id, gln, nombre, ubicacion')
        .eq('id', id)
        .single();

      if (error || !data) throw new Error('Depósito no encontrado');
      if (!data.gln) throw new Error('GLN no generado para este depósito');

      return {
        code: data.gln,
        symbology: 'ean13', // GLN usa EAN-13 symbology
        humanReadable: `GLN: ${barcodeService.formatGLN(data.gln)} - ${data.nombre}`,
        label: `Depósito ${data.nombre}`,
      };
    }

    case 'unidad': {
      const { data, error } = await supabase
        .from('unidades')
        .select('id, ean, patente, marca, modelo')
        .eq('id', id)
        .single();

      if (error || !data) throw new Error('Unidad no encontrada');

      // Generar EAN si no existe
      const ean = data.ean || barcodeService.generateEAN13(id);

      return {
        code: ean,
        symbology: 'ean13',
        humanReadable: `EAN: ${ean} - ${data.patente} (${data.marca} ${data.modelo})`,
        label: `Unidad ${data.patente}`,
      };
    }

    default:
      throw new Error(`Tipo de entidad desconocido: ${type}`);
  }
}

// =============================================================================
// ROUTES
// =============================================================================

// GET /api/barcodes/:type/:id -> Imagen PNG
router.get('/:type/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, id } = req.params;
    const { format = 'png', size = '3', height = '10', showText = 'true' } = req.query;

    // Validar tipo de entidad
    const validTypes = ['hoja-ruta', 'remito', 'deposito', 'unidad'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: `Tipo inválido. Usar: ${validTypes.join(', ')}`,
      });
    }

    // Obtener info del código
    const info = await getEntityBarcodeInfo(type, id);

    // Generar imagen
    const imageBuffer = await barcodeService.generateBarcode({
      type: info.symbology,
      value: info.code,
      size: parseInt(size as string, 10),
      height: parseInt(height as string, 10),
      showText: showText === 'true',
      alt: info.label,
    });

    // Enviar respuesta
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache 1 hora
    res.send(imageBuffer);
  } catch (error: any) {
    if (error.message.includes('no encontrada') || error.message.includes('no generado')) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: error.message,
      });
    }
    next(error);
  }
});

// GET /api/barcodes/:type/:id/json -> Info del código
router.get('/:type/:id/json', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, id } = req.params;

    const validTypes = ['hoja-ruta', 'remito', 'deposito', 'unidad'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: `Tipo inválido. Usar: ${validTypes.join(', ')}`,
      });
    }

    const info = await getEntityBarcodeInfo(type, id);

    res.json({
      success: true,
      data: {
        type: info.symbology,
        code: info.code,
        humanReadable: info.humanReadable,
        entityType: type,
        entityId: id,
        label: info.label,
      },
    });
  } catch (error: any) {
    if (error.message.includes('no encontrada') || error.message.includes('no generado')) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: error.message,
      });
    }
    next(error);
  }
});

// POST /api/barcodes/validate -> Validar código GS1
router.post('/validate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, type } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Código es requerido',
      });
    }

    let isValid = false;
    let formatted = code;

    if (type === 'sscc' || code.startsWith('(00)')) {
      const cleanCode = code.startsWith('(00)') ? code.slice(4) : code;
      isValid = barcodeService.validateSSCC(cleanCode);
      if (isValid) formatted = barcodeService.formatSSCC(cleanCode);
    } else if (type === 'gln' || code.startsWith('(414)')) {
      const cleanCode = code.startsWith('(414)') ? code.slice(5) : code;
      isValid = barcodeService.validateGLN(cleanCode);
      if (isValid) formatted = barcodeService.formatGLN(cleanCode);
    } else if (type === 'ean13') {
      // Validar EAN-13 básico
      isValid = /^\d{13}$/.test(code);
    }

    res.json({
      success: true,
      data: {
        code,
        formatted,
        isValid,
        type: type || 'unknown',
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
