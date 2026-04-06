// =============================================================================
// BARCODE UTILITIES - FRONTEND (Browser-compatible)
// =============================================================================
// Utilidad para generar códigos de barras y QR en el frontend
// Usa bwip-js browser API (render to canvas)
//
// Uso en PDFs con jsPDF:
//   const barcodeImg = await generateBarcodeImage('gs1-128', '(00)123456789012345675');
//   doc.addImage(barcodeImg, 'PNG', x, y, width, height);

import bwipjs from 'bwip-js';

export type BarcodeType = 'gs1-128' | 'qr' | 'code128' | 'ean13';

/**
 * Genera un código de barras como Data URL (base64 PNG)
 * Usa la API del browser (canvas) de bwip-js
 */
export async function generateBarcodeImage(
  type: BarcodeType,
  value: string,
  options?: {
    scale?: number;
    height?: number;
    showText?: boolean;
  }
): Promise<string> {
  const {
    scale = 2,
    height = type === 'qr' ? undefined : 10,
    showText = true,
  } = options || {};

  // Mapeo de tipos a symbologies de bwip-js
  const bcidMap: Record<BarcodeType, string> = {
    'gs1-128': 'gs1-128',
    'code128': 'code128',
    'ean13': 'ean13',
    'qr': 'qrcode',
  };

  // Para GS1-128, agregar AI si no está presente
  let textToEncode = value;
  if (type === 'gs1-128' && !value.startsWith('(')) {
    textToEncode = `(00)${value}`;
  }

  try {
    // Crear canvas temporal
    const canvas = document.createElement('canvas');

    // Usar la API del browser de bwip-js
    await bwipjs.toCanvas(canvas, {
      bcid: bcidMap[type],
      text: textToEncode,
      scale,
      ...(height && { height }),
      includetext: showText,
      textxalign: 'center',
      ...(type === 'qr' && {
        includetext: false,
        paddingwidth: 1,
      }),
    });

    // Convertir canvas a Data URL
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error(`Error generando código ${type}:`, error);
    return '';
  }
}

/**
 * Genera un QR con datos JSON
 */
export async function generateQRImage(data: Record<string, unknown>, scale: number = 3): Promise<string> {
  return generateBarcodeImage('qr', JSON.stringify(data), { scale, showText: false });
}

/**
 * Formatea SSCC para display legible
 */
export function formatSSCC(sscc: string): string {
  if (!sscc || sscc.length !== 18) return sscc;
  return `${sscc[0]} ${sscc.slice(1, 8)} ${sscc.slice(8, 17)} ${sscc[17]}`;
}
