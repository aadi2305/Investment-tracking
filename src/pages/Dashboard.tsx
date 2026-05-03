/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { usePortfolio } from "../context/PortfolioContext";
import { calculateAbsoluteReturn, calculateCAGR, calculateXIRR } from "../utils/finance";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Target, Wallet, Briefcase, Zap } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

const COLORS = ["#2563eb", "#22c55e", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];

export const Dashboard = ({ onNavigate }: { onNavigate: (tab: string) => void }) => {
  const { goals, funds, transactions, seedSampleData, dataLoading } = usePortfolio();

  const portfolioWithMetrics = funds.map(fund => {
    const fundTxs = transactions.filter(t => t.fundId === fund.id);
    const invested = fundTxs.reduce((acc, t) => acc + t.amount, 0);
    const units = fundTxs.reduce((acc, t) => acc + (t.units || 0), 0);
    
    // Calculate current value for this fund
    const current = fund.isCustomBalance ? fund.currentNAV : (units * fund.currentNAV);
    const absGain = current - invested;
    const percGain = invested > 0 ? (absGain / invested) * 100 : 0;

    // Calculate individual fund XIRR
    const cashFlows = [
      ...fundTxs.map(tx => ({ date: new Date(tx.date), amount: -tx.amount })),
      { date: new Date(), amount: current }
    ];
    const xirr = calculateXIRR(cashFlows);
    
    return { ...fund, invested, units, current, absGain, percGain, xirr };
  });

  const totalInvested = portfolioWithMetrics.reduce((acc, f) => acc + f.invested, 0);
  const totalValue = portfolioWithMetrics.reduce((acc, f) => acc + f.current, 0);

  const { absolute, percentage } = calculateAbsoluteReturn(totalInvested, totalValue);
  
  // Calculate Portfolio XIRR
  const portfolioCashFlows = [
    ...transactions.map(tx => ({ date: new Date(tx.date), amount: -tx.amount })),
    { date: new Date(), amount: totalValue }
  ];
  const portfolioXirr = calculateXIRR(portfolioCashFlows);

  // For CAGR, we'd need earliest transaction date
  const earliestTx = transactions.length > 0 
    ? new Date(Math.min(...transactions.map(t => new Date(t.date).getTime())))
    : new Date();
  
  const cagr = calculateCAGR(totalInvested, totalValue, earliestTx);

  const goalData = goals.map(goal => {
    // Precise current value for this goal: 
    // sum(units_in_tx_for_this_goal * fund.currentNAV)
    let goalCurrentValue = 0;
    let goalInvested = 0;

    transactions.filter(t => t.goalId === goal.id).forEach(tx => {
      const fund = funds.find(f => f.id === tx.fundId);
      if (fund) {
        goalInvested += tx.amount;
        if (fund.isCustomBalance) {
          // If it's a fixed balance, we estimate the portion belonging to this goal 
          // based on the transaction amount's proportion to the total invested in that fund
          const totalInFund = transactions.filter(t => t.fundId === fund.id).reduce((acc, t) => acc + t.amount, 0);
          const proportion = totalInFund > 0 ? tx.amount / totalInFund : 0;
          goalCurrentValue += fund.currentNAV * proportion;
        } else {
          goalCurrentValue += (tx.units || 0) * fund.currentNAV;
        }
      }
    });

    const progress = (goalInvested / goal.targetAmount) * 100;
    
    return {
      ...goal,
      invested: goalInvested,
      current: goalCurrentValue,
      progress: Math.min(progress, 100)
    };
  });

  const fundAllocationData = portfolioWithMetrics.map(f => ({
    name: f.name,
    value: f.current
  })).filter(f => f.value > 0);

  const goalAllocationData = goalData.map(g => ({
    name: g.name,
    value: g.current
  })).filter(g => g.value > 0);

  // Show a loading skeleton/state while fetching data from DB
  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest animate-pulse">Syncing Vault...</p>
        </div>
      </div>
    );
  }

  // If no transactions, show a get started screen
  if (transactions.length === 0 && goals.length === 0 && funds.length === 0) {
    return (
      <div className="flex flex-col items-start justify-start py-12 md:py-20 space-y-8 max-w-2xl px-6 md:px-0">
        <div className="w-20 h-20 bg-black rounded-[24px] flex items-center justify-center shadow-xl shadow-gray-200">
          <Briefcase className="text-white" size={32} />
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Welcome to Vault.ai</h2>
          <p className="text-gray-500 text-sm font-medium max-w-md">Define your financial future and track every capital allocation in one secure dashboard.</p>
        </div>
        <div className="flex flex-col sm:flex-row w-full gap-4 pt-4">
          <button 
            onClick={() => onNavigate("goals")}
            className="px-8 py-4 bg-black text-white font-bold rounded-2xl cursor-pointer hover:opacity-90 transition shadow-lg active:scale-95"
          >
            Create Your First Goal
          </button>
          <button 
            onClick={() => seedSampleData()}
            className="px-8 py-4 bg-white border border-gray-200 text-gray-900 font-bold rounded-2xl cursor-pointer hover:bg-gray-50 transition text-xs uppercase tracking-widest"
          >
            Explore Demo Portfolio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-min md:min-h-[640px]">
      {/* Portfolio Summary */}
      <div className="bento-card col-span-1 md:col-span-2 md:row-span-1 border-2 border-black">
        <div className="flex justify-between items-start mb-4">
          <span className="pill">Portfolio Summary</span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
        </div>
        <div className="flex items-baseline gap-3 mb-6">
          <span className="text-3xl md:text-4xl font-bold tracking-tighter">₹{totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          <span className={cn("text-xs md:text-sm font-bold flex items-center", percentage >= 0 ? "text-accent-green" : "text-red-500")}>
            {percentage >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(percentage).toFixed(1)}%
          </span>
        </div>
        <div className="mt-auto flex flex-wrap gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          <span>Invested: ₹{(totalInvested / 100000).toFixed(1)}L</span>
          <span>Returns: ₹{(absolute / 1000).toFixed(1)}K</span>
          <span className="text-black">XIRR: {portfolioXirr.toFixed(1)}%</span>
        </div>
      </div>

      {/* NAV Status / Last Update */}
      <div className="bento-card col-span-1 md:row-span-1">
        <div className="flex justify-between items-start mb-3">
          <span className="pill">System Status</span>
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-lg font-bold tracking-tight">Market Analytics</div>
          <div className="text-[10px] text-gray-500 font-medium">Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          <div className="mt-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
            <span className="text-[10px] font-bold uppercase tracking-tight">Firebase Synchronized</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bento-card col-span-1 md:row-span-1">
        <span className="pill mb-3 w-fit">Quick Actions</span>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <button onClick={() => onNavigate("add")} className="p-2 border border-gray-100 rounded-lg text-[10px] font-bold hover:bg-gray-50 transition-colors">NEW TX</button>
          <button onClick={() => onNavigate("goals")} className="p-2 border border-gray-100 rounded-lg text-[10px] font-bold hover:bg-gray-50 transition-colors">GOALS</button>
          <button onClick={() => onNavigate("funds")} className="p-2 border border-gray-100 rounded-lg text-[10px] font-bold hover:bg-gray-50 transition-colors">VALUATION</button>
          <button onClick={() => seedSampleData()} className="p-2 border border-gray-100 rounded-lg text-[10px] font-bold bg-gray-50 hover:bg-gray-100 transition-colors">RESET DATA</button>
        </div>
      </div>

      {/* Active Goals */}
      <div className="bento-card col-span-1 md:col-span-2 md:row-span-2">
        <div className="flex justify-between items-center mb-6">
          <span className="pill">Active Goals</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{goals.length} Ongoing</span>
        </div>
        <div className="space-y-6 overflow-y-auto max-h-[300px] pr-2">
          {goalData.map(goal => (
            <div key={goal.id} className="space-y-2">
              <div className="flex justify-between text-sm items-baseline">
                <span className="font-bold tracking-tight">{goal.name}</span>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-black">₹{goal.invested.toLocaleString()} / {goal.targetAmount.toLocaleString()}</div>
                  <div className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">Value: ₹{goal.current.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
              </div>
              <div className="progress-bg h-1.5">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${goal.progress}%` }}
                   transition={{ duration: 0.8, ease: "easeOut" }}
                   className="progress-fill" 
                 />
               </div>
             </div>
           ))}
           {goals.length === 0 && <div className="text-gray-300 text-xs italic text-center">No goals defined.</div>}
         </div>
         <div className="mt-auto pt-4 text-[9px] text-gray-400 font-bold uppercase tracking-widest">
           {goalData.length > 0 ? "Track progress vs target amount" : "Define your first goal to track progress"}
         </div>
       </div>
 
       {/* Asset Allocation */}
       <div className="bento-card col-span-1 md:col-span-2 md:row-span-2">
         <span className="pill mb-4 w-fit">Asset Allocation</span>
         <div className="flex-1 flex flex-col justify-center space-y-6">
           {portfolioWithMetrics.slice(0, 4).map((fund, idx) => (
             <div key={fund.id} className="flex items-center gap-4">
               <div className="w-4 h-4 rounded-md" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
               <div className="flex-1">
                 <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider mb-1.5">
                   <span className="truncate">{fund.name}</span>
                   <span className="text-black">{((fund.current / totalValue) * 100).toFixed(0)}%</span>
                 </div>
                 <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                   <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(fund.current / totalValue) * 100}%` }}
                    className="h-full" 
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }} 
                   />
                 </div>
               </div>
               <div className="text-right min-w-[80px]">
                 <div className="text-[11px] font-bold">₹{fund.current.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                 <div className="text-[10px] text-accent-green font-bold">+{fund.percGain.toFixed(1)}%</div>
               </div>
             </div>
           ))}
           {funds.length === 0 && <div className="text-gray-300 text-xs italic text-center">No assets found.</div>}
         </div>
       </div>
 
       {/* Footer Metrics */}
      <div className="bento-card col-span-1 md:col-span-3 md:row-span-1">
          <div className="flex flex-col md:flex-row justify-between items-center h-full text-sm font-medium px-4 gap-6 md:gap-0 py-4 md:py-0">
          <div className="text-left w-full">
            <div className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mb-1">Total Assets</div>
            <div className="text-xl md:text-2xl font-bold tracking-tighter">₹{totalValue.toLocaleString()}</div>
          </div>
          <div className="hidden md:block w-px h-8 bg-gray-100"></div>
          <div className="text-left w-full md:pl-8">
            <div className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mb-1">Avg Transaction</div>
            <div className="text-xl md:text-2xl font-bold tracking-tighter">
              ₹{transactions.length > 0 ? (totalInvested / transactions.length).toLocaleString(undefined, { maximumFractionDigits: 0 }) : 0}
            </div>
          </div>
          <div className="hidden md:block w-px h-8 bg-gray-100"></div>
          <div className="text-left w-full md:pl-8">
            <div className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mb-1">Portfolio XIRR</div>
            <div className="text-xl md:text-2xl font-bold tracking-tighter text-blue-600">{portfolioXirr.toFixed(1)}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, subValue, icon, trend, isPercentage, isCurrency = true }: any) => (
  <motion.div 
    whileHover={{ y: -2 }}
    className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3"
  >
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium uppercase tracking-wider text-gray-400">{label}</span>
      <div className="p-2 bg-gray-50 rounded-xl">{icon}</div>
    </div>
    <div className="space-y-1">
      <h3 className="text-2xl font-bold tracking-tight">
        {isPercentage ? `${value.toFixed(2)}%` : `₹${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
      </h3>
      {subValue && (
        <div className={cn("text-xs font-medium flex items-center gap-1", trend === "up" ? "text-green-600" : "text-red-600")}>
          {trend === "up" ? "+" : ""}{subValue}
        </div>
      )}
    </div>
  </motion.div>
);

const GoalCard = ({ goal }: any) => (
  <motion.div 
    whileHover={{ scale: 1.01 }}
    className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4"
  >
    <div className="flex justify-between items-start">
      <div>
        <h4 className="font-semibold text-gray-900">{goal.name}</h4>
        <p className="text-xs text-gray-500">Target: ₹{goal.targetAmount.toLocaleString()}</p>
      </div>
      <div className="text-right">
        <span className="text-sm font-bold text-blue-600">{Math.round(goal.progress)}%</span>
      </div>
    </div>
    
    <div className="space-y-2">
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${goal.progress}%` }}
          className="h-full bg-blue-600 rounded-full"
        />
      </div>
      <div className="flex justify-between text-[10px] uppercase tracking-tighter text-gray-400 font-bold">
        <span>₹{Math.round(goal.current).toLocaleString()}</span>
        <span>Remaining: ₹{Math.round(Math.max(0, goal.targetAmount - goal.current)).toLocaleString()}</span>
      </div>
    </div>
  </motion.div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="bg-gray-50 border border-dashed border-gray-200 rounded-3xl p-8 text-gray-400 text-sm">
    {message}
  </div>
);
