// =============================================================================
// SSCC BADGE - FRONTEND
// =============================================================================
// Componente para mostrar SSCC (Serial Shipping Container Code)
// con opción de copiar al portapapeles y mostrar código de barras
//
// Uso:
//   <SSCCBadge sscc="012345678901234567" />
//   <SSCCBadge sscc="012345678901234567" showBarcode />

import { useState } from 'react';
import { Copy, Check, QrCode, Barcode } from 'lucide-react';
import { BarcodeDisplay, BarcodeSymbology } from './BarcodeDisplay';

interface SSCCBadgeProps {
  sscc?: string | null;
  showBarcode?: boolean;
  showQR?: boolean;
  copyable?: boolean;
  size?: number;
  className?: string;
}

export function SSCCBadge({
  sscc,
  showBarcode = false,
  showQR = false,
  copyable = true,
  size = 3,
  className = ''
}: SSCCBadgeProps) {
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);

  // Si no hay SSCC, mostrar placeholder
  if (!sscc) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md ${className}`}>
        <Barcode size={16} className="text-gray-400" />
        <span className="text-sm font-mono text-gray-500">Sin SSCC</span>
      </div>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sscc);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  // Formatear SSCC para display legible
  // Formato: 0 2345678 901234567 5
  const formatSSCC = (code: string): string => {
    if (!code || typeof code !== 'string') return '—';
    if (code.length === 18) {
      return `${code[0]} ${code.slice(1, 8)} ${code.slice(8, 17)} ${code[17]}`;
    }
    return code;
  };

  return (
    <div className={`inline-flex flex-col ${className}`}>
      {/* Badge principal */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-md">
        <Barcode size={16} className="text-blue-600" />
        <span className="text-sm font-mono font-semibold text-blue-800">
          SSCC: {formatSSCC(sscc)}
        </span>
        
        {copyable && (
          <button
            onClick={handleCopy}
            className="p-1 hover:bg-blue-100 rounded transition-colors"
            title={copied ? 'Copiado!' : 'Copiar SSCC'}
          >
            {copied ? (
              <Check size={14} className="text-green-600" />
            ) : (
              <Copy size={14} className="text-blue-600" />
            )}
          </button>
        )}

        {(showBarcode || showQR) && (
          <button
            onClick={() => setShowCode(!showCode)}
            className="p-1 hover:bg-blue-100 rounded transition-colors"
            title={showCode ? 'Ocultar código' : 'Ver código'}
          >
            {showQR ? (
              <QrCode size={14} className="text-blue-600" />
            ) : (
              <Barcode size={14} className="text-blue-600" />
            )}
          </button>
        )}
      </div>

      {/* Código de barras o QR */}
      {showCode && (
        <div className="mt-2 p-3 bg-white border border-blue-200 rounded-md">
          <BarcodeDisplay 
            type={showQR ? 'qr' : 'gs1-128'}
            value={sscc}
            size={size}
            alt={`SSCC: ${formatSSCC(sscc)}`}
          />
        </div>
      )}
    </div>
  );
}

export default SSCCBadge;
