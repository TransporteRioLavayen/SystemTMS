import { type ChartConfig } from "../../../components/ui/chart";

export interface LocationPoint {
  city: string;
  lng: number;
  lat: number;
  size: number;
}

export interface BreakdownRow {
  label: string;
  value: number;
}

export const locations: LocationPoint[] = [
  { city: "Buenos Aires", lng: -58.3816, lat: -34.6037, size: 25 },
  { city: "Córdoba", lng: -64.1888, lat: -31.4201, size: 18 },
  { city: "Rosario", lng: -60.6393, lat: -32.9468, size: 15 },
  { city: "Mendoza", lng: -68.8458, lat: -32.8908, size: 12 },
  { city: "Tucumán", lng: -65.2226, lat: -26.8083, size: 10 },
  { city: "Salta", lng: -65.4117, lat: -24.7821, size: 8 },
  { city: "Neuquén", lng: -68.0591, lat: -38.9516, size: 9 },
];

export const usersPerDay: any[] = [];

export const usersPerDayChartConfig = {
  users: {
    label: "Movimientos",
    color: "var(--color-blue-500)",
  },
} satisfies ChartConfig;

export const deviceCategoryData: any[] = [];

export const deviceCategoryChartConfig = {
  desktop: { label: "Ocupado", color: "var(--color-blue-500)" },
  mobile: { label: "Libre", color: "var(--color-blue-400)" },
  tablet: { label: "Mantenimiento", color: "var(--color-blue-300)" },
} satisfies ChartConfig;

export const visitedPagesRows: BreakdownRow[] = [];

export const countriesRows: BreakdownRow[] = [];

export const referrersRows: BreakdownRow[] = [];

export const browsersRows: BreakdownRow[] = [];
