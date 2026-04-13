import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Zone, Locality, TariffRate, CalculatorFactor, FormulaCalculo, zonesApi, localitiesApi, tariffRatesApi, calculatorFactorsApi, formulaCalculoApi } from '../../infrastructure/api/pricing';

interface PricingContextType {
  zones: Zone[];
  zonesLoading: boolean;
  zonesError: string | null;
  
  localities: Locality[];
  localitiesLoading: boolean;
  localitiesError: string | null;
  
  tariffs: TariffRate[];
  tariffsLoading: boolean;
  tariffsError: string | null;
  
  factors: CalculatorFactor[];
  factorsLoading: boolean;
  factorsError: string | null;
  
  formulas: FormulaCalculo[];
  formulasLoading: boolean;
  formulasError: string | null;

  // CRUD para zonas
  agregarZona: (data: any) => Promise<void>;
  actualizarZona: (id: string, data: any) => Promise<void>;
  eliminarZona: (id: string) => Promise<void>;

  // CRUD para localidades
  agregarLocalidad: (data: any) => Promise<void>;
  actualizarLocalidad: (id: string, data: any) => Promise<void>;
  eliminarLocalidad: (id: string) => Promise<void>;

  // CRUD para tarifas
  agregarTarifa: (data: any) => Promise<void>;
  actualizarTarifa: (id: string, data: any) => Promise<void>;
  eliminarTarifa: (id: string) => Promise<void>;
  obtenerVersionesTarifa: (cargoType: string, zone: number) => Promise<any[]>;

  // CRUD para factores
  agregarFactor: (data: any) => Promise<void>;
  actualizarFactor: (id: string, data: any) => Promise<void>;
  eliminarFactor: (id: string) => Promise<void>;

  // CRUD para fórmulas
  agregarFormula: (data: any) => Promise<void>;
  actualizarFormula: (id: string, data: any) => Promise<void>;
  eliminarFormula: (id: string) => Promise<void>;

  // Refresh
  refreshZones: () => Promise<void>;
  refreshLocalities: () => Promise<void>;
  refreshTariffs: () => Promise<void>;
  refreshFactors: () => Promise<void>;
  refreshFormulas: () => Promise<void>;
}

const PricingContext = createContext<PricingContextType | undefined>(undefined);

