import React, { useState } from 'react';
import { 
  TrendingUp, Users, Truck, FileText, AlertCircle, 
  Calendar, Download, RefreshCw, BarChart, PieChart, Info
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, BarChart as ReBarChart, Bar, Cell, PieChart as RePieChart, Pie 
} from 'recharts';

import { useAnalytics } from '../../application/hooks/useAnalytics';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { LiveDot } from '../../components/ui/RealtimeIndicator';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../../components/ui/tooltip';

import { LABELS } from '../../application/constants/labels';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Dashboard() {
  const { stats, remitosData, flotaData, alertas, loading, error, refresh } = useAnalytics();
  const [dateRange, setDateRange] = useState({ 
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  if (loading && !stats) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={() => refresh()} />;

  const { dashboard: d } = LABELS;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{d.title}</h1>
            <LiveDot />
          </div>
          <p className="text-sm text-gray-500 mt-1">{d.subtitle}</p>
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

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title={d.kpis.remitosHoy.title} 
          value={stats?.remitosHoy || 0} 
          icon={<FileText className="text-blue-600" />} 
          description={d.kpis.remitosHoy.description}
          trend="+12%" 
        />
        <KPICard 
          title={d.kpis.enCamino.title} 
          value={stats?.enCamino || 0} 
          icon={<Truck className="text-emerald-600" />} 
          description={d.kpis.enCamino.description}
        />
        <KPICard 
          title={d.kpis.entregadosMes.title} 
          value={stats?.entregadosMes || 0} 
          icon={<Info className="text-amber-600" />} 
          description={d.kpis.entregadosMes.description}
        />
        <KPICard 
          title={d.kpis.tasaEntrega.title} 
          value={`${((stats?.tasaEntrega || 0) * 100).toFixed(1)}%`} 
          icon={<TrendingUp className="text-indigo-600" />} 
          description={d.kpis.tasaEntrega.description}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Line Chart */}
        <Card className="lg:col-span-2 shadow-sm border-gray-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base font-bold">{d.charts.trend.title}</CardTitle>
              <CardDescription>{d.charts.trend.description}</CardDescription>
            </div>
            <BarChart size={18} className="text-gray-400" />
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
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
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
              <CardTitle className="text-base font-bold">{d.charts.status.title}</CardTitle>
              <CardDescription>{d.charts.status.description}</CardDescription>
            </div>
            <PieChart size={18} className="text-gray-400" />
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={stats?.distribucionEstado || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
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
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 w-full">
                {stats?.distribucionEstado.map((e, index) => (
                  <div key={e.estado} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-xs text-gray-600 truncate">{e.estado}</span>
                    <span className="text-xs font-bold text-gray-900">{e.count}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lower Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts / Maintenance */}
        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold">{d.alerts.title}</CardTitle>
              <Badge variant="secondary" className="bg-red-50 text-red-600 border-none">{alertas.length}</Badge>
            </div>
            <CardDescription>{d.alerts.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alertas.length > 0 ? alertas.map(alerta => (
                <div key={alerta.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 group hover:border-gray-200 transition-colors">
                  <div className={`mt-0.5 p-1.5 rounded-md ${alerta.prioridad === 'alta' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                    <AlertCircle size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">{alerta.descripcion}</span>
                      <Badge variant="outline" className="text-[10px] h-4">{alerta.tipo.toUpperCase()}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <Calendar size={10} /> {d.alerts.expiresOn} {new Date(alerta.fechaVencimiento).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500">{d.alerts.noAlerts}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Fleet Utilization */}
        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <CardTitle className="text-base font-bold">{d.charts.fleet.title}</CardTitle>
            <CardDescription>{d.charts.fleet.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Disponibles</p>
                <div className="text-xl font-bold text-emerald-600">{flotaData?.disponibles || 0}</div>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">En Servicio</p>
                <div className="text-xl font-bold text-blue-600">{flotaData?.enServicio || 0}</div>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Mantenimiento</p>
                <div className="text-xl font-bold text-red-600">{flotaData?.mantenimiento || 0}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5 px-1">
                  <span className="font-medium text-gray-600">{d.charts.fleet.utilization}</span>
                  <span className="font-bold text-blue-700">{Math.round((flotaData?.utilizacion || 0) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000" 
                    style={{ width: `${(flotaData?.utilizacion || 0) * 100}%` }} 
                  />
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-3 px-1">Por Tipo de Servicio</p>
                <div className="grid grid-cols-2 gap-4">
                  {flotaData?.tiposServicio.map((t, idx) => (
                    <div key={t.tipo} className="flex flex-col">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600">{t.tipo}</span>
                        <span className="font-bold">{t.count}</span>
                      </div>
                      <div className="w-full bg-gray-50 rounded-full h-1.5">
                        <div 
                          className="h-1.5 rounded-full" 
                          style={{ 
                            width: `${(t.count / (flotaData?.enServicio + flotaData?.disponibles + flotaData?.mantenimiento)) * 100}%`,
                            backgroundColor: COLORS[idx % COLORS.length]
                          }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPICard({ title, value, icon, description, trend }: { title: string, value: string | number, icon: React.ReactNode, description: string, trend?: string }) {
  return (
    <Card className="shadow-sm border-gray-100 group hover:shadow-md transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
        <CardTitle className="text-sm font-medium text-gray-500 group-hover:text-gray-700 transition-colors uppercase tracking-wider">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-white transition-colors">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <div className="flex items-center mt-1">
          <p className="text-xs text-gray-400">{description}</p>
          {trend && (
            <span className="ml-auto text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
              {trend}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
