import React, { useState } from 'react';
import { X, RefreshCw, Clock } from 'lucide-react';

interface TariffVersion {
  id: string;
  version: number;
  cargoType: string;
  zone: number;
  baseTariff: number;
  validFrom: string;
  validTo: string;
  estado: 'activo' | 'inactivo';
  createdAt: string;
  updatedAt: string;
}

interface HistorialTarifasModalProps {
  isOpen: boolean;
  onClose: () => void;
  tarifId: string;
  versions: TariffVersion[];
  onRestore: (versionData: any) => Promise<void>;
}

export default function HistorialTarifasModal({
  isOpen,
  onClose,
  tarifId,
  versions,
  onRestore,
}: HistorialTarifasModalProps) {
  const [restoring, setRestoring] = useState(false);

  if (!isOpen) return null;

  const sortedVersions = [...versions].sort((a, b) => b.version - a.version);

  const handleRestore = async (version: TariffVersion) => {
    if (confirm(`¿Desea restaurar la versión ${version.version} (tarifa $${version.baseTariff})?`)) {
      try {
        setRestoring(true);
        await onRestore({
          cargoType: version.cargoType,
          zone: version.zone,
          baseTariff: version.baseTariff,
          validFrom: new Date().toISOString(),
          validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        });
      } finally {
        setRestoring(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Historial de Versiones</h3>
            <p className="text-xs text-gray-500 mt-1">Total de versiones: {versions.length}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {versions.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>No hay versiones disponibles</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Timeline */}
              <div className="relative">
                {sortedVersions.map((version, index) => (
                  <div key={version.id} className="flex gap-4 pb-8 last:pb-0">
                    {/* Timeline marker */}
                    <div className="flex flex-col items-center">
                      <div className={`w-4 h-4 rounded-full border-4 ${
                        version.estado === 'activo'
                          ? 'bg-green-500 border-green-100'
                          : 'bg-gray-300 border-gray-100'
                      }`} />
                      {index < sortedVersions.length - 1 && (
                        <div className="w-0.5 h-20 bg-gray-200 mt-2" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-1">
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        {/* Version header */}
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              Versión {version.version}
                              {version.estado === 'activo' && (
                                <span className="ml-2 inline-block px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                  Activa
                                </span>
                              )}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <Clock size={12} />
                              Creada: {new Date(version.createdAt).toLocaleString('es-AR')}
                            </p>
                          </div>
                        </div>

                        {/* Version details */}
                        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                          <div>
                            <p className="text-gray-600">Tipo de Carga</p>
                            <p className="font-medium text-gray-900">{version.cargoType}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Zona</p>
                            <p className="font-medium text-gray-900">Zona {version.zone}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Tarifa Base</p>
                            <p className="font-semibold text-gray-900 text-lg">${version.baseTariff.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Vigencia</p>
                            <p className="text-xs text-gray-900">
                              {new Date(version.validFrom).toLocaleDateString('es-AR')} al{' '}
                              {new Date(version.validTo).toLocaleDateString('es-AR')}
                            </p>
                          </div>
                        </div>

                        {/* Restore button */}
                        {version.estado === 'inactivo' && (
                          <button
                            onClick={() => handleRestore(version)}
                            disabled={restoring}
                            className="w-full px-3 py-2 bg-blue-50 hover:bg-blue-100 disabled:bg-gray-50 text-blue-700 disabled:text-gray-400 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <RefreshCw size={14} />
                            {restoring ? 'Restaurando...' : 'Restaurar esta versión'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