export const PricingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [zonesLoading, setZonesLoading] = useState(false);
  const [zonesError, setZonesError] = useState<string | null>(null);

  const [localities, setLocalities] = useState<Locality[]>([]);
  const [localitiesLoading, setLocalitiesLoading] = useState(false);
  const [localitiesError, setLocalitiesError] = useState<string | null>(null);

  const [tariffs, setTariffs] = useState<TariffRate[]>([]);
  const [tariffsLoading, setTariffsLoading] = useState(false);
  const [tariffsError, setTariffsError] = useState<string | null>(null);

  const [factors, setFactors] = useState<CalculatorFactor[]>([]);
  const [factorsLoading, setFactorsLoading] = useState(false);
  const [factorsError, setFactorsError] = useState<string | null>(null);

  const [formulas, setFormulas] = useState<FormulaCalculo[]>([]);
  const [formulasLoading, setFormulasLoading] = useState(false);
  const [formulasError, setFormulasError] = useState<string | null>(null);

  // Refresh Zones
  const refreshZones = useCallback(async () => {
    setZonesLoading(true);
    setZonesError(null);
    try {
      const data = await zonesApi.getAll();
      setZones(data);
    } catch (error: any) {
      console.error('Error loading zones:', error);
      setZonesError(error.message || 'Error al cargar zonas');
      setZones([]);
    } finally {
      setZonesLoading(false);
    }
  }, []);

  // Refresh Localities
  const refreshLocalities = useCallback(async () => {
    setLocalitiesLoading(true);
    setLocalitiesError(null);
    try {
      const data = await localitiesApi.getAll();
      setLocalities(data);
    } catch (error: any) {
      console.error('Error loading localities:', error);
      setLocalitiesError(error.message || 'Error al cargar localidades');
      setLocalities([]);
    } finally {
      setLocalitiesLoading(false);
    }
  }, []);

  // Refresh Tariffs
  const refreshTariffs = useCallback(async () => {
    setTariffsLoading(true);
    setTariffsError(null);
    try {
      const data = await tariffRatesApi.getAll();
      setTariffs(data);
    } catch (error: any) {
      console.error('Error loading tariffs:', error);
      setTariffsError(error.message || 'Error al cargar tarifas');
      setTariffs([]);
    } finally {
      setTariffsLoading(false);
    }
  }, []);

  // Refresh Factors
  const refreshFactors = useCallback(async () => {
    setFactorsLoading(true);
    setFactorsError(null);
    try {
      const data = await calculatorFactorsApi.getAll();
      setFactors(data);
    } catch (error: any) {
      console.error('Error loading factors:', error);
      setFactorsError(error.message || 'Error al cargar factores');
      setFactors([]);
    } finally {
      setFactorsLoading(false);
    }
  }, []);

  // Refresh Formulas
  const refreshFormulas = useCallback(async () => {
    setFormulasLoading(true);
    setFormulasError(null);
    try {
      const data = await formulaCalculoApi.getAll();
      setFormulas(data);
    } catch (error: any) {
      console.error('Error loading formulas:', error);
      setFormulasError(error.message || 'Error al cargar fórmulas');
      setFormulas([]);
    } finally {
      setFormulasLoading(false);
    }
  }, []);

  // Load all on mount
  useEffect(() => {
    refreshZones();
    refreshLocalities();
    refreshTariffs();
    refreshFactors();
    refreshFormulas();
  }, [refreshZones, refreshLocalities, refreshTariffs, refreshFactors, refreshFormulas]);

  // Zones CRUD
  const agregarZona = useCallback(async (data: any) => {
    await zonesApi.create(data);
    await refreshZones();
  }, [refreshZones]);

  const actualizarZona = useCallback(async (id: string, data: any) => {
    await zonesApi.update(id, data);
    await refreshZones();
  }, [refreshZones]);

  const eliminarZona = useCallback(async (id: string) => {
    await zonesApi.delete(id);
    await refreshZones();
  }, [refreshZones]);

  // Localities CRUD
  const agregarLocalidad = useCallback(async (data: any) => {
    await localitiesApi.create(data);
    await refreshLocalities();
  }, [refreshLocalities]);

  const actualizarLocalidad = useCallback(async (id: string, data: any) => {
    await localitiesApi.update(id, data);
    await refreshLocalities();
  }, [refreshLocalities]);

  const eliminarLocalidad = useCallback(async (id: string) => {
    await localitiesApi.delete(id);
    await refreshLocalities();
  }, [refreshLocalities]);

  // Tariffs CRUD
  const agregarTarifa = useCallback(async (data: any) => {
    await tariffRatesApi.create(data);
    await refreshTariffs();
  }, [refreshTariffs]);

  const actualizarTarifa = useCallback(async (id: string, data: any) => {
    await tariffRatesApi.update(id, data);
    await refreshTariffs();
  }, [refreshTariffs]);

  const eliminarTarifa = useCallback(async (id: string) => {
    await tariffRatesApi.delete(id);
    await refreshTariffs();
  }, [refreshTariffs]);

  const obtenerVersionesTarifa = useCallback(async (cargoType: string, zone: number) => {
    return await tariffRatesApi.getVersions(cargoType, zone);
  }, []);

  // Factors CRUD
  const agregarFactor = useCallback(async (data: any) => {
    await calculatorFactorsApi.create(data);
    await refreshFactors();
  }, [refreshFactors]);

  const actualizarFactor = useCallback(async (id: string, data: any) => {
    await calculatorFactorsApi.update(id, data);
    await refreshFactors();
  }, [refreshFactors]);

  const eliminarFactor = useCallback(async (id: string) => {
    await calculatorFactorsApi.delete(id);
    await refreshFactors();
  }, [refreshFactors]);

  // Formulas CRUD
  const agregarFormula = useCallback(async (data: any) => {
    await formulaCalculoApi.create(data);
    await refreshFormulas();
  }, [refreshFormulas]);

  const actualizarFormula = useCallback(async (id: string, data: any) => {
    await formulaCalculoApi.update(id, data);
    await refreshFormulas();
  }, [refreshFormulas]);

  const eliminarFormula = useCallback(async (id: string) => {
    await formulaCalculoApi.delete(id);
    await refreshFormulas();
  }, [refreshFormulas]);

  const value: PricingContextType = {
    zones,
    zonesLoading,
    zonesError,
    localities,
    localitiesLoading,
    localitiesError,
    tariffs,
    tariffsLoading,
    tariffsError,
    factors,
    factorsLoading,
    factorsError,
    formulas,
    formulasLoading,
    formulasError,
    agregarZona,
    actualizarZona,
    eliminarZona,
    agregarLocalidad,
    actualizarLocalidad,
    eliminarLocalidad,
    agregarTarifa,
    actualizarTarifa,
    eliminarTarifa,
    obtenerVersionesTarifa,
    agregarFactor,
    actualizarFactor,
    eliminarFactor,
    agregarFormula,
    actualizarFormula,
    eliminarFormula,
    refreshZones,
    refreshLocalities,
    refreshTariffs,
    refreshFactors,
    refreshFormulas,
  };

  return <PricingContext.Provider value={value}>{children}</PricingContext.Provider>;
};

export const usePricing = () => {
  const context = useContext(PricingContext);
  if (!context) {
    throw new Error('usePricing debe usarse dentro de PricingProvider');
  }
  return context;
};
