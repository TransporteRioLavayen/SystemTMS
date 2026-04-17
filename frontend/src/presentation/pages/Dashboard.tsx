import React, { useState } from 'react';
import { 
  TrendingUp, TrendingDown, Users, Truck, Package, FileText, 
  AlertCircle, Calendar, Download, RefreshCw, BarChart3, PieChart as PieChartIcon,
  Warehouse, DollarSign, Clock, CheckCircle, XCircle, Activity,
  MapPin, Phone, Mail, Car
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, BarChart as ReBarChart, Bar, Cell, 
  PieChart as RePieChart, Pie, Legend
} from 'recharts';

import { useAnalytics } from '../../application/hooks/useAnalytics';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { LiveDot } from '../../components/ui/RealtimeIndicator';

import { LABELS } from '../../application/constants/labels';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function Dashboard() {
  const { resumen, stats, flota, hojasRuta, choferes, terceros, alertas, loading, error, refresh } = useAnalytics();
  const [dateRange, setDateRange] = useState({ 
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  if (loading && !resumen) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={() => refresh()} />;

  const { dashboard: d } = LABELS;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format number
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('es-AR').format(value);
  };

  // Get alert badge color
  const getAlertColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta': return 'bg-red-100 text-red-700 border-red-200';
      case 'media': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{d.title}</h1>
            <LiveDot />
          </div>
          <p className="text-sm text-gray-500 mt-1">Panel de control profesional - Transporte Río Lavayen</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200">
            <input 
              type="date" 
              className="bg-transparent border-none text-xs p-1 focus:ring-0 cursor-pointer"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />
            <span className="text-gray-400 px-1 text-xs">─</span>
            <input 
              type="date" 
              className="bg-transparent border-none text-xs p-1 focus:ring-0 cursor-pointer"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => refresh(dateRange.start, dateRange.end)} className="gap-2">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> {LABELS.common.actions.refresh}
          </Button>
          <Button variant="default" size="sm" className="gap-2">
            <Download size={14} /> {LABELS.common.actions.downloadPdf}
          </Button>
        </div>
      </div>

      {/* KPI Section - Resumen Ejecutivo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Remitos Hoy */}
        <KPICard 
          title="Remitos Hoy" 
          value={resumen?.remitosHoy || 0}
          icon={<Package className="text-blue-600" />} 
          trend={resumen?.variacionRemitos}
          trendLabel="vs ayer"
        />
        
        {/* Valor Declarado Mes */}
        <KPICard 
          title="Valor Declarado" 
          value={formatCurrency(resumen?.valorDeclaradoEsteMes || 0)}
          subtitle="Este mes"
          icon={<DollarSign className="text-emerald-600" />} 
        />

        {/* Entregas Este Mes */}
        <KPICard 
          title="Entregas" 
          value={`${resumen?.entregasExitosas || 0}`}
          subtitle={`${((resumen?.tasaEntrega || 0) * 100).toFixed(1)}% tasa`}
          icon={<CheckCircle className="text-green-600" />} 
        />

        {/* Flota Disponible */}
        <KPICard 
          title="Flota Disponible" 
          value={`${resumen?.flotaDisponible || 0} / ${resumen?.flotaTotal || 0}`}
          subtitle={`${((resumen?.utilizacionFlota || 0) * 100).toFixed(0)}% utilizado`}
          icon={<Truck className="text-indigo-600" />} 
        />
      </div>

      {/* Segunda fila de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hojas de Ruta Hoy */}
        <KPICard 
          title="Hojas de Ruta" 
          value={resumen?.hojasHoy || 0}
          subtitle="Hoy"
          icon={<FileText className="text-amber-600" />} 
        />

        {/* Choferes Disponibles */}
        <KPICard 
          title="Choferes" 
          value={resumen?.choferesDisponibles || 0}
          subtitle="Disponibles"
          icon={<Users className="text-cyan-600" />} 
        />

        {/* Terceros Activos */}
        <KPICard 
          title="Terceros" 
          value={resumen?.tercerosActivos || 0}
          subtitle="Unidades externas"
          icon={<Car className="text-purple-600" />} 
        />

        {/* Consultas Pendientes */}
        <KPICard 
          title="Consultas" 
          value={resumen?.consultasPendientes || 0}
          subtitle="Pendientes"
          icon={<Mail className="text-pink-600" />} 
        />
      </div>

      {/* Charts Section - Análisis Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Line Chart */}
        <Card className="lg:col-span-2 shadow-sm border-gray-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base font-bold">Tendencia de Remitos</CardTitle>
              <CardDescription>Últimos 30 días</CardDescription>
            </div>
            <BarChart3 size={18} className="text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.last30DaysTrend || []}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelFormatter={(value) => new Date(value).toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                    name="Remitos"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Breakdown Pie Chart */}
        <Card className="shadow-sm border-gray-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base font-bold">Estado de Remitos</CardTitle>
              <CardDescription>Distribución actual</CardDescription>
            </div>
            <PieChartIcon size={18} className="text-gray-400" />
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={stats?.distribucionEstado || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="estado"
                  >
                    {stats?.distribucionEstado.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2 w-full">
              {stats?.distribucionEstado.map((e, index) => (
                <div key={e.estado} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-xs text-gray-600 truncate">{e.estado}</span>
                  <span className="text-xs font-bold text-gray-900 ml-auto">{e.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tercera fila - Flota y Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Flota Analytics */}
        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Estado de Flota</CardTitle>
                <CardDescription>Unidades propias y terceros</CardDescription>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {flota?.totalUnidades || 0} unidades
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-emerald-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Disponibles</p>
                <p className="text-xl font-bold text-emerald-600">{flota?.disponibles || 0}</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">En Ruta</p>
                <p className="text-xl font-bold text-blue-600">{flota?.enRuta || 0}</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Mantenim.</p>
                <p className="text-xl font-bold text-red-600">{flota?.mantenimiento || 0}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Fuera</p>
                <p className="text-xl font-bold text-gray-600">{flota?.fueraDeServicio || 0}</p>
              </div>
            </div>

            {/* Utilization Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1.5 px-1">
                <span className="font-medium text-gray-600">Utilización de Flota</span>
                <span className="font-bold text-blue-700">{Math.round((flota?.utilizacionPorcentaje || 0) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-1000" 
                  style={{ width: `${(flota?.utilizacionPorcentaje || 0) * 100}%` }} 
                />
              </div>
            </div>

            {/* Por Tipo de Servicio */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-3 px-1">Por Tipo de Servicio</p>
              <div className="grid grid-cols-2 gap-3">
                {flota?.porTipoServicio.map((t, idx) => (
                  <div key={t.tipo} className="flex flex-col p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600 capitalize">{t.tipo.replace('_', ' ')}</span>
                      <span className="font-bold">{t.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="h-1.5 rounded-full" 
                        style={{ 
                          width: `${(t.count / (flota?.totalUnidades || 1)) * 100}%`,
                          backgroundColor: COLORS[idx % COLORS.length]
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alertas y Vencimientos */}
        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold">Alertas y Vencimientos</CardTitle>
              <Badge variant="secondary" className={`${alertas.length > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {alertas.length}
              </Badge>
            </div>
            <CardDescription>Próximos 30 días</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[350px] overflow-y-auto">
              {alertas.length > 0 ? alertas.slice(0, 10).map(alerta => (
                <div key={alerta.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                  <div className={`mt-0.5 p-1.5 rounded-md ${alerta.prioridad === 'alta' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                    <AlertCircle size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">{alerta.descripcion}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${getAlertColor(alerta.prioridad)}`}>
                        {alerta.prioridad.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <Calendar size={10} /> Vence: {new Date(alerta.fechaVencimiento).toLocaleDateString('es-AR')} ({alerta.diasRestantes} días)
                    </p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <CheckCircle size={40} className="mx-auto text-green-500 mb-2" />
                  <p className="text-sm text-gray-500">No hay alertas pendientes</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cuarta fila - Choferes y Terceros */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Choferes */}
        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Estado de Choferes</CardTitle>
                <CardDescription>Personal propio</CardDescription>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {choferes?.totalChoferes || 0} total
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-emerald-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Disponibles</p>
                <p className="text-xl font-bold text-emerald-600">{choferes?.disponibles || 0}</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">En Ruta</p>
                <p className="text-xl font-bold text-blue-600">{choferes?.enRuta || 0}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Inactivos</p>
                <p className="text-xl font-bold text-gray-600">{choferes?.inactivos || 0}</p>
              </div>
            </div>

            {/* Licencias por vencer */}
            {choferes?.licenciasPorVencer && choferes.licenciasPorVencer.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2 px-1">Licencias por vencer</p>
                <div className="space-y-2">
                  {choferes.licenciasPorVencer.slice(0, 3).map(lic => (
                    <div key={lic.id} className="flex items-center justify-between p-2 bg-amber-50 rounded-lg border border-amber-100">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{lic.nombre}</p>
                        <p className="text-xs text-gray-500">DNI: {lic.dni}</p>
                      </div>
                      <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                        {lic.diasRestantes} días
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Terceros (Flota Externa) */}
        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Flota Externa (Terceros)</CardTitle>
                <CardDescription>Unidades contratadas</CardDescription>
              </div>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                {terceros?.totalTerceros || 0} total
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-emerald-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Activos</p>
                <p className="text-xl font-bold text-emerald-600">{terceros?.activos || 0}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Inactivos</p>
                <p className="text-xl font-bold text-gray-600">{terceros?.inactivos || 0}</p>
              </div>
            </div>

            {/* Por tipo de servicio */}
            {terceros?.porTipoServicio && terceros.porTipoServicio.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2 px-1">Por Tipo de Servicio</p>
                <div className="flex gap-2">
                  {terceros.porTipoServicio.map((t, idx) => (
                    <div key={t.tipo} className="flex-1 text-center p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 capitalize">{t.tipo.replace('_', ' ')}</p>
                      <p className="text-lg font-bold" style={{ color: COLORS[idx % COLORS.length] }}>{t.count}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alertas de terceros */}
            {terceros?.alertasActivas && terceros.alertasActivas > 0 && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-600" />
                  <span className="text-sm text-red-700 font-medium">
                    {terceros.alertasActivas} documento(s) por vencer
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hojas de Ruta Analytics */}
      {hojasRuta && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500">Total Hojas</p>
            <p className="text-2xl font-bold text-gray-900">{hojasRuta.totalHojas}</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500">Activas</p>
            <p className="text-2xl font-bold text-blue-600">{hojasRuta.hojasActivas}</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500">KM Totales</p>
            <p className="text-2xl font-bold text-green-600">{formatNumber(hojasRuta.kmTotales)}</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500">Cargas Entregadas</p>
            <p className="text-2xl font-bold text-emerald-600">{hojasRuta.cargasEntregadas}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente KPI Card
function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  trendLabel 
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string;
  icon: React.ReactNode; 
  trend?: number; 
  trendLabel?: string;
}) {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  return (
    <Card className="shadow-sm border-gray-100 group hover:shadow-md transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
        <CardTitle className="text-sm font-medium text-gray-500 group-hover:text-gray-700 transition-colors uppercase tracking-wider">
          {title}
        </CardTitle>
        <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-white transition-colors">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <div className="flex items-center mt-1 gap-2">
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-emerald-600' : isNegative ? 'text-red-600' : 'text-gray-400'}`}>
              {isPositive && <TrendingUp size={12} />}
              {isNegative && <TrendingDown size={12} />}
              <span>{isPositive ? '+' : ''}{trend.toFixed(1)}%</span>
              {trendLabel && <span className="text-gray-400 font-normal">{trendLabel}</span>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}