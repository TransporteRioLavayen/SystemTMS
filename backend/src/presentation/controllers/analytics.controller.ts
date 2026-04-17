// =============================================================================
// CONTROLLER: ANALYTICS
// =============================================================================
// Presentation Layer - Controlador HTTP para el módulo de analíticas

import { Request, Response, NextFunction } from 'express';
import { analyticsRepository } from '../../infrastructure/repositories/supabase-analytics.repository';
import { 
  DashboardStats, 
  RemitosAnalytics, 
  FlotaAnalytics, 
  TendenciaAnalytics, 
  AlertaMantenimiento,
  HojasRutaAnalytics,
  ChoferesAnalytics,
  TercerosAnalytics,
  DepositosAnalytics,
  ConsultasAnalytics,
  CotizacionesAnalytics,
  PlanillasAnalytics,
  ResumenEjecutivo
} from '../../domain/entities/analytics.entity';

export class AnalyticsController {
  
  private parseDates(req: Request) {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(String(startDate)) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(String(endDate)) : new Date();
    return { start, end };
  }

  /**
   * GET /api/analytics/dashboard
   * Estadísticas principales del dashboard
   */
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const { start, end } = this.parseDates(req);
      const stats = await analyticsRepository.getDashboardStats(start, end);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/remitos
   * Analytics detallados de remitos
   */
  async getRemitos(req: Request, res: Response, next: NextFunction) {
    try {
      const { start, end } = this.parseDates(req);
      const stats = await analyticsRepository.getRemitosAnalytics(start, end);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/flota
   * Analytics de flota (unidades propias)
   */
  async getFlota(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await analyticsRepository.getFlotaAnalytics();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/hojas-ruta
   * Analytics de hojas de ruta
   */
  async getHojasRuta(req: Request, res: Response, next: NextFunction) {
    try {
      const { start, end } = this.parseDates(req);
      const stats = await analyticsRepository.getHojasRutaAnalytics(start, end);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/choferes
   * Analytics de choferes
   */
  async getChoferes(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await analyticsRepository.getChoferesAnalytics();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/terceros
   * Analytics de terceros (flota externa)
   */
  async getTerceros(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await analyticsRepository.getTercerosAnalytics();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/depositos
   * Analytics de depósitos
   */
  async getDepositos(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await analyticsRepository.getDepositosAnalytics();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/consultas
   * Analytics de consultas
   */
  async getConsultas(req: Request, res: Response, next: NextFunction) {
    try {
      const { start, end } = this.parseDates(req);
      const stats = await analyticsRepository.getConsultasAnalytics(start, end);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/cotizaciones
   * Analytics de cotizaciones
   */
  async getCotizaciones(req: Request, res: Response, next: NextFunction) {
    try {
      const { start, end } = this.parseDates(req);
      const stats = await analyticsRepository.getCotizacionesAnalytics(start, end);
      res.json({ success: true, data: stats });
    } catch ( error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/planillas
   * Analytics de planillas
   */
  async getPlanillas(req: Request, res: Response, next: NextFunction) {
    try {
      const { start, end } = this.parseDates(req);
      const stats = await analyticsRepository.getPlanillasAnalytics(start, end);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/tendencias
   * Tendencias de remitos
   */
  async getTendencias(req: Request, res: Response, next: NextFunction) {
    try {
      const { start, end } = this.parseDates(req);
      const stats = await analyticsRepository.getTendenciaAnalytics(start, end);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/alertas
   * Alertas de mantenimiento y vencimientos
   */
  async getAlertas(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await analyticsRepository.getAlertasMantenimiento();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/resumen
   * Resumen ejecutivo para KPIs
   */
  async getResumen(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await analyticsRepository.getResumenEjecutivo();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();