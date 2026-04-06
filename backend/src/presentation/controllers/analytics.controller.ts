// =============================================================================
// CONTROLLER: ANALYTICS
// =============================================================================
// Presentation Layer - Controlador HTTP para el módulo de analíticas

import { Request, Response, NextFunction } from 'express';
import { GetDashboardStatsUseCase } from '../../application/use-cases/analytics/get-dashboard-stats.use-case';
import { GetRemitosAnalyticsUseCase } from '../../application/use-cases/analytics/get-remitos-analytics.use-case';
import { GetFlotaAnalyticsUseCase } from '../../application/use-cases/analytics/get-flota-analytics.use-case';
import { GetTendenciaAnalyticsUseCase } from '../../application/use-cases/analytics/get-tendencia-analytics.use-case';
import { GetAlertasAnalyticsUseCase } from '../../application/use-cases/analytics/get-alertas-analytics.use-case';
import { analyticsRepository } from '../../infrastructure/repositories/supabase-analytics.repository';

// Instancias de use cases
const getDashboardStatsUseCase = new GetDashboardStatsUseCase(analyticsRepository);
const getRemitosAnalyticsUseCase = new GetRemitosAnalyticsUseCase(analyticsRepository);
const getFlotaAnalyticsUseCase = new GetFlotaAnalyticsUseCase(analyticsRepository);
const getTendenciaAnalyticsUseCase = new GetTendenciaAnalyticsUseCase(analyticsRepository);
const getAlertasUseCase = new GetAlertasAnalyticsUseCase(analyticsRepository);

export class AnalyticsController {
  
  private parseDates(req: Request) {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(String(startDate)) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(String(endDate)) : new Date();
    return { start, end };
  }

  /**
   * GET /api/analytics/dashboard
   */
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const { start, end } = this.parseDates(req);
      const stats = await getDashboardStatsUseCase.execute(start, end);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/remitos
   */
  async getRemitos(req: Request, res: Response, next: NextFunction) {
    try {
      const { start, end } = this.parseDates(req);
      const stats = await getRemitosAnalyticsUseCase.execute(start, end);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/flota
   */
  async getFlota(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await getFlotaAnalyticsUseCase.execute();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/tendencias
   */
  async getTendencias(req: Request, res: Response, next: NextFunction) {
    try {
      const { start, end } = this.parseDates(req);
      const stats = await getTendenciaAnalyticsUseCase.execute(start, end);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/alertas
   */
  async getAlertas(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await getAlertasUseCase.execute();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
