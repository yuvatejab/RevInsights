/**
 * Type declarations for the Retail Sales & Staffing Analyzer.
 */

export interface SalesRecord {
  Month: number;
  Staff_Count: number;
  Total_Sales: number;
  [key: string]: number; // Allows indexing sp1, sp2, etc.
}

export interface ValidationIssue {
  type: "missing" | "duplicate" | "negative" | "outlier";
  severity: "high" | "medium" | "low";
  message: string;
  location: string;
  remedy: string;
}

export interface SalespersonStats {
  id: string;
  name: string;
  activeMonths: number;
  totalSales: number;
  avgMonthlySales: number;
  netMonthlyContribution: number;
  isProfitable: boolean;
}

export interface ForecastPoint {
  month: number;
  historical?: number;
  sma?: number;
  ema?: number;
  isForecast: boolean;
}

export interface SimulationResult {
  staffCount: number;
  estMonthlySales: number;
  est6MSales: number;
  est6MSalaries: number;
  est6MCommissions: number;
  est6MGrossMargin: number;
  varianceVsBaseline: number;
}
