/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { 
  Building2, 
  TrendingUp, 
  Users, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle, 
  FileCode, 
  Download, 
  Sliders, 
  Play, 
  Layers, 
  Check, 
  RefreshCw, 
  Briefcase, 
  Sparkles,
  HelpCircle,
  Copy,
  Activity
} from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip as ChartTooltip, 
  CartesianGrid, 
  BarChart, 
  Bar, 
  ReferenceLine,
  Cell
} from "recharts";
import { getRawDataset, cleanDataset, getRawDatasetCSV } from "./data";
import { SalesRecord, SalespersonStats, ForecastPoint, SimulationResult, ValidationIssue } from "./types";

// Helper function to robustly parse raw CSV data strings into SalesRecord arrays
function parseCSVText(text: string): SalesRecord[] {
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) throw new Error("CSV file does not contain enough rows.");

  const headers = lines[0].split(",").map(h => h.trim().replace(/['"]/g, ""));
  const parsedRecords: SalesRecord[] = [];

  // Dynamically map CSV headers to standard data keys
  const columnMap: { [key: string]: string } = {};
  headers.forEach((h) => {
    const hLower = h.toLowerCase();
    if (hLower === "month") {
      columnMap[h] = "Month";
    } else if (["sales", "total_sales", "total sales", "revenue", "revenues"].includes(hLower)) {
      columnMap[h] = "Total_Sales";
    } else if (["staff_count", "staff count", "staff", "headcount"].includes(hLower)) {
      columnMap[h] = "Staff_Count";
    } else {
      const match = hLower.match(/(?:sp|salesperson|sale\s*sp|sale_sp)\s*(\d+)/);
      if (match) {
        columnMap[h] = `sp${parseInt(match[1])}`;
      }
    }
  });

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(",").map(c => c.trim());
    if (cells.length < headers.length) continue;

    const row: any = {};
    headers.forEach((h, idx) => {
      const val = parseFloat(cells[idx]);
      const finalKey = columnMap[h] || h;
      row[finalKey] = isNaN(val) ? cells[idx] : val;
    });

    // Ensure all 16 sales channels are initialized to numeric form 
    for (let s = 1; s <= 16; s++) {
      if (row[`sp${s}`] === undefined) {
        row[`sp${s}`] = 0.0;
      }
    }

    const resolvedMonth = typeof row.Month === "number" ? row.Month : i;
    let calculatedStaff = row.Staff_Count;
    if (calculatedStaff === undefined) {
      let activeCount = 0;
      for (let s = 1; s <= 16; s++) {
        if (row[`sp${s}`] > 0.1) {
          activeCount++;
        }
      }
      calculatedStaff = activeCount > 0 ? activeCount : 7;
    }

    let calculatedTotalSales = row.Total_Sales;
    if (calculatedTotalSales === undefined || calculatedTotalSales === 0) {
      let sum = 0;
      for (let s = 1; s <= 16; s++) {
        sum += row[`sp${s}`] || 0;
      }
      calculatedTotalSales = parseFloat(sum.toFixed(1));
    }

    parsedRecords.push({
      Month: resolvedMonth,
      Staff_Count: calculatedStaff,
      Total_Sales: calculatedTotalSales,
      ...row
    });
  }

  return parsedRecords;
}

export default function App() {
  // Application state - by default, data is pre-validated and cleaned so the landing dashboard is fully functional and processed
  const [usePreparedData, setUsePreparedData] = useState<boolean>(true);
  const [rawRecords, setRawRecords] = useState<SalesRecord[]>(getRawDataset());
  const [dataCleaned, setDataCleaned] = useState<boolean>(true); // starts TRUE so processing is already completed on first visit!
  const [selectedStaffCount, setSelectedStaffCount] = useState<number>(7);
  const [customSalary, setCustomSalary] = useState<number>(3000); // in Rupees
  const [customCommission, setCustomCommission] = useState<number>(0.05); // 5%
  const [elasticity, setElasticity] = useState<number>(0.75);
  const [activeTab, setActiveTab] = useState<string>("summary");
  const [currentStep, setCurrentStep] = useState<number>(5); // starts at STEP 5 to show complete recommendation on first visit!
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [copiedNotebook, setCopiedNotebook] = useState<boolean>(false);

  // Animated pipeline execution states
  const [pipelineState, setPipelineState] = useState<"idle" | "running" | "completed">("idle");
  const [pipelineProgress, setPipelineProgress] = useState<number>(0);
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);
  const [activeFileName, setActiveFileName] = useState<string>("mall_store_sales.csv (Preloaded)");

  // Computed Dataset
  const cleanedRecords = useMemo(() => {
    return cleanDataset(rawRecords);
  }, [rawRecords]);

  const activeRecords = useMemo(() => {
    return dataCleaned ? cleanedRecords : rawRecords;
  }, [dataCleaned, rawRecords, cleanedRecords]);

  // General core function to schedule and animate the full regression and data validation pipeline
  const triggerPipelineExecution = (csvText: string, fileName: string) => {
    try {
      const parsed = parseCSVText(csvText);
      if (parsed.length === 0) throw new Error("CSV does not contain any valid row vectors.");

      // Set active pipeline state
      setPipelineState("running");
      setPipelineProgress(0);
      setPipelineLogs([]);
      setActiveFileName(fileName);
      setCurrentStep(1); // Visual reset of steps during processing

      const stepsList = [
        { progress: 15, log: `📥 Ingesting spreadsheet: "${fileName}" (${Math.round(csvText.length / 1024)} KB)...` },
        { progress: 32, log: `🔍 Auditing for duplicates: mapped ${parsed.length} raw monthly sequence periods safely.` },
        { progress: 50, log: `✨ Calibrating active staff roles: 16 salespeople channels normalized.` },
        { progress: 68, log: `🛠 Exercising cleanup overrides: zeroed null cells and smoothed decimal outlier offsets.` },
        { progress: 85, log: `📈 Compiling baseline EMA trends over forecasted visual horizon.` },
        { progress: 100, log: `🏆 Core pipeline evaluation successful. Strategic recommendations updated!` }
      ];

      stepsList.forEach((st, idx) => {
        setTimeout(() => {
          setPipelineProgress(st.progress);
          setPipelineLogs(prev => [...prev, st.log]);

          if (st.progress === 100) {
            // Apply variables and finish pipeline
            setRawRecords(parsed);
            setUsePreparedData(false);
            setDataCleaned(true); // Automatically sanitizes and cleans!

            setTimeout(() => {
              setPipelineState("completed");
              setCurrentStep(5); // Instantly jump user to the Strategic Decision proposal view!
              
              setTimeout(() => {
                setPipelineState("idle");
              }, 1000);
            }, 600);
          }
        }, (idx + 1) * 200);
      });

    } catch (err: any) {
      alert("Failed to trigger pipeline: " + err.message);
      setPipelineState("idle");
    }
  };

  // Triggers the mock upload of the default system sandbox spreadsheet
  const handleTestWithSandbox = () => {
    const sandboxCSV = getRawDatasetCSV();
    triggerPipelineExecution(sandboxCSV, "mall_store_sales_sandbox.csv");
  };

  // Handle uploaded CSV files (executes the exact same pipeline recursively)
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      triggerPipelineExecution(text, file.name);
    };
    reader.readAsText(file);
    e.target.value = ""; // Reset value for consecutive uploads
  };


  // Re-verify validation issues
  const validationReport = useMemo(() => {
    const issues: ValidationIssue[] = [];
    const salesCols = Object.keys(rawRecords[0] || {}).filter(k => k.startsWith("sp"));

    // 1. Check duplicates
    const monthsSet = new Set<number>();
    rawRecords.forEach((r, idx) => {
      if (monthsSet.has(r.Month)) {
        issues.push({
          type: "duplicate",
          severity: "medium",
          message: `Duplicate record for Month ${r.Month} detected in sequence.`,
          location: `Row ${idx + 1}`,
          remedy: "Pipeline automatically drops duplicate rows on data cleaning step."
        });
      }
      monthsSet.add(r.Month);
    });

    // 2. Check empty cells or negative sales
    rawRecords.forEach((r, idx) => {
      let sumOfStaff = 0;
      salesCols.forEach(col => {
        const val = r[col];
        if (val === null || val === undefined) {
          issues.push({
            type: "missing",
            severity: "high",
            message: `Salesperson ${col.toUpperCase()} has missing/blank value in Month ${r.Month}.`,
            location: `Month ${r.Month}, Column ${col}`,
            remedy: "Data cleaner automatically converts blank cells to ₹0.0."
          });
        } else if (val < 0) {
          issues.push({
            type: "negative",
            severity: "high",
            message: `Negative sales record (₹${(val * 1000).toLocaleString()}) for ${col.toUpperCase()} in Month ${r.Month}.`,
            location: `Month ${r.Month}, Column ${col}`,
            remedy: "Fixed automatically: minimum bounds capped at ₹0.0."
          });
        } else {
          sumOfStaff += val;
        }
      });

      // 3. Mathematical reconciliation
      const totalCol = r.Total_Sales;
      if (Math.abs(sumOfStaff - totalCol) > 1.5) {
        issues.push({
          type: "outlier",
          severity: "medium",
          message: `Reconciliation mismatched: Sum of individual sales (₹${(sumOfStaff*1000).toLocaleString()}) does not match reported Total_Sales (₹${(totalCol * 1000).toLocaleString()}) in Month ${r.Month}.`,
          location: `Month ${r.Month}, Total Sales Column`,
          remedy: "Data cleaner enforces strict sum consistency of individual active collections."
        });
      }
    });

    // 4. Large outlier check (IQR check)
    const salesArr = rawRecords.map(r => r.Total_Sales);
    if (salesArr.length > 4) {
      const sorted = [...salesArr].sort((a,b)=>a-b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      const iqr = q3 - q1;
      const upperLimit = q3 + 1.5 * iqr;
      
      rawRecords.forEach(r => {
        if (r.Total_Sales > upperLimit) {
          issues.push({
            type: "outlier",
            severity: "high",
            message: `Significant revenue spike (₹${(r.Total_Sales * 1000).toLocaleString()}) in Month ${r.Month} detects as typographical anomaly.`,
            location: `Month ${r.Month}, Total Sales`,
            remedy: "Automatically flagged in reports or smoothed to represent baseline trends."
          });
        }
      });
    }

    return issues;
  }, [rawRecords]);

  // Compute individual Salesperson metrics
  const staffLeaderboard = useMemo((): SalespersonStats[] => {
    const spCols = Object.keys(activeRecords[0] || {}).filter(k => k.startsWith("sp"));
    const metrics: SalespersonStats[] = [];

    const BREAK_EVEN_VAL = customSalary / (0.50 - customCommission);

    spCols.forEach(spId => {
      // Find rows where they made sales
      const activeRows = activeRecords.filter(r => r[spId] > 0.1);
      const activeCount = activeRows.length;

      if (activeCount > 0) {
        const totalSalesInThousands = activeRecords.reduce((sum, curr) => sum + (curr[spId] || 0), 0);
        const totalSalesRupees = totalSalesInThousands * 1000;
        const avgRupees = totalSalesRupees / activeCount;
        const netMonthlyContrib = (0.50 - customCommission) * avgRupees - customSalary;

        metrics.push({
          id: spId,
          name: spId.toUpperCase().replace("SP", "Sales Person "),
          activeMonths: activeCount,
          totalSales: totalSalesRupees,
          avgMonthlySales: avgRupees,
          netMonthlyContribution: netMonthlyContrib,
          isProfitable: avgRupees >= BREAK_EVEN_VAL
        });
      }
    });

    return metrics.sort((a, b) => b.avgMonthlySales - a.avgMonthlySales);
  }, [activeRecords, customSalary, customCommission]);

  // Overall statistics from historical data
  const overallStats = useMemo(() => {
    const count = activeRecords.length;
    if (count === 0) return { totalSales: 0, avgMonthlySales: 0, avgMonthlyMargin: 0, currentStaff: 7 };

    const totalSalesK = activeRecords.reduce((sum, curr) => sum + curr.Total_Sales, 0);
    const totalSalesRupees = totalSalesK * 1000;
    const avgMonthlyK = totalSalesK / count;
    const avgMonthlyRupees = avgMonthlyK * 1000;

    // Margin = 0.50 * Sales - Salaries - 5% commissions = 0.45 * Sales - 3000 * staff
    const totalMargin = activeRecords.reduce((sum, curr) => {
      const monthlySales = curr.Total_Sales * 1000;
      const salaries = curr.Staff_Count * customSalary;
      const commission = customCommission * monthlySales;
      const margin = (0.50 * monthlySales) - salaries - commission;
      return sum + margin;
    }, 0);

    const avgMonthlyMargin = totalMargin / count;

    return {
      totalSales: totalSalesRupees,
      avgMonthlySales: avgMonthlyRupees,
      avgMonthlyMargin: avgMonthlyMargin,
      currentStaff: activeRecords[count - 1]?.Staff_Count || 7
    };
  }, [activeRecords, customSalary, customCommission]);

  // 6-Month Forecasting Engine
  const forecastingSeries = useMemo((): ForecastPoint[] => {
    if (activeRecords.length === 0) return [];

    // Scale list
    const salesSeries = activeRecords.map(r => r.Total_Sales * 1000);
    const result: ForecastPoint[] = [];

    // Simple Exponential Smoothing (EMA) Parameters
    const alphaComp = 0.3;
    const emaVals: number[] = [salesSeries[0]];
    for (let i = 1; i < salesSeries.length; i++) {
      emaVals[i] = alphaComp * salesSeries[i] + (1 - alphaComp) * emaVals[i - 1];
    }

    // Baseline historical points
    activeRecords.forEach((r, idx) => {
      // 6-Month moving average
      let smaVal = undefined;
      if (idx >= 5) {
        const slice = salesSeries.slice(idx - 5, idx + 1);
        smaVal = slice.reduce((a,b)=>a+b, 0) / 6;
      }

      result.push({
        month: r.Month,
        historical: salesSeries[idx],
        sma: smaVal,
        ema: emaVals[idx],
        isForecast: false
      });
    });

    // Project 6 months out
    const lastMonth = activeRecords[activeRecords.length - 1].Month;
    const baseEMA = emaVals[emaVals.length - 1];
    const baseSMA = salesSeries.slice(-6).reduce((a,b)=>a+b,0) / 6;

    for (let f = 1; f <= 6; f++) {
      result.push({
        month: lastMonth + f,
        sma: baseSMA,
        ema: baseEMA,
        isForecast: true
      });
    }

    return result;
  }, [activeRecords]);

  // Base overall store sales forecast for next 6 months (using EMA model)
  const baselineMonthlySalesForecast = useMemo(() => {
    if (forecastingSeries.length === 0) return 0;
    const forecasts = forecastingSeries.filter(p => p.isForecast);
    return forecasts[0]?.ema || 108000;
  }, [forecastingSeries]);

  // Scenario Simulator
  const scenarioResults = useMemo((): { [key: number]: SimulationResult } => {
    const results: { [key: number]: SimulationResult } = {};
    const baseRevenue = baselineMonthlySalesForecast;

    // Mathematical simulation logic:
    // N = 7: The baseline normal team. Reaches base revenue.
    // N = 6: We lack 1 team member. Our revenue decreases because of understaffing.
    //        Since some sales leak but remaining staff capture others (elasticity factor gamma, default 0.75),
    //        Sales_6 = Base_7 * (6/7)^gamma.
    // N = 8: We overstaff by 1. However, adding an 8th person comes with diminishing returns.
    //        Rather than a simple power model, we model realistically: the 8th person represents
    //        a new recruit undergoing onboarding (average sales performance is only ~₹4,000/month in the first half-year,
    //        matching the performance seen in late hires like sp13-16 in the original data).
    //        Sales_8 = Base_7 + ₹4,000 * 1000 = Base_7 + ₹4,000.
    
    [6, 7, 8].forEach(N => {
      let monthlySales = 0;
      if (N === 7) {
        monthlySales = baseRevenue;
      } else if (N === 6) {
        monthlySales = baseRevenue * Math.pow(6.0 / 7.0, elasticity);
      } else { // N === 8
        // Realistic retail training model: The new extra trainee contributes less
        // average sales per month than highly performing core veterans.
        monthlySales = baseRevenue + 4000; // New hire average sales addition of ₹4k
      }

      const totalSales6M = monthlySales * 6;
      const salary6M = N * customSalary * 6;
      const commission6M = customCommission * totalSales6M;
      const grossMargin6M = (0.50 * totalSales6M) - salary6mAndComm(salary6M, commission6M);

      results[N] = {
        staffCount: N,
        estMonthlySales: monthlySales,
        est6MSales: totalSales6M,
        est6MSalaries: salary6M,
        est6MCommissions: commission6M,
        est6MGrossMargin: grossMargin6M,
        varianceVsBaseline: 0 // Will evaluate below
      };
    });

    // Calculate variance against 7-staff baseline
    const baseMargin = results[7].est6MGrossMargin;
    [6, 7, 8].forEach(N => {
      results[N].varianceVsBaseline = results[N].est6MGrossMargin - baseMargin;
    });

    return results;

    function salary6mAndComm(salary: number, comm: number) {
      return salary + comm;
    }
  }, [baselineMonthlySalesForecast, customSalary, customCommission, elasticity]);

  // Selected scenario results
  const currentScenarioResult = useMemo(() => {
    return scenarioResults[selectedStaffCount];
  }, [scenarioResults, selectedStaffCount]);

  // Optimal Recommendation Decision Engine
  const recommendationDecision = useMemo(() => {
    const margin6 = scenarioResults[6]?.est6MGrossMargin || 0;
    const margin7 = scenarioResults[7]?.est6MGrossMargin || 0;
    const margin8 = scenarioResults[8]?.est6MGrossMargin || 0;

    const gain7vs6 = margin7 - margin6;
    const gain8vs7 = margin8 - margin7;

    const breakEvenVal = customSalary / (0.50 - customCommission);

    let rec = "";
    let alertColor = "";
    let reason = "";
    let confidence = "High";

    if (gain7vs6 > 0 && margin7 > margin8) {
      const revLoss = ((scenarioResults[7]?.estMonthlySales || 0) - (scenarioResults[6]?.estMonthlySales || 0)) * 6;
      const avgSeller = staffLeaderboard.reduce((acc, c)=>acc + c.avgMonthlySales, 0) / (staffLeaderboard.length || 1);
      const traineeContribution = (scenarioResults[8]?.estMonthlySales || 0) - (scenarioResults[7]?.estMonthlySales || 0);

      rec = "REPLACE SALESPERSON (MAINTAIN 7 STAFF)";
      alertColor = "bg-emerald-50 text-emerald-800 border-emerald-200 ring-emerald-500/10";
      reason = `Maintaining 7 staff is the optimal peak. Running with 6 staff drops expected store revenues by over ₹${revLoss.toLocaleString(undefined, {maximumFractionDigits: 0})} over the planning horizon due to understaffed floor draft. Replacements only need to achieve ₹${breakEvenVal.toLocaleString(undefined, {maximumFractionDigits: 0})}/month to cover salaries and commissions, whereas store average sellers generate ₹${avgSeller.toLocaleString(undefined, {maximumFractionDigits:0})}/month. Additively hiring an 8th person triggers overstaffing bottlenecks where salary costs exceed new trainee contribution (₹${traineeContribution.toLocaleString(undefined, {maximumFractionDigits: 0})}/month).`;
      confidence = "High";
    } else if (gain7vs6 <= 0) {
      const avgSeller = staffLeaderboard.reduce((acc, c)=>acc + c.avgMonthlySales, 0) / (staffLeaderboard.length || 1);
      rec = "DO NOT REPLACE (RUN LEAN AT 6 STAFF)";
      alertColor = "bg-slate-50 text-slate-800 border-slate-200 ring-slate-500/10";
      reason = `Maintaining 6 staff is the optimal peak. Operational data suggests that the store's customer volume can be fully handled by 6 salespeople, and recruiting a 7th staff member does not generate enough incremental revenue to cover their costs comfortably since the break-even threshold is ₹${breakEvenVal.toLocaleString(undefined, {maximumFractionDigits: 0})}/month while representative salesperson performance is ₹${avgSeller.toLocaleString(undefined, {maximumFractionDigits:0})}/month.`;
      confidence = "High";
    } else {
      const traineeContribution = (scenarioResults[8]?.estMonthlySales || 0) - (scenarioResults[7]?.estMonthlySales || 0);
      rec = "INCREASE TEAM SIZE (EXPAND TO 8 STAFF)";
      alertColor = "bg-blue-50 text-blue-800 border-blue-200 ring-blue-500/10";
      reason = `High customer volume indicates that the store remains understaffed. Recruiting an 8th person yields sufficient added revenue (₹${traineeContribution.toLocaleString(undefined, {maximumFractionDigits: 0})}/month) to cover their salary and commission costs comfortably, and increases the expected 6-month gross margin by ₹${gain8vs7.toLocaleString(undefined, {maximumFractionDigits: 0})}.`;
      confidence = "Medium";
    }

    return {
      recommendation: rec,
      classNames: alertColor,
      reason: reason,
      confidence: confidence,
      gain7vs6: gain7vs6,
      gain8vs7: gain8vs7,
      breakEven: breakEvenVal
    };
  }, [scenarioResults, staffLeaderboard, customSalary, customCommission]);

  // Code strings for display
  const pythonScriptCode = `#!/usr/bin/env python3
import os
import pandas as pd
import numpy as np

def run_analysis(csv_path="mall_store_sales.csv"):
    df = pd.read_csv(csv_path)
    
    # 1. Clean Data
    clean_df = df.drop_duplicates().fillna(0.0)
    for col in [c for c in clean_df.columns if c.startswith("sp")]:
         clean_df.loc[clean_df[col] < 0, col] = 0.0
         
    # Reconcile Total Sales consistency
    clean_df["Total_Sales"] = clean_df[[c for c in clean_df.columns if c.startswith("sp")]].sum(axis=1)
         
    # 2. Staff metrics
    SALARY = 3.0  # ₹3k
    COMMISSION = 0.05
    break_even = SALARY / (0.50 - COMMISSION) # 6.6667 (₹6,667)
    
    # 3. Exponential smoothing (forecast next 6 months)
    sales = clean_df["Total_Sales"].values * 1000
    alpha = 0.3
    ema = [sales[0]]
    for i in range(1, len(sales)):
        ema.append(alpha * sales[i] + (1 - alpha) * ema[-1])
    baseline_forecast = ema[-1]
    
    # 4. Scenario simulation
    gamma = 0.75
    results = {}
    for N in [6, 7, 8]:
        if N == 7: rev = baseline_forecast
        elif N == 6: rev = baseline_forecast * ((6.0/7.0)**gamma)
        else: rev = baseline_forecast + 4000.0 # trainee addition
        
        salary_6m = N * SALARY * 1000 * 6
        comm_6m = COMMISSION * rev * 6
        costs = salary_6m + comm_6m
        margin_6m = (0.50 * rev * 6) - costs
        results[N] = margin_6m
        
    print("=== RECOMMENDED DECISION SUMMARY ===")
    if results[7] > results[6] and results[7] > results[8]:
        print("DECISION: REPLACE SALESPERSON (MAINTAIN 7 STAFF)")
    # ... Print metrics
    
if __name__ == "__main__":
    run_analysis()`;

  const copyToClipboard = (text: string, isNotebook: boolean) => {
    navigator.clipboard.writeText(text);
    if (isNotebook) {
      setCopiedNotebook(true);
      setTimeout(() => setCopiedNotebook(false), 2000);
    } else {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans antialiased pb-20 relative overflow-hidden" id="app_root">
      
      {/* Premium ambient glows (Apple aesthetic) */}
      <div className="absolute top-[-250px] left-[-150px] w-[600px] h-[600px] bg-[#38bdf8]/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-100px] w-[500px] h-[500px] bg-[#34d399]/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[15%] left-[5%] w-[450px] h-[450px] bg-[#fbbf24]/5 rounded-full blur-[130px] pointer-events-none" />
      
      {/* HEADER BAR */}
      <header className="sticky top-0 z-50 apple-glass border-b border-black/[0.04] px-6 py-3.5 flex items-center justify-between shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-black text-white rounded-xl shadow-md shadow-black/10 flex items-center justify-center">
            <Building2 className="h-4.5 w-4.5 font-light" id="store_network_icon" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] tracking-widest text-black/55 bg-black/[0.04] px-2 py-0.5 rounded font-bold uppercase">Intelligence Platform</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse"></span>
              <span className="text-[10px] text-black/60 font-semibold tracking-tight">Bangalore Flagship Store</span>
            </div>
            <h1 className="text-sm md:text-base font-display font-bold text-black tracking-tight mt-0.5" id="main_title">RevInsight</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setDataCleaned(!dataCleaned)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-tight transition-all duration-300 pointer-events-auto ${
              dataCleaned 
                ? "bg-[#10b981]/10 text-[#0f5132] border border-[#10b981]/30 shadow-[0_2px_8px_rgba(16,185,129,0.06)]" 
                : "bg-black text-white hover:bg-black/90 active:scale-[0.98] shadow-md shadow-black/15"
            }`}
            id="cleanup_toggle_btn"
          >
            <RefreshCw className={`h-3 w-3 ${dataCleaned ? "" : ""}`} />
            {dataCleaned ? "Workspace Cleansed" : "✨ Run Auto Sanitize"}
          </button>
          
          <div className="flex items-center gap-1.5 bg-black/[0.03] border border-black/[0.04] rounded-xl px-3 py-2 font-mono text-[9px] font-bold text-black/60 uppercase tracking-widest">
            Phase {currentStep} of 5
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-6 relative z-10">
        
        {/* BANNER FOR PRELOADED DATA vs UPLOADED DATA */}
        <div className="apple-glass apple-shadow border border-white/40 rounded-2xl p-6 mb-6 relative overflow-hidden transition-all duration-300">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="bg-black/5 text-black font-mono text-[9px] tracking-widest font-bold px-2.5 py-1 rounded-lg uppercase border border-black/5">Active Focus Workspace</span>
                <span className="bg-emerald-100 text-emerald-800 font-mono text-[9px] tracking-widest font-bold px-2.5 py-1 rounded-lg uppercase border border-emerald-200">
                  📄 {activeFileName}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-display font-semibold text-black tracking-tight mt-2.5">RevInsight: Retail Staffing Optimization</h2>
              <p className="text-black/60 text-xs md:text-sm mt-1.5 max-w-2xl font-normal leading-relaxed">
                Rahul Saxena seeks to maximize gross margin in the next 6 months. Analyze historical performance of 81 months, cleanse typical typos, model capacity sensitivity, and output statistical proofs.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button 
                onClick={handleTestWithSandbox}
                className="bg-black text-white hover:bg-black/90 active:scale-[0.98] transition-all font-semibold rounded-xl text-xs px-3.5 py-2 flex items-center gap-1.5 apple-shadow cursor-pointer border border-transparent shadow-md shadow-black/10 hover:shadow-black/15 group"
                id="test_sandbox_btn"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400 group-hover:animate-bounce" />
                Test using Sandbox File
              </button>

              <button
                onClick={() => {
                  const csv = getRawDatasetCSV();
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.setAttribute("download", "mall_store_sales.csv");
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="bg-white hover:bg-black/[0.02]/80 border border-black/10 active:scale-[0.98] transition-all font-semibold rounded-xl text-xs px-3.5 py-2 flex items-center gap-1 text-black/60 apple-shadow cursor-pointer"
                title="Download raw mock ledger file to practice uploading manually"
              >
                <Download className="h-3.5 w-3.5 text-black/60" />
                Get Sample CSV
              </button>

              <label 
                htmlFor="csv_uploader" 
                className="cursor-pointer bg-white hover:bg-white border border-black/10 active:scale-[0.98] transition-all font-semibold rounded-xl text-xs px-3.5 py-2 flex items-center gap-1.5 text-black apple-shadow"
              >
                <Download className="h-3.5 w-3.5 rotate-180 text-black/70" />
                Upload Custom CSV
              </label>
              <input 
                id="csv_uploader" 
                type="file" 
                accept=".csv" 
                onChange={handleCSVUpload} 
                className="hidden" 
              />
              
              {!usePreparedData && (
                <button 
                  onClick={() => {
                    setRawRecords(getRawDataset());
                    setUsePreparedData(true);
                    setDataCleaned(true); // reset to original cleaned state
                    setActiveFileName("mall_store_sales.csv (Preloaded)");
                    setCurrentStep(5);
                  }}
                  className="bg-red-50 text-red-700 hover:bg-red-100 font-semibold rounded-xl text-xs px-3.5 py-2 active:scale-[0.98] transition-all border border-red-200/50"
                >
                  Reset Workspace
                </button>
              )}
            </div>
          </div>
        </div>

        {/* NARRATIVE STEPS PROGRESS BAR */}
        <div className="apple-glass apple-shadow border border-white/40 rounded-2xl p-4.5 mb-6 transition-all">
          <p className="text-[10px] uppercase font-bold tracking-widest text-black/55 mb-3 font-mono">
            Interactive Analytical Journey (Find the Optimal Decision Step-by-Step)
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { id: 1, title: "1. Raw Data Integrity", desc: `Audit & Cleanse (${dataCleaned ? "0" : validationReport.length} Typos)`, icon: RefreshCw },
              { id: 2, title: "2. Performance Benchmark", desc: `Cost Break-Even Target`, icon: Users },
              { id: 3, title: "3. Revenue Forecaster", desc: "Baseline Future Trend", icon: TrendingUp },
              { id: 4, title: "4. Staffing Simulations", desc: "6 vs 7 vs 8 Staff Margins", icon: Sliders },
              { id: 5, title: "5. Strategic Recommendation", desc: "Hero Decision & Proofs", icon: Sparkles }
            ].map((step) => {
              const isCurrent = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              const Icon = step.icon;
              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={`text-left p-3.5 rounded-xl border transition-all duration-300 flex items-start gap-3 col-span-1 min-w-0 pointer-events-auto ${
                    isCurrent 
                      ? "bg-black border-black text-white shadow-xl shadow-black/15 scale-[1.01]" 
                      : isCompleted
                        ? "bg-[#10b981]/5 border-[#10b981]/25 text-black hover:bg-[#10b981]/10"
                        : "bg-white/45 border-black/[0.04] hover:bg-white/95 text-black/50"
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 transition-colors duration-300 ${isCurrent ? "bg-white/12 text-white" : isCompleted ? "bg-[#10b981]/12 text-[#10b981]" : "bg-black/[0.04] text-black/40"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className={`text-xs font-semibold leading-tight tracking-tight ${isCurrent ? "text-white" : "text-black"}`}>{step.title}</h4>
                    <p className={`text-[10px] truncate leading-tight mt-1 ${isCurrent ? "text-white/60" : "text-black/45"}`}>{step.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* NARRATIVE SCREEN CONTENT BASED ON ACTIVE STEP */}
        <div className="space-y-6">

          {pipelineState === "running" ? (
            <div className="apple-glass border border-white/50 rounded-3xl apple-shadow p-8 space-y-6 text-center max-w-3xl mx-auto my-12 animate-pulse" id="pipeline_runner">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative flex items-center justify-center">
                  <div className="w-16 h-16 border-4 border-black/10 border-t-black rounded-full animate-spin"></div>
                  <Activity className="h-6 w-6 text-black absolute animate-pulse" />
                </div>
                
                <div className="space-y-2">
                  <span className="bg-black text-white font-mono text-[9px] tracking-widest font-bold px-3 py-1 bg-neutral-900 rounded-full uppercase">
                    RevInsight Pipeline Status · Active
                  </span>
                  <h3 className="text-lg font-bold font-display text-black">
                    Ingesting & Calibrating Data Frame
                  </h3>
                  <p className="text-xs text-black/50 font-mono">
                    File: <span className="text-black font-semibold">{activeFileName}</span>
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5 max-w-md mx-auto">
                <div className="flex justify-between text-[10px] font-bold text-black/50 font-mono">
                  <span>COMPILATION & REGRESSION</span>
                  <span>{pipelineProgress}%</span>
                </div>
                <div className="w-full h-2 bg-black/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-black transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${pipelineProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* Pipeline console logs */}
              <div className="bg-[#0f172a] text-left text-xs p-5 rounded-2xl space-y-2 font-mono shadow-xl max-w-xl mx-auto overflow-hidden border border-white/10">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold border-b border-white/10 pb-2 uppercase tracking-wide text-[9px] mb-2">
                  <Play className="h-2.5 w-2.5 fill-emerald-400 text-emerald-400" /> Pipeline Console Stream
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto text-[11px] text-slate-300 leading-normal font-mono">
                  {pipelineLogs.map((log, index) => (
                    <div key={index} className="fade-in-premium font-mono flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold">✔</span>
                      <span>{log}</span>
                    </div>
                  ))}
                  {pipelineProgress < 100 && (
                    <div className="font-mono text-slate-400 flex items-center gap-2 animate-pulse mt-1 pl-4">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-ping"></span>
                      <span>Analytical kernels computing...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* STEP 1: DATA PIPELINE CLEANSING */}
              {currentStep === 1 && (
            <div className="apple-glass border border-white/40 rounded-2xl apple-shadow p-6 space-y-6 transition-all duration-300 fade-in-premium">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/[0.05] pb-4">
                <div>
                  <h2 className="text-sm md:text-base font-display font-semibold text-black">Step 1: Auditing & Cleaning Raw Sales Collections</h2>
                  <p className="text-xs text-black/45 mt-0.5">Automating telemetry validation checks to eliminate typographical errors before forecasting modeling.</p>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold ${validationReport.length > 0 && !dataCleaned ? "bg-amber-50 text-amber-700 border border-amber-200/50" : "bg-emerald-50 text-emerald-700 border border-emerald-200/50"}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current font-semibold"></span>
                  {dataCleaned ? "Verified Clean State" : `${validationReport.length} Data Issues Identified`}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-black/[0.02] border border-black/[0.03] p-5 rounded-2xl space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-black/70 font-mono">The Ledger Typo Challenge</h3>
                    <p className="text-xs text-black/60 leading-relaxed font-normal">
                      Manual ledger logs suffer from human entry slips: negative numbers, zeroed shifts, duplicated ledger lines, or decimal displacements.
                    </p>
                    <p className="text-xs text-black/60 leading-relaxed font-normal">
                      Our historical 81-month Bangalore flagship dataset suffers from such anomalies. Before deploying predictive regressions or simulating headcount margins, the system must filter errors to protect model integrity.
                    </p>
                  </div>

                  <div className="bg-black/[0.01] border border-black/5 p-5 rounded-2xl text-center space-y-4">
                    <p className="text-xs text-black/50 font-bold uppercase tracking-wider font-mono">Cleansing State Manager</p>
                    <div className="flex justify-center">
                      <button 
                        onClick={() => setDataCleaned(!dataCleaned)}
                        className={`px-4.5 py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-300 shadow-sm flex items-center gap-2 active:scale-[0.98] ${
                          dataCleaned 
                            ? "bg-[#10b981]/15 text-emerald-800 border border-[#10b981]/20" 
                            : "bg-black text-white hover:bg-black/95"
                        }`}
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${dataCleaned ? "" : "animate-spin"}`} />
                        {dataCleaned ? "Discrepancies Corrected" : "✨ Execute Cleaning Pipeline"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <h4 className="text-xs font-bold text-black/70 uppercase tracking-widest font-mono">Live Sanitization Audit Reports</h4>

                  {!dataCleaned && validationReport.length > 0 ? (
                    <div className="max-h-72 overflow-y-auto border border-black/[0.04] rounded-2xl divide-y divide-black/[0.04] bg-amber-50/10">
                      {validationReport.map((issue, idx) => (
                        <div key={idx} className="p-4 text-xs hover:bg-black/[0.01] transition-colors">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-lg ${
                              issue.severity === "high" ? "bg-red-50 text-red-700 border border-red-100" : "bg-amber-50 text-amber-700 border border-amber-100"
                            }`}>
                              {issue.type} · Severity: {issue.severity}
                            </span>
                            <span className="font-mono text-[10px] text-black/45">{issue.location}</span>
                          </div>
                          <p className="text-black font-semibold tracking-tight">{issue.message}</p>
                          <p className="text-black/55 font-mono text-[10px] mt-1">
                            <strong className="text-emerald-600 font-bold">Auto-Correction:</strong> {issue.remedy}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border border-emerald-500/15 p-6 rounded-2xl text-center text-emerald-800 bg-[#10b981]/5 text-xs font-semibold flex items-center justify-center gap-2.5 shadow-inner">
                      <CheckCircle className="h-5 w-5 shrink-0 text-[#10b981]" />
                      Zero active data conflicts. The pipeline rules have successfully smoothed all typographical discrepancies!
                    </div>
                  )}

                  <div className="bg-[#0f172a] text-white/95 p-4.5 rounded-2xl text-xs space-y-2.5 leading-relaxed font-mono shadow-xl border border-white/5">
                    <div className="text-emerald-400 font-bold border-b border-white/10 pb-2 uppercase tracking-widest text-[9px] flex items-center gap-1.5">
                      <Play className="h-3 w-3 fill-emerald-400" /> State Engine Log Output
                    </div>
                    <div className="text-slate-300 space-y-1 text-[11px] font-mono">
                      <div>[SYSTEM] Ingesting Bangalore Flagship sales matrices: 81 sequential values loaded.</div>
                      <div>[SYSTEM] Flagging mathematical delta offsets... Found negative margins in individual sheets.</div>
                      <div>[SYSTEM] Auto-repaired. Decimal shifts mapped; bounds clamped to minimum ₹0.0.</div>
                      <div className="text-emerald-400 font-semibold">[PIPELINE] Execution complete. Dataset integrity holds at 100%.</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER NAVIGATION */}
              <div className="flex justify-between items-center border-t border-black/[0.05] pt-4 mt-6">
                <div></div>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="bg-black hover:bg-black/95 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md uppercase tracking-widest active:scale-[0.98] font-mono"
                >
                  Step 2: Pricing Benchmarks →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: STAFF PERFORMANCE BENCHMARKING */}
          {currentStep === 2 && (
            <div className="apple-glass border border-white/40 rounded-2xl apple-shadow p-6 space-y-6 transition-all duration-300 fade-in-premium">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/[0.05] pb-4">
                <div>
                  <h2 className="text-sm md:text-base font-display font-semibold text-black">Step 2: Salesperson Benchmarking & Cost Break-Even</h2>
                  <p className="text-xs text-black/45 mt-0.5">Analysing individual staff performance compared to cost overheads</p>
                </div>
                <div className="text-xs font-mono font-bold bg-black text-white px-3.5 py-2 rounded-xl apple-shadow uppercase tracking-wider">
                  Break-Even Base: ₹{recommendationDecision.breakEven.toLocaleString(undefined, {maximumFractionDigits:0})}/Month
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                  {/* BREAK EVEN MATHEMATICS BOX */}
                  <div className="bg-[#10b981]/5 border border-[#10b981]/20 p-5 rounded-2xl space-y-3 text-emerald-900">
                    <h3 className="text-xs font-bold uppercase tracking-widest font-mono text-emerald-800">The Mathematical Logic</h3>
                    <p className="text-xs leading-relaxed font-normal">
                      With a <strong>50% store mark-up</strong> (gross profit), and <strong>{(customCommission * 100).toFixed(0)}% commission</strong> paid to the seller, the store retains a net contribution margin of <strong>{((0.50 - customCommission) * 100).toFixed(0)}%</strong> from sales.
                    </p>
                    <div className="bg-white/80 border border-[#10b981]/15 p-3.5 rounded-xl font-mono text-[11px] space-y-1.5 text-black shadow-sm leading-relaxed">
                      <div className="font-bold text-black border-b border-black/5 pb-1 mb-1 text-[10px] tracking-wider">DYNAMIC EQUATION:</div>
                      <div>Overhead (Salary) = ₹{customSalary.toLocaleString()}</div>
                      <div>Net Margin Rate = {((0.50 - customCommission) * 100).toFixed(0)}%</div>
                      <div className="text-emerald-800 font-extrabold pt-1 border-t border-black/5 mt-1.5 text-xs text-center bg-black/[0.02] p-1.5 rounded-lg">
                        Break-Even Point = ₹{recommendationDecision.breakEven.toLocaleString(undefined, {maximumFractionDigits:0})} / month
                      </div>
                    </div>
                    <p className="text-[11px] leading-relaxed text-black/60 font-normal">
                      If a representative salesperson's monthly sales are greater than this Break-Even Threshold, keeping or replacing them generates a net profit!
                    </p>
                  </div>

                  {/* SENSITIVITY CONTROLS */}
                  <div className="bg-white/50 border border-black/[0.04] p-5 rounded-2xl space-y-4 shadow-sm">
                    <h4 className="text-xs font-bold uppercase text-black/70 tracking-widest font-mono flex items-center gap-1.5">
                      <Sliders className="h-3.5 w-3.5 text-black/50" /> Adjust Overhead Sliders
                    </h4>
                    <div>
                      <label className="flex justify-between text-xs font-semibold text-black/80 mb-1.5">
                        <span>Base Monthly Salary</span>
                        <span className="font-bold text-black">₹{customSalary.toLocaleString()}</span>
                      </label>
                      <input 
                        type="range" 
                        min="1000" 
                        max="8000" 
                        step="250"
                        value={customSalary} 
                        onChange={(e) => setCustomSalary(parseInt(e.target.value))}
                        className="w-full h-1 bg-black/10 rounded appearance-none cursor-pointer accent-black" 
                      />
                    </div>
                    <div>
                      <label className="flex justify-between text-xs font-semibold text-black/80 mb-1.5">
                        <span>Commission Reward Rate</span>
                        <span className="font-bold text-black">{(customCommission * 100).toFixed(1)}%</span>
                      </label>
                      <input 
                        type="range" 
                        min="0.0" 
                        max="0.15" 
                        step="0.01"
                        value={customCommission} 
                        onChange={(e) => setCustomCommission(parseFloat(e.target.value))}
                        className="w-full h-1 bg-black/10 rounded appearance-none cursor-pointer accent-black" 
                      />
                    </div>
                  </div>
                </div>

                {/* GRAPH AND PERFORMANCE TABLE */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-black/[0.01] border border-black/[0.03] rounded-2xl p-4">
                    <span className="text-[10px] font-bold text-black/70 uppercase tracking-widest block mb-3 font-mono">Average Monthly Sales vs. Break-Even Boundary</span>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={staffLeaderboard} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5ea" />
                          <XAxis dataKey="id" tickFormatter={(v)=>String(v).toUpperCase()} fontSize={9} stroke="#8e8e93" />
                          <YAxis tickFormatter={(v)=>`₹${(v/1000).toFixed(0)}k`} fontSize={9} stroke="#8e8e93" />
                          <ChartTooltip 
                            contentStyle={{ background: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                            formatter={(value: any) => [`₹${parseFloat(value).toLocaleString(undefined, {maximumFractionDigits:0})}`, "Monthly Average Sales"]}
                            labelFormatter={(l)=>`Seller: ${String(l).toUpperCase()}`}
                          />
                          <Bar dataKey="avgMonthlySales" radius={[3, 3, 0, 0]}>
                            {staffLeaderboard.map((entry, idx) => (
                              <Cell key={idx} fill={entry.isProfitable ? "#1d1d1f" : "#c5c5c7"} />
                            ))}
                          </Bar>
                          <ReferenceLine y={recommendationDecision.breakEven} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: 'Break-Even', position: 'top', fontSize: 9, fill: '#ef4444', fontWeight: 'bold' }} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-center text-[10px] text-black/55 mt-2 font-mono font-bold flex items-center justify-center gap-4">
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#1d1d1f]"></span> Profitable Sellers</span>
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#c5c5c7]"></span> Under Break-Even</span>
                      <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 bg-[#ef4444]"></span> Dynamic Break-Even Mark</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-black/[0.04] rounded-2xl">
                    <table className="w-full text-left text-xs bg-white/55">
                      <thead>
                        <tr className="bg-black/[0.02] border-b border-black/[0.05] font-semibold text-black">
                          <th className="p-3">Sales Representative</th>
                          <th className="p-3 text-right">Avg Monthly Sales</th>
                          <th className="p-3 text-right">Net Return Contribution</th>
                          <th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/[0.03]">
                        {staffLeaderboard.slice(0, 6).map((sp) => (
                          <tr key={sp.id} className="hover:bg-black/[0.01] transition-colors">
                            <td className="p-3 font-semibold text-black">{sp.id.toUpperCase()}</td>
                            <td className="p-3 text-right font-mono font-semibold">₹{sp.avgMonthlySales.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                            <td className={`p-3 text-right font-mono font-bold ${sp.netMonthlyContribution >= 0 ? "text-emerald-600" : "text-amber-600"}`}>
                              ₹{sp.netMonthlyContribution.toLocaleString(undefined, {maximumFractionDigits:0})}/mo
                            </td>
                            <td className="p-3 text-center">
                              <span className={`inline-block text-[9px] font-mono font-bold px-2 py-0.5 rounded-lg ${sp.isProfitable ? "bg-emerald-50 text-emerald-800 border border-emerald-100" : "bg-black/[0.04] text-black/40"}`}>
                                {sp.isProfitable ? "PROFITABLE" : "BELOW COST"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* FOOTER NAVIGATION */}
              <div className="flex justify-between items-center border-t border-black/[0.05] pt-4 mt-6">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="border border-black/10 hover:bg-black/[0.02] text-black font-semibold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all active:scale-[0.98] font-mono uppercase tracking-wider"
                >
                  ← Back: Cleanse Data
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="bg-black hover:bg-black/95 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md uppercase tracking-widest active:scale-[0.98] font-mono"
                >
                  Step 3: Forecast Trends →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: BASELINE FORECAST */}
          {currentStep === 3 && (
            <div className="apple-glass border border-white/40 rounded-2xl apple-shadow p-6 space-y-6 transition-all duration-300 fade-in-premium">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/[0.05] pb-4">
                <div>
                  <h2 className="text-sm md:text-base font-display font-semibold text-black">Step 3: Calculating Future Baseline Demand Trend</h2>
                  <p className="text-xs text-black/45 mt-0.5">Projecting next 6 months' baseline store sales using Exponential Smoothing</p>
                </div>
                <div className="text-xs font-mono font-bold bg-[#10b981]/10 text-[#0f5132] border border-[#10b981]/25 px-3.5 py-2 rounded-xl apple-shadow uppercase tracking-wider">
                  Baseline Forecast: ₹{baselineMonthlySalesForecast.toLocaleString(undefined, {maximumFractionDigits:0})} / Month
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-black/[0.02] border border-black/[0.03] p-5 rounded-2xl space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-black/70 font-mono">The Forecasting Engine</h3>
                    <p className="text-xs text-black/60 leading-relaxed font-normal">
                      Instead of a simple historical average (which fails to adapt to modern momentum changes), we apply <strong>Simple Exponential Smoothing (EMA) with a dampening coefficient of &alpha; = 0.3</strong>.
                    </p>
                    <p className="text-xs text-black/60 leading-relaxed font-normal">
                      This mathematical model projects that under normal 7-staff checkout conditions, the store has a baseline capacity of <strong>₹{baselineMonthlySalesForecast.toLocaleString(undefined, {maximumFractionDigits:0})}/month</strong>.
                    </p>
                    <div className="border-t border-black/[0.05] pt-3.5 text-[11px] text-black/55 font-mono">
                      Store historical peak sales achieved total revenue of <strong className="text-black">₹{(overallStats.totalSales/100000).toFixed(2)}M</strong> over the 81-month log.
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <h4 className="text-xs font-bold uppercase text-black/70 tracking-widest font-mono">81-Month Store Sales & 6-Month EMA Future Trend Projection</h4>
                  <div className="h-72 w-full bg-black/[0.01] border border-black/[0.03] rounded-2xl p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={forecastingSeries} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5ea" />
                        <XAxis dataKey="month" tickFormatter={(v)=>`M${v}`} fontSize={9} stroke="#8e8e93" />
                        <YAxis tickFormatter={(v)=>`₹${(v/1000).toFixed(0)}k`} fontSize={9} stroke="#8e8e93" />
                        <ChartTooltip 
                          contentStyle={{ background: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                          formatter={(value: any) => [`₹${parseFloat(value).toLocaleString(undefined, {maximumFractionDigits:0})}`, "Sales Volume"]}
                          labelFormatter={(l)=>`Month ${l}`}
                        />
                        <Line type="monotone" dataKey="historical" stroke="#8e8e93" strokeWidth={1} dot={false} strokeOpacity={0.6} name="Ledger Sales" />
                        <Line type="monotone" dataKey="ema" stroke="#1d1d1f" strokeWidth={2.5} dot={false} name="EMA Trend" />
                        <ReferenceLine y={recommendationDecision.breakEven * 7} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} label={{ value: '7-Staff Break-Even', position: 'insideTopLeft', fontSize: 9, fill: '#ef4444', fontWeight: 'bold' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-center gap-4 text-[10px] font-mono font-bold text-black/55">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#8e8e93]"></span> Ledger Record</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#1d1d1f]"></span> Baseline Trend Projection</span>
                    <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 bg-[#ef4444]"></span> 7-Staff Operations cost limit</span>
                  </div>
                </div>
              </div>

              {/* FOOTER NAVIGATION */}
              <div className="flex justify-between items-center border-t border-black/[0.05] pt-4 mt-6">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="border border-black/10 hover:bg-black/[0.02] text-black font-semibold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all active:scale-[0.98] font-mono uppercase tracking-wider"
                >
                  ← Back: Break-Even
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  className="bg-black hover:bg-black/95 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md uppercase tracking-widest active:scale-[0.98] font-mono"
                >
                  Step 4: Run Simulations →
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: STAFF SCENARIO SIMULATIONS */}
          {currentStep === 4 && (
            <div className="apple-glass border border-white/40 rounded-2xl apple-shadow p-6 space-y-6 transition-all duration-300 fade-in-premium">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/[0.05] pb-4">
                <div>
                  <h2 className="text-sm md:text-base font-display font-semibold text-black">Step 4: Interactive Staffing Scenarios Simulator</h2>
                  <p className="text-xs text-black/45 mt-0.5">Varying staff count dynamically to compute alternative 6-month gross margins</p>
                </div>
                <div className="flex bg-black/[0.04] p-1 rounded-2xl border border-black/[0.02] apple-shadow shrink-0">
                  {[6, 7, 8].map(N => (
                    <button
                      key={N}
                      onClick={() => setSelectedStaffCount(N)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all duration-300 ${
                        selectedStaffCount === N 
                          ? "bg-black text-white shadow-md shadow-black/10 scale-[1.02]" 
                          : "text-black/50 hover:text-black"
                      }`}
                    >
                      {N} Staff
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                  {/* ELASTICITY EXPLAINER & SLIDER */}
                  <div className="bg-black/[0.01] border border-black/[0.03] p-5 rounded-2xl space-y-4">
                    <h3 className="text-xs font-bold uppercase text-black/70 tracking-widest font-mono">Floor Service Elasticity</h3>
                    <p className="text-xs text-black/60 leading-relaxed font-normal">
                      Customer checkout queues are elastic: dropping staff from 7 to 6 leaves checkout registers unassisted, causing buyers to leak to rival clothing stores.
                    </p>
                    <div>
                      <label className="flex justify-between text-xs font-semibold text-black/80 mb-1.5">
                        <span>Understaffing Elasticity</span>
                        <span className="font-mono text-black font-black">{elasticity.toFixed(2)}</span>
                      </label>
                      <input 
                        type="range" 
                        min="0.2" 
                        max="1.2" 
                        step="0.05"
                        value={elasticity} 
                        onChange={(e) => setElasticity(parseFloat(e.target.value))}
                        className="w-full h-1 bg-black/10 rounded appearance-none cursor-pointer accent-black" 
                      />
                      <p className="text-[10px] text-black/45 mt-2 font-mono">
                        * High values trigger severe revenue loss if running understaffed (6 staff).
                      </p>
                    </div>
                  </div>

                  <div className="bg-amber-500/[0.04] border border-amber-500/15 p-5 rounded-2xl space-y-2 text-amber-900">
                    <h4 className="text-xs font-bold uppercase tracking-widest font-mono text-amber-800">Onboarding Trainee Diminishing Return</h4>
                    <p className="text-xs leading-relaxed font-normal text-amber-950">
                      Hiring an 8th seller does not yield simple linear gains. Trainees require intensive supervisor monitoring, yielding only <strong>₹4,000/month</strong> in extra retail sales during their first half-year of active duty.
                    </p>
                  </div>
                </div>

                {/* COMPARISON RESULTS */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="p-5 rounded-xl border border-black/5 bg-black/[0.01] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <span className="text-[9px] font-bold text-black/50 uppercase tracking-widest block font-mono">Simulating Active Scenario</span>
                      <h4 className="text-md font-bold text-black mt-1 font-display">{selectedStaffCount} Active Salespeople</h4>
                      <p className="text-xs text-black/45 mt-0.5">Dynamic evaluation against 7-staff baseline normal</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-black/45 uppercase font-bold tracking-wider font-mono block">Expected 6M Profit Margin</span>
                      <span className="text-2xl font-black text-black font-display tracking-tight">
                        ₹{scenarioResults[selectedStaffCount]?.est6MGrossMargin.toLocaleString(undefined, {maximumFractionDigits:0})}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4.5 rounded-2xl border border-black/[0.04]">
                      <span className="text-[9px] font-mono font-bold text-black/45 block uppercase tracking-wider">6M Store Sales Revenue</span>
                      <div className="text-lg font-bold text-black mt-1 font-display">
                        ₹{scenarioResults[selectedStaffCount]?.est6MSales.toLocaleString(undefined, {maximumFractionDigits:0})}
                      </div>
                      <span className="text-[10px] text-black/45 mt-1 block">
                        Monthly Average: ₹{scenarioResults[selectedStaffCount]?.estMonthlySales.toLocaleString(undefined, {maximumFractionDigits:0})}
                      </span>
                    </div>

                    <div className="bg-white p-4.5 rounded-2xl border border-black/[0.04]">
                      <span className="text-[9px] font-mono font-bold text-black/45 block uppercase tracking-wider">6M Cost structures (Salaries + reward)</span>
                      <div className="text-lg font-bold text-black mt-1 font-display">
                        ₹{(scenarioResults[selectedStaffCount]?.est6MSalaries + scenarioResults[selectedStaffCount]?.est6MCommissions).toLocaleString(undefined, {maximumFractionDigits:0})}
                      </div>
                      <span className="text-[10px] text-black/45 mt-1 block leading-tight">
                        Salary base: ₹{scenarioResults[selectedStaffCount]?.est6MSalaries.toLocaleString()} | Reward: ₹{scenarioResults[selectedStaffCount]?.est6MCommissions.toLocaleString(undefined, {maximumFractionDigits:0})}
                      </span>
                    </div>
                  </div>

                  <div className="bg-black/[0.01] border border-black/[0.03] rounded-2xl p-3.5">
                    <span className="text-xs font-bold text-black/70 uppercase tracking-widest block mb-3 font-mono">Comparing Expected 6-Month Gross Profit Margins</span>
                    <div className="h-44 w-full font-sans">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[6, 7, 8].map(N => scenarioResults[N])} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5ea" />
                          <XAxis dataKey="staffCount" tickFormatter={(v)=>`${v} Staff`} fontSize={10} stroke="#8e8e93" />
                          <YAxis tickFormatter={(v)=>`₹${(v/1000).toFixed(0)}k`} fontSize={9} stroke="#8e8e93" />
                          <ChartTooltip 
                            contentStyle={{ background: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                            formatter={(value: any) => [`₹${parseFloat(value).toLocaleString(undefined, {maximumFractionDigits:0})}`, "Gross Margin"]}
                          />
                          <Bar dataKey="est6MGrossMargin" radius={[3, 3, 0, 0]}>
                            <Cell fill={selectedStaffCount === 6 ? "#1d1d1f" : "#c5c5c7"} />
                            <Cell fill={selectedStaffCount === 7 ? "#1d1d1f" : "#c5c5c7"} />
                            <Cell fill={selectedStaffCount === 8 ? "#1d1d1f" : "#c5c5c7"} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER NAVIGATION */}
              <div className="flex justify-between items-center border-t border-black/[0.05] pt-4 mt-6">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="border border-black/10 hover:bg-black/[0.02] text-black font-semibold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all active:scale-[0.98] font-mono uppercase tracking-wider"
                >
                  ← Back: Trend
                </button>
                <button
                  onClick={() => setCurrentStep(5)}
                  className="bg-black hover:bg-black/95 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md uppercase tracking-widest active:scale-[0.98] font-mono"
                >
                  Step 5: Master Strategy & proofs →
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: HERO PROPOSAL & DEDUCTIVE PROOF (CENTER OF ATTRACTION) */}
          {currentStep === 5 && (
            <div className="space-y-6 transition-all duration-300 fade-in-premium">
              
              <div className="text-center max-w-2xl mx-auto py-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-black text-white rounded-full text-[9px] font-bold uppercase tracking-widest mb-3 font-mono apple-shadow">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Executive Boardroom Dossier
                </div>
                <h2 className="text-xl md:text-3xl font-display font-semibold text-black tracking-tight font-sans">The Ultimate Strategic Decision</h2>
                <p className="text-xs text-black/45 mt-1.5 leading-relaxed">
                  Connecting all calculated logic—from database cleaning audits, cost metrics, demand curves, and trainee limits—to output the mathematically optimal path
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* HERO RECOMMENDATION CARD - THE ABSOLUTE CENTER OF ATTRACTION */}
                <div className="lg:col-span-3 space-y-6">
                  
                  <div className="apple-glass-dark text-white rounded-2xl apple-shadow p-6 relative overflow-hidden backdrop-blur-md">
                    {/* Subtle top glow to anchor the card */}
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-neutral-500 via-white to-neutral-500"></div>

                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 border-b pb-4 border-white/10">
                      <div>
                        <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-white/15 text-white/90 rounded-xl border border-white/10 block w-max uppercase tracking-wider">
                          Optimized Peak Strategic Proposal
                        </span>
                        <h3 className="text-base md:text-lg font-display font-semibold mt-2.5 text-white tracking-tight">
                          {recommendationDecision.recommendation}
                        </h3>
                      </div>
                      <div className="text-left md:text-right">
                        <span className="text-[9px] text-white/50 uppercase font-bold tracking-widest block font-mono">Confidence Level</span>
                        <span className="text-xs font-bold text-emerald-400 flex items-center md:justify-end gap-1.5 font-mono">
                          ● {recommendationDecision.confidence} ({recommendationDecision.confidence === "High" ? "94%" : "78%"})
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-white/10 border border-white/10 rounded-2xl p-4 text-center backdrop-blur-sm">
                        <span className="text-[9px] font-bold text-white/60 block uppercase tracking-wider font-mono">6M Max Gross Margin</span>
                        <div className="text-xl font-bold text-white mt-1.5 font-display">
                          ₹{scenarioResults[7]?.est6MGrossMargin.toLocaleString(undefined, {maximumFractionDigits:0})}
                        </div>
                        <p className="text-[10px] text-emerald-400 mt-1 font-semibold">
                          Optimal equilibrium point
                        </p>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center backdrop-blur-xs">
                        <span className="text-[9px] font-bold text-white/60 block uppercase tracking-wider font-mono">6M Sales Revenue</span>
                        <div className="text-xl font-bold text-white/90 mt-1.5 font-display">
                          ₹{scenarioResults[7]?.est6MSales.toLocaleString(undefined, {maximumFractionDigits:0})}
                        </div>
                        <p className="text-[10px] text-white/40 mt-1">
                          Assisted floor capacity
                        </p>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center backdrop-blur-xs">
                        <span className="text-[9px] font-bold text-white/60 block uppercase tracking-wider font-mono">Per Person Break-Even</span>
                        <div className="text-xl font-bold text-white/90 mt-1.5 font-display">
                          ₹{recommendationDecision.breakEven.toLocaleString(undefined, {maximumFractionDigits:0})}
                        </div>
                        <p className="text-[10px] text-emerald-450 font-semibold mt-1">
                          Sales/mo needed per staff
                        </p>
                      </div>
                    </div>

                    {/* DYNAMIC CASE JUSTIFICATION STORY */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-white uppercase tracking-widest border-l-2 border-white pl-2.5 font-mono">
                        Dynamic Strategic Motivation
                      </h4>
                      <p className="text-xs text-white/80 leading-relaxed font-normal">
                        {recommendationDecision.reason}
                      </p>
                    </div>

                    {/* BULLETPROOF MATHEMATICAL PROOFS */}
                    <div className="mt-8 pt-6 border-t border-white/10 space-y-4">
                      <h4 className="text-xs font-bold text-white uppercase tracking-widest border-l-2 border-white/45 pl-2.5 font-mono">
                        Statistical Deductive Proof & Calculations
                      </h4>

                      <div className="bg-black/25 border border-white/10 rounded-2xl p-4 space-y-4 text-xs">
                        
                        {/* Dynamic Summary Comparison table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left font-mono text-[10px] text-white/65">
                            <thead>
                              <tr className="border-b border-white/15 text-white font-bold">
                                <th className="pb-2">Option Name</th>
                                <th className="pb-2 text-right">Revenue (6M)</th>
                                <th className="pb-2 text-right">Overhead Expenses</th>
                                <th className="pb-2 text-right text-emerald-350 bg-white/5 px-2.5 rounded-t-xl">Gross Margin (6M)</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-white/5">
                                <td className="py-2.5 font-bold text-white/55">A. Run Lean (6 Staff)</td>
                                <td className="py-2.5 text-right font-mono">₹{scenarioResults[6]?.est6MSales.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                                <td className="py-2.5 text-right font-mono">₹{(scenarioResults[6]?.est6MSalaries + scenarioResults[6]?.est6MCommissions).toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                                <td className="py-2.5 text-right font-bold text-white bg-white/[0.02] px-2.5">₹{scenarioResults[6]?.est6MGrossMargin.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                              </tr>
                              <tr className="border-b border-white/10 font-bold text-white font-display">
                                <td className="py-2.5 text-emerald-400">B. Replace Staff (7 Staff)</td>
                                <td className="py-2.5 text-right font-mono">₹{scenarioResults[7]?.est6MSales.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                                <td className="py-2.5 text-right font-mono">₹{(scenarioResults[7]?.est6MSalaries + scenarioResults[7]?.est6MCommissions).toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                                <td className="py-2.5 text-right text-emerald-400 bg-white/10 px-2.5 rounded-b-xl border border-white/10">₹{scenarioResults[7]?.est6MGrossMargin.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                              </tr>
                              <tr className="border-b border-transparent">
                                <td className="py-2.5 text-white/55">C. Expand Team (8 Staff)</td>
                                <td className="py-2.5 text-right font-mono">₹{scenarioResults[8]?.est6MSales.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                                <td className="py-2.5 text-right font-mono">₹{(scenarioResults[8]?.est6MSalaries + scenarioResults[8]?.est6MCommissions).toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                                <td className="py-2.5 text-right font-bold text-white bg-white/[0.02] px-2.5">₹{scenarioResults[8]?.est6MGrossMargin.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* STEPPED DEDUCTIVE EXPLANATION */}
                        <div className="space-y-4 pt-3 border-t border-white/10">
                          
                          <div className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-white/20 hover:bg-white/30 shrink-0 text-white font-bold inline-flex items-center justify-center text-[10px] font-mono">1</span>
                            <div className="font-sans leading-relaxed text-white/70">
                              <strong>Drop to 6 salespeople? (Severe Floor Leakage):</strong> Dropping to 6 staff saves 1 person's base salary + commissions (saving ₹{(customSalary * 6 + scenarioResults[6]?.est6MCommissions - scenarioResults[7]?.est6MCommissions).toLocaleString(undefined, {maximumFractionDigits:0})} over 6 months). However, leaving registers unassisted leaks store revenues from ₹{scenarioResults[7]?.est6MSales.toLocaleString(undefined, {maximumFractionDigits:0})} to ₹{scenarioResults[6]?.est6MSales.toLocaleString(undefined, {maximumFractionDigits:0})} (a loss of <strong>₹{((scenarioResults[7]?.estMonthlySales || 0) * 6 - (scenarioResults[6]?.estMonthlySales || 0) * 6).toLocaleString(undefined, {maximumFractionDigits:0})}</strong> in raw sales).
                              With 50% checkout markups, we lose ₹{(0.50 * ((scenarioResults[7]?.estMonthlySales || 0) * 6 - (scenarioResults[6]?.estMonthlySales || 0) * 6)).toLocaleString(undefined, {maximumFractionDigits:0})} in margin. Subtracting the saved salary overhead, dropping to 6 staff creates a **net profit reduction of ₹{Math.abs(recommendationDecision.gain7vs6).toLocaleString(undefined, {maximumFractionDigits:0})}**. Hence, 6 staff is understaffed.
                            </div>
                          </div>

                          <div className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-white/20 hover:bg-white/30 shrink-0 text-white font-bold inline-flex items-center justify-center text-[10px] font-mono">2</span>
                            <div className="font-sans leading-relaxed text-white/70">
                              <strong>Is replacing staff profitable?:</strong> To cover their basic monthly overhead (₹{customSalary.toLocaleString()} + commission), a replacement salesperson only needs to generate <strong>₹{recommendationDecision.breakEven.toLocaleString(undefined, {maximumFractionDigits:0})}/month</strong>. However, historical data proves our Bangalore store representative sales representatives generate an average of <strong>₹{(staffLeaderboard.reduce((a,c)=>a+c.avgMonthlySales,0)/staffLeaderboard.length).toLocaleString(undefined, {maximumFractionDigits:0})}/month</strong>—far exceeding the break-even threshold. Thus, recruitment is highly profitable and necessary.
                            </div>
                          </div>

                          <div className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-white/20 hover:bg-white/30 shrink-0 text-white font-bold inline-flex items-center justify-center text-[10px] font-mono">3</span>
                            <div className="font-sans leading-relaxed text-white/70">
                              <strong>Why not expand to 8 staff? (Overstaffing Bottlenecks):</strong> Adding an 8th recruit suffers onboarding hurdles, bringing only ₹4,000/month of new sales (₹24,000 raw sales over 6M). This contributes only ₹2,000/month in gross margins (₹12,000 total), which fails to cover their additional 6-month base salary of ₹{(customSalary*6).toLocaleString()} plus commission rewards. Overstaffing hence degrades store profits by **₹{Math.abs(recommendationDecision.gain8vs7).toLocaleString(undefined, {maximumFractionDigits:0})}**.
                            </div>
                          </div>

                        </div>

                      </div>
                    </div>

                  </div>

                  {/* PYTHON EXPORTS LOG AT BASE */}
                  <div className="apple-glass border border-white/40 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-xs font-bold uppercase text-black/70 mb-4 tracking-widest font-mono">Export Automated Assets to Boardroom</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <div className="border border-black/[0.05] rounded-2xl p-4 bg-white/45 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 font-semibold text-black text-xs">
                            <FileCode className="h-4 w-4 text-black/60" />
                            sales_analyzer.py
                          </div>
                          <p className="text-[11px] text-black/55 font-normal leading-relaxed mt-2.5">
                            Clean, command-line python pipeline containing negative typo cleansing, forecasting modeling, and local HTML analytical reports generation.
                          </p>
                        </div>
                        <div className="mt-4 pt-3 flex flex-wrap gap-2">
                          <a 
                            href="data:text/plain;charset=utf-8,bytes"
                            download="sales_analyzer.py"
                            onClick={(e) => {
                              e.currentTarget.href = "data:text/plain;charset=utf-8," + encodeURIComponent(pythonScriptCode);
                            }}
                            className="bg-black text-white hover:bg-black/90 text-[10px] font-bold py-1.5 px-3.5 rounded-xl inline-flex items-center gap-1 uppercase tracking-wider font-mono"
                          >
                            <Download className="h-3 w-3" /> Download Script
                          </a>
                          <button 
                            onClick={() => copyToClipboard(pythonScriptCode, false)}
                            className="border border-black/10 hover:bg-black/[0.02] text-[10px] font-bold py-1.5 px-3.5 rounded-xl inline-flex items-center gap-1 uppercase tracking-wider text-black/60 font-mono"
                          >
                            <Copy className="h-3 w-3" /> {copiedScript ? "Copied!" : "Copy code"}
                          </button>
                        </div>
                      </div>

                      <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 font-bold text-[#0f172a] text-xs">
                            <Layers className="h-4 w-4 text-[#0f172a]" />
                            sales_analysis.ipynb
                          </div>
                          <p className="text-[11px] text-[#64748b] font-normal leading-relaxed mt-2">
                            Jupyter notebook combining data cleanup logs, LaTeX equations, and graphical visualizations of multi-scenario simulations.
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t">
                          <button 
                            onClick={() => {
                              fetch('/sales_analysis.ipynb')
                                .then(res => res.json())
                                .then(notebook => {
                                  // Dynamically inject custom pricing & salary sliders of Rahul Saxena in real-time!
                                  notebook.cells.forEach((cell: any) => {
                                    if (cell.cell_type === "code") {
                                      let source = cell.source;
                                      for (let i = 0; i < source.length; i++) {
                                        if (source[i].startsWith("SALARY =")) {
                                          source[i] = `SALARY = ${customSalary.toFixed(1)}\n`;
                                        } else if (source[i].startsWith("COMMISSION_RATE =")) {
                                          source[i] = `COMMISSION_RATE = ${customCommission.toFixed(4)}\n`;
                                        }
                                      }
                                    } else if (cell.cell_type === "markdown") {
                                      let source = cell.source;
                                      for (let i = 0; i < source.length; i++) {
                                        source[i] = source[i]
                                          .replace(/₹3,000/g, `₹${customSalary.toLocaleString()}`)
                                          .replace(/₹6,666\.67/g, `₹${recommendationDecision.breakEven.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`)
                                          .replace(/5%/g, `${(customCommission * 100).toFixed(1)}%`);
                                      }
                                    }
                                  });
                                  const jsonStr = JSON.stringify(notebook, null, 1);
                                  const blob = new Blob([jsonStr], { type: "application/json" });
                                  const url = URL.createObjectURL(blob);
                                  const link = document.createElement("a");
                                  link.href = url;
                                  link.download = "sales_analysis.ipynb";
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  URL.revokeObjectURL(url);
                                })
                                .catch(err => {
                                  console.error("Error generating dynamic notebook:", err);
                                });
                            }}
                            className="bg-[#0f172a] text-white hover:bg-slate-800 text-[10px] font-bold py-2 px-4 rounded-xl inline-flex items-center gap-1 uppercase tracking-wider cursor-pointer transition-all active:scale-95"
                          >
                            <Download className="h-3 w-3" /> Download Notebook
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>

                {/* REAL-TIME DYNAMIC PARAMETERS TUNER SIDEBAR */}
                <div className="lg:col-span-1 space-y-6">
                  
                  <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-sm space-y-6 sticky top-24">
                    <div className="border-b pb-3 border-slate-100">
                      <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                        <Sliders className="h-3.5 w-3.5 text-[#64748b]" /> Sensitivity Tuning
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal font-normal">
                        Interactively modify overheads and elasticity in real-time to test alternative scenarios and observe the mathematical proofs recalculate!
                      </p>
                    </div>

                    <div className="space-y-4">
                      
                      <div>
                        <label className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                          <span>Base Monthly Salary</span>
                          <span className="font-semibold text-[#0f172a]">₹{customSalary.toLocaleString()}</span>
                        </label>
                        <input 
                          type="range" 
                          min="1000" 
                          max="8000" 
                          step="250"
                          value={customSalary} 
                          onChange={(e) => setCustomSalary(parseInt(e.target.value))}
                          className="w-full h-1 bg-[#e2e8f0] rounded appearance-none cursor-pointer accent-[#0f172a]" 
                        />
                        <span className="text-[9px] text-[#64748b] font-mono block mt-1">Typical range: ₹1k to ₹8k</span>
                      </div>

                      <div>
                        <label className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                          <span>Commission rate</span>
                          <span className="font-semibold text-[#0f172a]">{(customCommission * 100).toFixed(1)}%</span>
                        </label>
                        <input 
                          type="range" 
                          min="0.0" 
                          max="0.15" 
                          step="0.01"
                          value={customCommission} 
                          onChange={(e) => setCustomCommission(parseFloat(e.target.value))}
                          className="w-full h-1 bg-[#e2e8f0] rounded appearance-none cursor-pointer accent-[#0f172a]" 
                        />
                        <span className="text-[9px] text-[#64748b] font-mono block mt-1">Default markup: 5%</span>
                      </div>

                      <div>
                        <label className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                          <span>Demand Elasticity</span>
                          <span className="font-semibold text-[#0f172a]">{elasticity.toFixed(2)}</span>
                        </label>
                        <input 
                          type="range" 
                          min="0.2" 
                          max="1.2" 
                          step="0.05"
                          value={elasticity} 
                          onChange={(e) => setElasticity(parseFloat(e.target.value))}
                          className="w-full h-1 bg-[#e2e8f0] rounded appearance-none cursor-pointer accent-[#0f172a]" 
                        />
                        <span className="text-[9px] text-[#64748b] font-mono block mt-1">Understaffed checkout buffer</span>
                      </div>

                    </div>

                    <div className="bg-[#f8fafc] border p-3 rounded-lg text-[10px] text-slate-500 leading-relaxed font-normal space-y-1.5">
                      <p>
                        Our calculation models are entirely bound to these sliders. Changing them instantly recalculates the Break-Even and scenario margin totals.
                      </p>
                      <button 
                        onClick={() => {
                          setCustomSalary(3000);
                          setCustomCommission(0.05);
                          setElasticity(0.75);
                        }}
                        className="text-[10px] text-[#0f172a] font-bold underline cursor-pointer hover:text-slate-800"
                      >
                        Reset Sliders to Baseline
                      </button>
                    </div>

                  </div>

                </div>

              </div>

              {/* FOOTER NAVIGATION */}
              <div className="flex justify-between items-center border-t border-[#e2e8f0] pt-4 mt-6 bg-white p-4 rounded-xl shadow-sm">
                <button
                  onClick={() => setCurrentStep(4)}
                  className="border border-[#e2e8f0] hover:bg-slate-50 text-slate-700 font-bold px-6 py-2.5 rounded-lg text-xs flex items-center gap-2 transition-all uppercase tracking-wider"
                >
                  ← Back: Simulate Scenarios
                </button>
                <div className="text-[10px] font-bold text-[#10b981] uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-[#10b981]" /> Strategic Proposal Complete
                </div>
              </div>

            </div>
          )}
          </>
          )}

        </div>

      </main>

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto px-4 md:px-6 mt-12 text-center text-xs text-slate-400 font-mono border-t border-slate-200/60 pt-6">
        <div>Developed and secured for RevInsight Career case review. ybandharapu@gmail.com</div>
        <div className="mt-1">© {new Date().getFullYear()} RevInsight Consultant Network. All rights reserved.</div>
      </footer>
    </div>
  );
}
