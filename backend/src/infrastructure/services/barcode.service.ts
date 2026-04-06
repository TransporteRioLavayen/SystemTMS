// =============================================================================
// BARCODE SERVICE - BACKEND
// =============================================================================
// Servicio de generación de códigos de barras y QR usando estándar GS1
// 
// Estándares soportados:
// - GS1-128: Códigos logísticos (SSCC, GTIN + atributos)
// - QR Code: Códigos 2D para móvil
// - EAN-13: Identificación de productos
// - DataMatrix: Códigos 2D para trazabilidad
//
// Uso:
//   import { barcodeService } from './barcode.service';
//   const image = await barcodeService.generateBarcode({ type: 'gs1-128', value: '(00)123456789012345675' });

import bwipjs from 'bwip-js';

// =============================================================================
// TIPOS
// =============================================================================

export type BarcodeSymbology = 'gs1-128' | 'qr' | 'datamatrix' | 'ean13' | 'code128';
export type EntityType = 'hoja-ruta' | 'remito' | 'deposito' | 'unidad';

export interface BarcodeOptions {
  type: BarcodeSymbology;
  value: string;
  size?: number;        // escala (default: 3)
  height?: number;      // altura en mm (default: 10)
  showText?: boolean;   // mostrar texto (default: true)
  alt?: string;         // texto alternativo
}

export interface GenerateBarcodeResult {
  type: BarcodeSymbology;
  code: string;
  humanReadable: string;
  entityType: EntityType;
  entityId: string;
  imageBuffer: Buffer;
}

// =============================================================================
// SSCC GENERATOR
// =============================================================================
// SSCC: Serial Shipping Container Code (18 dígitos)
// Estructura: extensión(1) + prefijo(7) + serial(9) + check(1)

export class SSCCGenerator {
  private readonly companyPrefix: string;
  private readonly extensionDigit: string;

  constructor(companyPrefix?: string, extensionDigit?: string) {
    this.companyPrefix = companyPrefix || process.env.GS1_COMPANY_PREFIX || '1234567';
    this.extensionDigit = extensionDigit || process.env.GS1_EXTENSION_DIGIT || '0';
  }

  /**
   * Genera un SSCC único a partir de un ID
   * @param id - UUID o identificador único de la entidad
   */
  generateFromId(id: string): string {
    // Extraer solo dígitos del ID y tomar los primeros 9
    const digits = id.replace(/[^0-9]/g, '').slice(0, 9);
    const serialRef = digits.padStart(9, '0');
    
    return this.generate(serialRef);
  }

  /**
   * Genera un SSCC a partir de una referencia serial
   * @param serialReference - Referencia serial (máx 9 dígitos)
   */
  generate(serialReference: string): string {
    const serial = serialReference.slice(0, 9).padStart(9, '0');
    const withoutCheck = `${this.extensionDigit}${this.companyPrefix}${serial}`;
    const checkDigit = this.calculateCheckDigit(withoutCheck);
    
    return withoutCheck + checkDigit;
  }

  /**
   * Calcula el dígito verificador usando algoritmo módulo 10
   * con pesos 3, 1, 3, 1...
   */
  private calculateCheckDigit(input: string): number {
    let sum = 0;
    
    for (let i = 0; i < input.length; i++) {
      const digit = parseInt(input[i], 10);
      const weight = (input.length - i) % 2 === 0 ? 3 : 1;
      sum += digit * weight;
    }
    
    const remainder = sum % 10;
    return remainder === 0 ? 0 : 10 - remainder;
  }

  /**
   * Valida un SSCC (verifica el dígito verificador)
   */
  validate(sscc: string): boolean {
    if (sscc.length !== 18) return false;
    
    const withoutCheck = sscc.slice(0, 17);
    const checkDigit = parseInt(sscc[17], 10);
    
    return this.calculateCheckDigit(withoutCheck) === checkDigit;
  }

  /**
   * Formatea SSCC para display legible
   * Formato: 0 2345678 901234567 5
   */
  format(sscc: string): string {
    if (sscc.length === 18) {
      return `${sscc[0]} ${sscc.slice(1, 8)} ${sscc.slice(8, 17)} ${sscc[17]}`;
    }
    return sscc;
  }

  /**
   * Retorna el AI (Application Identifier) para SSCC
   */
  static get AI(): string {
    return '(00)';
  }
}

// =============================================================================
// GLN GENERATOR
// =============================================================================
// GLN: Global Location Number (13 dígitos)
// Estructura: prefijo(7) + ubicación(5) + check(1)

export class GLNGenerator {
  private readonly companyPrefix: string;

  constructor(companyPrefix?: string) {
    this.companyPrefix = companyPrefix || process.env.GS1_COMPANY_PREFIX || '1234567';
  }

  /**
   * Genera un GLN único a partir de un ID
   */
  generateFromId(id: string): string {
    const digits = id.replace(/[^0-9]/g, '').slice(0, 5);
    const locRef = digits.padStart(5, '0');
    
    return this.generate(locRef);
  }

