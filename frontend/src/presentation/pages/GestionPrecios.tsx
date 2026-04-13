import React, { useState } from 'react';
import { MapPin, AlertCircle, Zap, DollarSign, Calculator } from 'lucide-react';
import { PricingProvider } from '../../application/context/PricingContext';
import ZonesTab from './components/pricing/ZonesTab';
import LocalitiesTab from './components/pricing/LocalitiesTab';
import FactoresTab from './components/pricing/FactoresTab';
import TarifasTab from './components/pricing/TarifasTab';
import FormulasTab from './components/pricing/FormulasTab';

type TabType = 'zonas' | 'localidades' | 'tarifas' | 'factores' | 'formulas';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  description: string;
}

function GestionPreciosContent() {
  const [activeTab, setActiveTab] = useState<TabType>('zonas');

  const tabs: Tab[] = React.useMemo(() => [
    {
      id: 'zonas',
      label: 'Zonas',
      icon: <MapPin size={18} />,
      component: <ZonesTab />,
      description: 'Define las zonas de cobertura para tu operación logística'
    },
    {
      id: 'localidades',
      label: 'Localidades',
      icon: <AlertCircle size={18} />,
      component: <LocalitiesTab />,
      description: 'Organiza localidades dentro de zonas'
    },
    {
      id: 'tarifas',
      label: 'Tarifas',
      icon: <DollarSign size={18} />,
      component: <TarifasTab />,
      description: 'Gestiona tarifas con historial de versiones'
    },
    {
      id: 'factores',
      label: 'Factores',
      icon: <Zap size={18} />,
      component: <FactoresTab />,
      description: 'Factores de cálculo para tarifas dinámicas'
    },
    {
      id: 'formulas',
      label: 'Fórmulas',
      icon: <Calculator size={18} />,
      component: <FormulasTab />,
      description: 'Fórmulas del sistema para cálculo de cotizaciones'
    },
  ], []);

  const currentTab = tabs.find(t => t.id === activeTab) || tabs[0];

  return (
    <div className="space-y-6 relative h-full overflow-y-auto pr-2">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Precios</h1>
          <p className="text-sm text-gray-500 mt-1">Administra zonas, localidades, tarifas y factores de cálculo</p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard 
            icon={<MapPin size={24} />}
            title="Zonas"
            bgColor="bg-blue-100"
            iconColor="text-blue-600"
            value="Activa"
          />
          <MetricCard 
            icon={<AlertCircle size={24} />}
            title="Localidades"
            bgColor="bg-green-100"
            iconColor="text-green-600"
            value="Activa"
          />
          <MetricCard 
            icon={<DollarSign size={24} />}
            title="Tarifas"
            bgColor="bg-amber-100"
            iconColor="text-amber-600"
            value="Versionado"
          />
          <MetricCard 
            icon={<Zap size={24} />}
            title="Factores"
            bgColor="bg-purple-100"
            iconColor="text-purple-600"
            value="Activos"
          />
          <MetricCard 
            icon={<Calculator size={24} />}
            title="Fórmulas"
            bgColor="bg-cyan-100"
            iconColor="text-cyan-600"
            value="Disponibles"
          />
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border-b border-gray-200 rounded-t-lg">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Description */}
      <div className="px-6 py-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">{currentTab.description}</p>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        {currentTab.component}
      </div>
    </div>
  );
}

function MetricCard({ icon, title, bgColor, iconColor, value }: any) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-lg ${bgColor} ${iconColor}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">{title}</p>
          <p className="text-sm font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function GestionPrecios() {
  return (
    <PricingProvider>
      <GestionPreciosContent />
    </PricingProvider>
  );
}
