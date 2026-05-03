/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { usePortfolio } from "../context/PortfolioContext";
import { 
  PlusCircle, Search, Filter, Trash2, ArrowRight, Gauge, 
  ArrowUpRight, ArrowDownRight, Tag, Edit2, Scissors, X, 
  Check, Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { mfService } from "../services/mfService";
import { cn } from "../lib/utils";
import { Transaction } from "../types";

export const History = () => {
  const { transactions, goals, funds, deleteTransaction, updateTransaction, splitTransaction, dataLoading } = usePortfolio();
  const [filter, setFilter] = useState({ fund: "", goal: "", search: "" });
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [splittingTx, setSplittingTx] = useState<Transaction | null>(null);
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  const filteredTransactions = transactions.filter(t => {
    const fund = funds.find(f => f.id === t.fundId);
    const goal = goals.find(g => g.id === t.goalId);
    const searchMatch = !filter.search || 
      fund?.name.toLowerCase().includes(filter.search.toLowerCase()) ||
      goal?.name.toLowerCase().includes(filter.search.toLowerCase());
    
    return searchMatch && 
           (!filter.fund || t.fundId === filter.fund) && 
           (!filter.goal || t.goalId === filter.goal);
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Transaction Log</h1>
        <p className="text-gray-500 text-xs md:text-sm italic">Audit your investment journey.</p>
      </header>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={16} />
          <input 
            type="text"
            placeholder="Search funds or goals..."
            value={filter.search}
            onChange={(e) => setFilter({...filter, search: e.target.value})}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl text-xs font-semibold focus:border-black focus:ring-0 transition-all placeholder:text-gray-300"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-44">
            <select 
              value={filter.fund}
              onChange={(e) => setFilter({...filter, fund: e.target.value})}
              className="w-full pl-4 pr-10 py-3.5 bg-white border border-gray-100 rounded-2xl text-[10px] font-bold uppercase tracking-widest focus:border-black focus:ring-0 appearance-none cursor-pointer truncate"
            >
              <option value="">All Assets</option>
              {funds.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={12} />
          </div>
          <div className="relative flex-1 md:w-44">
            <select 
              value={filter.goal}
              onChange={(e) => setFilter({...filter, goal: e.target.value})}
              className="w-full pl-4 pr-10 py-3.5 bg-white border border-gray-100 rounded-2xl text-[10px] font-bold uppercase tracking-widest focus:border-black focus:ring-0 appearance-none cursor-pointer truncate"
            >
              <option value="">All Contexts</option>
              {goals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={12} />
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredTransactions.map((t) => {
            const fund = funds.find(f => f.id === t.fundId);
            const goal = goals.find(g => g.id === t.goalId);
            const isBuy = t.amount >= 0;

            return (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={t.id} 
                className="group bento-card !p-3 md:!p-4 bg-white border border-gray-100 hover:border-gray-200 transition-all flex items-center justify-between"
              >
                <div className="flex items-start gap-3 md:gap-5">
                  <div className={cn(
                    "w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 mt-0.5",
                    isBuy ? "bg-accent-green/10 text-accent-green" : "bg-red-50 text-red-500"
                  )}>
                    {isBuy ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                       <h3 className="text-sm md:text-base font-bold tracking-tight text-gray-900 truncate max-w-[140px] md:max-w-xs">{fund?.name || "Deleted Asset"}</h3>
                       <span className={cn(
                         "text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded",
                         isBuy ? "bg-accent-green/5 text-accent-green" : "bg-red-50 text-red-500"
                       )}>
                         {isBuy ? "Purchase" : "Removal"}
                       </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                        {new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {goal && (
                        <>
                          <span className="w-1 h-1 bg-gray-200 rounded-full" />
                          <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 uppercase tracking-tighter">
                            <Tag size={10} /> {goal.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 md:gap-4 lg:gap-8">
                  <div className="text-left md:text-right">
                    <div className={cn("text-base md:text-lg font-bold tracking-tighter", isBuy ? "text-gray-900" : "text-red-500")}>
                      {isBuy ? "+" : "-"}₹{Math.abs(t.amount).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-gray-400 font-medium italic">
                      {t.units ? `${Math.abs(t.units).toFixed(3)} Units` : "Lump Sum"}
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setSplittingTx(t)}
                      className="p-2 text-gray-200 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all md:opacity-0 md:group-hover:opacity-100"
                      title="Split transaction"
                    >
                      <Scissors size={14} />
                    </button>
                    <button 
                      onClick={() => setEditingTx(t)}
                      className="p-2 text-gray-200 hover:text-black hover:bg-gray-100 rounded-xl transition-all md:opacity-0 md:group-hover:opacity-100"
                      title="Edit goal"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => setTxToDelete(t)}
                      className="p-2 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all md:opacity-0 md:group-hover:opacity-100"
                      title="Delete record"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredTransactions.length === 0 && (
          <div className="py-20 text-gray-400 italic text-sm">
            No transactions match your criteria.
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl space-y-6"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold tracking-tight">Reassign Goal</h3>
              <button onClick={() => setEditingTx(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-2xl">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Transaction</div>
                <div className="font-bold text-sm">₹{editingTx.amount.toLocaleString()} in {funds.find(f => f.id === editingTx.fundId)?.name}</div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">New Goal Assignment</label>
                <select 
                  value={editingTx.goalId || ""}
                  onChange={(e) => {
                    updateTransaction(editingTx.id, { goalId: e.target.value || null });
                    setEditingTx(null);
                  }}
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold text-sm focus:ring-2 focus:ring-black transition-all"
                >
                  <option value="">No Goal (General Portfolio)</option>
                  {goals.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Split Modal */}
      {splittingTx && (
        <SplitModal 
          transaction={splittingTx} 
          goals={goals} 
          onClose={() => setSplittingTx(null)} 
          onSplit={async (splits) => {
            await splitTransaction(splittingTx.id, splits);
            setSplittingTx(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {txToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTxToDelete(null)}
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
                <h3 className="text-xl font-bold tracking-tight text-gray-900">Delete Record?</h3>
                <p className="text-sm text-gray-500">This will permanently remove the transaction of ₹{Math.abs(txToDelete.amount).toLocaleString()} from your history. This action cannot be undone.</p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    deleteTransaction(txToDelete.id);
                    setTxToDelete(null);
                  }}
                  className="w-full py-4 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 shadow-lg shadow-red-100 transition-colors"
                >
                  DELETE PERMANENTLY
                </button>
                <button
                  onClick={() => setTxToDelete(null)}
                  className="w-full py-4 bg-gray-50 text-gray-400 font-bold rounded-2xl hover:bg-gray-100 hover:text-gray-900 transition-all font-bold"
                >
                  KEEP IT
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface SplitModalProps {
  transaction: Transaction;
  goals: any[];
  onClose: () => void;
  onSplit: (splits: Omit<Transaction, "id">[]) => Promise<void>;
}

const SplitModal = ({ transaction, goals, onClose, onSplit }: SplitModalProps) => {
  const [splits, setSplits] = useState([
    { amount: transaction.amount / 2, goalId: transaction.goalId || "" },
    { amount: transaction.amount / 2, goalId: "" }
  ]);

  const totalSplitAmount = splits.reduce((sum, s) => sum + s.amount, 0);
  const diff = transaction.amount - totalSplitAmount;
  const isValid = Math.abs(diff) < 0.01;

  const handleSplit = () => {
    if (!isValid) return;
    
    const formattedSplits = splits.map(s => {
      // Pro-rata units if they exist
      const unitRatio = s.amount / transaction.amount;
      const units = transaction.units ? transaction.units * unitRatio : undefined;
      
      return {
        ...transaction,
        amount: s.amount,
        units,
        goalId: s.goalId || null,
        id: undefined // Remove original ID
      } as any;
    });

    onSplit(formattedSplits);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl space-y-8 my-8"
      >
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold tracking-tight">Split Transaction</h3>
            <p className="text-gray-400 text-xs mt-1 italic">Original: ₹{transaction.amount.toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          {splits.map((split, index) => (
            <div key={index} className="p-5 border border-gray-100 rounded-3xl space-y-4 relative">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Segment {index + 1}</span>
                {splits.length > 2 && (
                  <button 
                    onClick={() => setSplits(splits.filter((_, i) => i !== index))}
                    className="text-red-500 hover:bg-red-50 p-1 rounded"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-gray-400">Amount</label>
                  <input 
                    type="number"
                    value={split.amount}
                    onChange={(e) => {
                      const newSplits = [...splits];
                      newSplits[index].amount = Number(e.target.value);
                      setSplits(newSplits);
                    }}
                    className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 font-bold text-sm focus:ring-1 focus:ring-black"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-gray-400">Goal</label>
                  <select 
                    value={split.goalId}
                    onChange={(e) => {
                      const newSplits = [...splits];
                      newSplits[index].goalId = e.target.value;
                      setSplits(newSplits);
                    }}
                    className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 font-bold text-xs focus:ring-1 focus:ring-black appearance-none"
                  >
                    <option value="">No Goal</option>
                    {goals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))}

          <button 
            onClick={() => setSplits([...splits, { amount: diff > 0 ? diff : 0, goalId: "" }])}
            className="w-full py-3 border-2 border-dashed border-gray-100 rounded-3xl text-gray-400 font-bold text-[10px] uppercase tracking-widest hover:border-black hover:text-black transition-all"
          >
            + Add Another Segment
          </button>
        </div>

        <div className="pt-6 border-t border-gray-50 flex flex-col gap-4">
          <div className={cn(
            "p-4 rounded-2xl flex items-center justify-between font-bold text-xs",
            isValid ? "bg-accent-green/10 text-accent-green" : "bg-red-50 text-red-500"
          )}>
            <div className="flex items-center gap-2">
              {isValid ? <Check size={14} /> : <Info size={14} />}
              <span>{isValid ? "Amounts align perfectly" : `Mismatch: ₹${diff.toLocaleString()}`}</span>
            </div>
            <span>∑ ₹{totalSplitAmount.toLocaleString()}</span>
          </div>

          <button 
            disabled={!isValid}
            onClick={handleSplit}
            className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:opacity-90 disabled:opacity-30 transition-all flex items-center justify-center gap-2 shadow-xl shadow-gray-200"
          >
            CONFIRM SPLIT <Scissors size={16} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const AddInvestment = ({ onSuccess }: { onSuccess?: () => void }) => {
  const { funds, goals, addTransaction, dataLoading } = usePortfolio();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<"buy" | "sell">("buy");

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  // Auto-NAV states
  const [amount, setAmount] = useState<number>(0);
  const [selectedFundId, setSelectedFundId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [nav, setNav] = useState<number | null>(null);
  const [units, setUnits] = useState<number | null>(null);
  const [isFetchingNAV, setIsFetchingNAV] = useState(false);

  useEffect(() => {
    const fetchNAV = async () => {
      const fund = funds.find(f => f.id === selectedFundId);
      if (fund?.schemeCode && date) {
        setIsFetchingNAV(true);
        try {
          const result = await mfService.getHistoricalNAV(fund.schemeCode, date);
          if (result) {
            setNav(result.nav);
          } else {
            setNav(null);
          }
        } catch (e) {
          console.error(e);
          setNav(null);
        } finally {
          setIsFetchingNAV(false);
        }
      } else {
        setNav(null);
      }
    };

    fetchNAV();
  }, [selectedFundId, date, funds]);

  useEffect(() => {
    if (amount > 0 && nav && nav > 0) {
      setUnits(amount / nav);
    } else {
      setUnits(null);
    }
  }, [amount, nav]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    // Adjust signs for redemption
    const finalAmount = type === "buy" ? amount : -amount;
    const finalUnits = units ? (type === "buy" ? units : -units) : undefined;
    
    try {
      await addTransaction({
        amount: finalAmount,
        date: date,
        fundId: selectedFundId,
        goalId: (e.currentTarget.elements.namedItem("goalId") as HTMLSelectElement).value || null,
        units: finalUnits
      });
      onSuccess?.();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 md:space-y-8 py-4">
      <header className="space-y-1 md:space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tighter">Log Activity</h1>
        <p className="text-gray-400 text-[8px] md:text-[9px] italic font-medium uppercase tracking-widest">Update your capital positions</p>
      </header>

      <div className="bento-card !p-6 md:!p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-gray-50/50 rounded-bl-[100px] z-0" />
        <form onSubmit={handleSubmit} className="relative z-10 space-y-6 md:space-y-8">
          
          {/* Buy/Sell Toggle */}
          <div className="flex p-1 bg-gray-100 rounded-2xl w-full md:w-64">
            <button
              type="button"
              onClick={() => setType("buy")}
              className={cn(
                "flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all",
                type === "buy" ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              Purchase
            </button>
            <button
              type="button"
              onClick={() => setType("sell")}
              className={cn(
                "flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all",
                type === "sell" ? "bg-white text-red-500 shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              Redemption
            </button>
          </div>

          <div className="space-y-6 md:space-y-10">
            <div className="space-y-2 md:space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                {type === "buy" ? "Investment Amount" : "Redemption Amount"}
              </label>
              <div className="relative">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl md:text-3xl font-bold text-gray-300">₹</span>
                <input
                  name="amount"
                  type="number"
                  required
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="0.00"
                  className={cn(
                    "w-full pl-6 md:pl-8 pr-4 py-3 md:py-4 text-3xl md:text-5xl font-bold bg-transparent border-b border-gray-100 focus:outline-none transition-all placeholder:text-gray-100 tracking-tighter",
                    type === "buy" ? "focus:border-black" : "focus:border-red-500 text-red-500"
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Target Fund</label>
                <select 
                  name="fundId" 
                  required 
                  value={selectedFundId}
                  onChange={(e) => setSelectedFundId(e.target.value)}
                  className="w-full px-4 py-4 bg-gray-50 border-none rounded-xl focus:bg-white focus:ring-1 focus:ring-black transition-all font-bold text-sm"
                >
                  <option value="">Select Fund</option>
                  {funds.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Associated Goal</label>
                <select name="goalId" className="w-full px-4 py-4 bg-gray-50 border-none rounded-xl focus:bg-white focus:ring-1 focus:ring-black transition-all font-bold text-sm">
                  <option value="">No Goal (General)</option>
                  {goals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Execution Date</label>
              <input
                name="date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-4 bg-gray-50 border-none rounded-xl focus:bg-white focus:ring-1 focus:ring-black transition-all"
              />
            </div>
            
            {/* Units Preview Section */}
            {(nav !== null || isFetchingNAV) && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <Gauge className="text-gray-400" size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">NAV Calculation</div>
                    <div className="text-sm font-bold tracking-tight">
                      {isFetchingNAV ? "Fetching NAV..." : `₹${nav?.toFixed(4)} Per Unit`}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {type === "buy" ? "Units Credited" : "Units Redeemed"}
                  </div>
                  <div className={cn("text-base font-bold tracking-tighter", type === "buy" ? "text-black" : "text-red-500")}>
                    {units ? units.toFixed(3) : "—"}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <button
            disabled={loading || isFetchingNAV}
            className={cn(
              "w-full py-5 text-white font-bold rounded-xl hover:opacity-90 transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2 disabled:opacity-50",
              type === "buy" ? "bg-black" : "bg-red-500 shadow-lg shadow-red-100"
            )}
          >
            {loading ? "PROCESSING..." : type === "buy" ? "CONFIRM PURCHASE" : "CONFIRM REDEMPTION"}
            {!loading && !isFetchingNAV && <ArrowRight size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
};
