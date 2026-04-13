import { useState, useCallback } from 'react';
import { pricingCalculatorApi, CalculatePricingInput, PricingResult } from '../../infrastructure/api/pricing';

interface UsePricingCalculatorState {
  result: PricingResult | null;
  loading: boolean;
  error: string | null;
}

export const usePricingCalculator = () => {
  const [state, setState] = useState<UsePricingCalculatorState>({
    result: null,
    loading: false,
    error: null,
  });

  // Calcular precio
  const calculate = useCallback(async (input: CalculatePricingInput) => {
    setState({ result: null, loading: true, error: null });
    try {
      const result = await pricingCalculatorApi.calculate(input);
      setState({ result, loading: false, error: null });
      return result;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Error al calcular precio';
      setState({ result: null, loading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setState({ result: null, loading: false, error: null });
  }, []);

  return {
    result: state.result,
    loading: state.loading,
    error: state.error,
    calculate,
    reset,
  };
};