  /**
   * Genera un GLN a partir de una referencia de ubicación
   */
  generate(locationReference: string): string {
    const locRef = locationReference.slice(0, 5).padStart(5, '0');
    const withoutCheck = `${this.companyPrefix}${locRef}`;
    const checkDigit = this.calculateCheckDigit(withoutCheck);
    
    return withoutCheck + checkDigit;
  }

  private calculateCheckDigit(input: string): number {
    let sum = 0;
    
    for (let i = 0; i < input.length; i++) {
      const digit = parseInt(input[i], 10);
      const weight = (input.length - i) % 2 === 0 ? 3 : 1;
      sum += digit * weight;
    }
    
    const remainder = sum % 10;
    return remainder === 0 ? 0 : 10 - remainder;
  }

  validate(gln: string): boolean {
    if (gln.length !== 13) return false;
    
    const withoutCheck = gln.slice(0, 12);
    const checkDigit = parseInt(gln[12], 10);
    
    return this.calculateCheckDigit(withoutCheck) === checkDigit;
  }

  format(gln: string): string {
    if (gln.length === 13) {
      return `${gln.slice(0, 7)} ${gln.slice(7, 12)} ${gln[12]}`;
    }
    return gln;
  }

  static get AI(): string {
    return '(414)';
  }
}

// =============================================================================
// EAN-13 GENERATOR
// =============================================================================

export class EAN13Generator {
  /**
   * Genera un EAN-13 a partir de un ID
   */
  generateFromId(id: string): string {
    const base = id.replace(/[^0-9]/g, '').slice(0, 12);
    const padded = base.padStart(12, '0');
    const checkDigit = this.calculateCheckDigit(padded);
    
    return padded + checkDigit;
  }

  private calculateCheckDigit(input: string): number {
    let sum = 0;
    
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(input[i], 10);
      const weight = i % 2 === 0 ? 1 : 3;
      sum += digit * weight;
    }
    
    const remainder = sum % 10;
    return remainder === 0 ? 0 : 10 - remainder;
  }

  validate(ean: string): boolean {
    if (ean.length !== 13) return false;
    
    const withoutCheck = ean.slice(0, 12);
    const checkDigit = parseInt(ean[12], 10);
    
    return this.calculateCheckDigit(withoutCheck) === checkDigit;
  }
}

// =============================================================================
// BARCODE GENERATOR (MAIN SERVICE)
// =============================================================================

export class BarcodeGeneratorService {
  private readonly ssccGenerator: SSCCGenerator;
  private readonly glnGenerator: GLNGenerator;
  private readonly ean13Generator: EAN13Generator;

  constructor() {
    this.ssccGenerator = new SSCCGenerator();
    this.glnGenerator = new GLNGenerator();
    this.ean13Generator = new EAN13Generator();
  }

  /**
   * Genera código de barras usando bwip-js
   */
  async generateBarcode(options: BarcodeOptions): Promise<Buffer> {
    const {
      type,
      value,
      size = 3,
      height = 10,
      showText = true,
      alt
    } = options;

    // Mapeo de tipos a symbologies de bwip-js
    const bcidMap: Record<BarcodeSymbology, string> = {
      'gs1-128': 'gs1-128',
      'ean13': 'ean13',
      'code128': 'code128',
      'qr': 'qrcode',
      'datamatrix': 'datamatrix',
    };

    // Para GS1-128, agregar AI si no está presente
    let textToEncode = value;
    if (type === 'gs1-128' && !value.startsWith('(')) {
      // Asumir que es SSCC sin AI
      textToEncode = `(00)${value}`;
    }

    const png = await bwipjs.toBuffer({
      bcid: bcidMap[type] || 'gs1-128',
      text: textToEncode,
      scale: size,
      height: height,
      includetext: showText,
      textxalign: 'center',
      alttext: alt || value,
    });

    return png;
  }

  /**
   * Genera código QR (alternativa a GS1-128 para móvil)
   */
  async generateQR(value: string, size: number = 3): Promise<Buffer> {
    return this.generateBarcode({
      type: 'qr',
      value,
      size,
      showText: false,
    });
  }

  /**
   * Genera SSCC para una hoja de ruta
   */
  generateSSCC(hojaRutaId: string): string {
    return this.ssccGenerator.generateFromId(hojaRutaId);
  }

  /**
   * Genera GLN para un depósito
   */
  generateGLN(depositoId: string): string {
    return this.glnGenerator.generateFromId(depositoId);
  }

  /**
   * Genera EAN-13 para una unidad
   */
  generateEAN13(unidadId: string): string {
    return this.ean13Generator.generateFromId(unidadId);
  }

  /**
   * Valida un SSCC
   */
  validateSSCC(sscc: string): boolean {
    return this.ssccGenerator.validate(sscc);
  }

  /**
   * Valida un GLN
   */
  validateGLN(gln: string): boolean {
    return this.glnGenerator.validate(gln);
  }

  /**
   * Formatea SSCC para display
   */
  formatSSCC(sscc: string): string {
    return this.ssccGenerator.format(sscc);
  }

  /**
   * Formatea GLN para display
   */
  formatGLN(gln: string): string {
    return this.glnGenerator.format(gln);
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const barcodeService = new BarcodeGeneratorService();
export default barcodeService;
