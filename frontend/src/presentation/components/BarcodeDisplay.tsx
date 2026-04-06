// =============================================================================
// BARCODE DISPLAY - FRONTEND
// =============================================================================
// Componente genérico para mostrar códigos de barras y QR
// 
// Uso:
//   <BarcodeDisplay type="gs1-128" value="123456789012345675" />
//   <BarcodeDisplay type="qr" value="https://..." />

import { useState, useEffect, useCallback } from 'react';

export type BarcodeSymbology = 'gs1-128' | 'qr' | 'datamatrix' | 'ean13' | 'code128';

interface BarcodeDisplayProps {
  type: BarcodeSymbology;
  value: string;
  size?: number;        // escala del código (default: 3)
  height?: number;       // altura en mm (default: 10)
  showText?: boolean;    // mostrar texto debajo (default: true)
  alt?: string;          // texto alternativo
  className?: string;
}

export function BarcodeDisplay({
  type,
  value,
  size = 3,
  height = 10,
  showText = true,
  alt,
  className = ''
}: BarcodeDisplayProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBarcode = useCallback(async () => {
    if (!value) {
      setError('No hay valor para generar código');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const params = new URLSearchParams({
        format: 'png',
        size: String(size),
        height: String(height),
        showText: String(showText),
      });

      // Mapear symbology a tipo de entidad
      const entityType = getEntityType(type);
      
      const response = await fetch(
        `${API_URL}/barcodes/${entityType}/${value}?${params.toString()}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Código no encontrado');
        }
        throw new Error('Error al generar código de barras');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [type, value, size, height, showText]);

  useEffect(() => {
    fetchBarcode();
  }, [fetchBarcode]);

  // Cleanup: revoke Object URL
  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  if (loading) {
    return (
      <div 
        className={`animate-pulse bg-gray-200 rounded ${className}`}
        style={{ width: '200px', height: '100px' }}
      />
    );
  }

  if (error) {
    return (
      <div className={`text-red-500 text-sm ${className}`}>
        {error}
      </div>
    );
  }

  return (
    <figure className={`flex flex-col items-center ${className}`}>
      {imageUrl && (
        <img
          src={imageUrl}
          alt={alt || value}
          className="max-w-full h-auto"
          style={{ 
            imageRendering: 'pixelated',
          }}
        />
      )}
      {showText && alt && (
        <figcaption className="text-xs text-gray-500 mt-1">
          {alt}
        </figcaption>
      )}
    </figure>
  );
}

// Mapear symbology a tipo de entidad para la API
function getEntityType(symbology: BarcodeSymbology): string {
  switch (symbology) {
    case 'qr':
      return 'hoja-ruta'; // QR principalmente para hojas de ruta
    case 'gs1-128':
    case 'code128':
      return 'hoja-ruta';
    case 'ean13':
      return 'deposito'; // GLN usa EAN-13 symbology
    default:
      return 'hoja-ruta';
  }
}

export default BarcodeDisplay;
