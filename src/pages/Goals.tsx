/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Edit2, Target, Calendar, DollarSign, X, TrendingUp, Clock, Zap } from "lucide-react";
import { usePortfolio } from "../context/PortfolioContext";
import { motion, AnimatePresence } from "motion/react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export const Goals = () => {
  const { goals, addGoal, updateGoal, deleteGoal, transactions } = usePortfolio();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [goalToDelete, setGoalToDelete] = useState<any>(null);

  // Form State for Calculator
  const [calcTarget, setCalcTarget] = useState<number>(0);
  const [calcMonthly, setCalcMonthly] = useState<number>(0);
  const [calcDeadline, setCalcDeadline] = useState<string>("");

  useEffect(() => {
    if (editingGoal) {
      setCalcTarget(editingGoal.targetAmount);
      setCalcMonthly(editingGoal.monthlyInvestment || 0);
      setCalcDeadline(editingGoal.deadline || "");
    } else {
      setCalcTarget(0);
      setCalcMonthly(0);
      setCalcDeadline("");
    }
  }, [editingGoal, isModalOpen]);

  const currentInvested = useMemo(() => {
    if (!editingGoal) return 0;
    return transactions
      .filter(t => t.goalId === editingGoal.id)
      .reduce((acc, t) => acc + t.amount, 0);
  }, [editingGoal, transactions]);

  const projectionData = useMemo(() => {
    if (calcTarget <= 0 || calcMonthly <= 0) return [];
    
    const data = [];
    let current = currentInvested;
    const monthlyRate = 0.008; // Assume 10% annual returns (approx 0.8% monthly) for realistic projection
    let month = 0;
    const maxMonths = 360; // Max 30 years projection

    // Initial point
    data.push({
      month: 0,
      label: "Today",
      value: Math.round(current),
    });

    while (current < calcTarget && month < maxMonths) {
      month++;
      // Simple growth formula: (Current * Rate) + Monthly Contribution
      current = (current * (1 + monthlyRate)) + calcMonthly;
      
      // Only add data points periodically to keep chart clean (every 6 months or last month)
      if (month % 6 === 0 || current >= calcTarget) {
        const date = new Date();
        date.setMonth(date.getMonth() + month);
        data.push({
          month,
          label: date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
          value: Math.round(current),
        });
      }
    }
    return data;
  }, [calcTarget, calcMonthly, currentInvested]);

  const estimatedMonths = projectionData.length > 0 ? projectionData[projectionData.length - 1].month : 0;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      targetAmount: Number(formData.get("targetAmount")),
      deadline: formData.get("deadline") as string || null,
      monthlyInvestment: Number(formData.get("monthlyInvestment")) || null,
      icon: formData.get("icon") as string || null,
    };

    if (editingGoal) {
      updateGoal(editingGoal.id, data);
    } else {
      addGoal(data);
    }
    setIsModalOpen(false);
    setEditingGoal(null);
  };

  const calculateHorizon = (monthly: number, target: number) => {
    const remaining = target - currentInvested;
    if (monthly <= 0 || remaining <= 0) return 0;
    return Math.ceil(remaining / monthly);
  };

  const calculateMonthly = (target: number, deadlineStr: string) => {
    const remaining = target - currentInvested;
    if (!deadlineStr || remaining <= 0) return 0;
    const deadline = new Date(deadlineStr);
    const now = new Date();
    const months = (deadline.getFullYear() - now.getFullYear()) * 12 + (deadline.getMonth() - now.getMonth());
    if (months <= 0) return remaining;
    return Math.ceil(remaining / months);
  };

  const handleMonthlyChange = (val: number) => {
    setCalcMonthly(val);
    const remaining = calcTarget - currentInvested;
    if (val > 0 && remaining > 0) {
      const months = Math.ceil(remaining / val);
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + months);
      setCalcDeadline(futureDate.toISOString().split('T')[0]);
    }
  };

  const handleDeadlineChange = (val: string) => {
    setCalcDeadline(val);
    if (val && calcTarget > currentInvested) {
      const needed = calculateMonthly(calcTarget, val);
      setCalcMonthly(needed);
    }
  };

  const handleTargetChange = (val: number) => {
    setCalcTarget(val);
    const remaining = val - currentInvested;
    if (calcMonthly > 0 && remaining > 0) {
      const months = Math.ceil(remaining / calcMonthly);
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + months);
      setCalcDeadline(futureDate.toISOString().split('T')[0]);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <header className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Your Goals</h1>
          <p className="text-gray-500 text-xs md:text-sm italic">Define what you're saving for.</p>
        </header>
        <button
          onClick={() => { setEditingGoal(null); setIsModalOpen(true); }}
          className="bg-black text-white p-3 md:p-4 rounded-xl md:rounded-2xl hover:opacity-90 shadow-lg transition-transform active:scale-95"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const invested = transactions
            .filter(t => t.goalId === goal.id)
            .reduce((acc, t) => acc + t.amount, 0);
          const progress = Math.min((invested / goal.targetAmount) * 100, 100);

          return (
            <motion.div
              layout
              key={goal.id}
              className="bento-card space-y-4 group cursor-pointer"
              onClick={() => { setEditingGoal(goal); setIsModalOpen(true); }}
            >
              <div className="flex justify-between items-start">
                <span className="pill">Savings Goal</span>
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditingGoal(goal); setIsModalOpen(true); }}
                    className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setGoalToDelete({ id: goal.id, name: goal.name });
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold tracking-tight mb-1">{goal.name}</h3>
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <span>Target: ₹{goal.targetAmount.toLocaleString()}</span>
                    {goal.deadline && <span>Due: {new Date(goal.deadline).toLocaleDateString()}</span>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-black">₹{invested.toLocaleString()} Saved</span>
                    <span className="text-gray-400">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="progress-bg">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="progress-fill" 
                    />
                  </div>
                </div>

                    <div className="pt-2 border-t border-gray-50 flex justify-between items-center">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Monthly Contribution</span>
                      <div className="text-xs font-bold tracking-tight">₹{goal.monthlyInvestment?.toLocaleString()}</div>
                    </div>
                    <div className="text-right space-y-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Current Value</span>
                      <div className="text-xs font-bold tracking-tight text-accent-green">₹{invested.toLocaleString()}</div>
                    </div>
                  </div>
              </div>
            </motion.div>
          );
        })}
        {goals.length === 0 && (
          <div className="col-span-full py-20 space-y-4">
            <p className="text-gray-400 italic">No goals found. Ready to start something new?</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {goalToDelete && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
             <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setGoalToDelete(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[32px] p-8 shadow-2xl space-y-6"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                <Trash2 size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight text-gray-900">Delete Goal?</h3>
                <p className="text-sm text-gray-500">Transactions linked to "{goalToDelete.name}" will remain but will be marked as general investments.</p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    deleteGoal(goalToDelete.id);
                    setGoalToDelete(null);
                  }}
                  className="w-full py-4 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 shadow-lg shadow-red-100"
                >
                  CONFIRM DELETE
                </button>
                <button
                  onClick={() => setGoalToDelete(null)}
                  className="w-full py-4 bg-gray-50 text-gray-400 font-bold rounded-2xl"
                >
                  KEEP GOAL
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-xl bg-white rounded-3xl p-8 shadow-2xl border border-gray-100 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold tracking-tight">{editingGoal ? 'Revise Goal' : 'New Goal'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Goal Name</label>
                      <input
                        name="name"
                        required
                        defaultValue={editingGoal?.name}
                        placeholder="e.g., Retirement Fund"
                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-black focus:ring-0 transition-all font-medium"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Target (₹)</label>
                        <input
                          name="targetAmount"
                          type="number"
                          required
                          value={calcTarget || ""}
                          onChange={(e) => handleTargetChange(Number(e.target.value))}
                          className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-black focus:ring-0 transition-all font-bold text-lg"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Monthly SIP (₹)</label>
                        <input
                          name="monthlyInvestment"
                          type="number"
                          value={calcMonthly || ""}
                          onChange={(e) => handleMonthlyChange(Number(e.target.value))}
                          className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-black focus:ring-0 transition-all font-bold text-lg"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Growth Projection</label>
                        <span className="text-[10px] font-bold text-accent-green uppercase">~10% p.a. expected</span>
                      </div>
                      <div className="h-48 w-full bg-gray-50 rounded-2xl p-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={projectionData}>
                            <defs>
                              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#000" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                            <XAxis 
                              dataKey="label" 
                              fontSize={9} 
                              fontWeight="bold" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{fill: '#9ca3af'}}
                            />
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-black text-white p-2 rounded-lg text-[10px] font-bold border border-white/10">
                                      {payload[0].payload.label}: ₹{payload[0].value?.toLocaleString()}
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="value" 
                              stroke="#000" 
                              strokeWidth={2}
                              fillOpacity={1} 
                              fill="url(#colorValue)" 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex-1 flex flex-col justify-center gap-6 p-8 bg-black text-white rounded-[32px] relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[80px] -mr-8 -mt-8" />
                      
                      <div className="space-y-6 relative z-10">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                             <Clock size={12} /> Estimated Horizon
                          </p>
                          <p className="text-3xl font-bold tracking-tighter">
                            {estimatedMonths > 0 ? (
                              estimatedMonths >= 12 
                                ? `${(estimatedMonths / 12).toFixed(1)} Years` 
                                : `${estimatedMonths} Months`
                            ) : (calcTarget <= currentInvested && calcTarget > 0 ? "Achieved" : "---")}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                            <TrendingUp size={12} /> Target Gap
                          </p>
                          <p className="text-3xl font-bold tracking-tighter">
                            {calcTarget > 0 ? `₹${Math.max(0, calcTarget - currentInvested).toLocaleString()}` : "---"}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                            <Zap size={12} /> Daily Velocity
                          </p>
                          <p className="text-3xl font-bold tracking-tighter">
                            ₹{calcMonthly > 0 ? Math.round(calcMonthly / 30).toLocaleString() : "0"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-6 border-t border-white/10 text-[10px] text-white/60 leading-relaxed font-medium space-y-2">
                        <div>
                          Already invested <span className="text-white font-bold">₹{currentInvested.toLocaleString()}</span>. 
                          Remaining gap: <span className="text-white font-bold">₹{Math.max(0, calcTarget - currentInvested).toLocaleString()}</span>.
                        </div>
                        <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                          {calcDeadline && calcTarget > currentInvested ? (
                            <>To reach this by {new Date(calcDeadline).toLocaleDateString()}, you need a monthly SIP of <span className="text-accent-green font-bold">₹{calculateMonthly(calcTarget, calcDeadline).toLocaleString()}</span>.</>
                          ) : "Keep investing regularly to benefit from compounding."}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Target Date (Auto-calculated)</label>
                      <input
                        name="deadline"
                        type="date"
                        value={calcDeadline}
                        onChange={(e) => handleDeadlineChange(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-black focus:outline-none transition-all text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 border border-gray-100 text-gray-400 font-bold rounded-xl hover:bg-gray-50 transition-all uppercase text-[10px] tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] py-4 bg-black text-white font-bold rounded-xl hover:opacity-90 transition-all active:scale-[0.98] shadow-xl text-[10px] uppercase tracking-widest"
                  >
                    {editingGoal ? 'Confirm Revision' : 'Secure Goal'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
