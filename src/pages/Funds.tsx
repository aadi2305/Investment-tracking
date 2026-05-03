/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Briefcase, TrendingUp, X, RefreshCw, Search, Check, Calculator } from "lucide-react";
import { usePortfolio } from "../context/PortfolioContext";
import { FundType } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { mfService, MFSearchResult } from "../services/mfService";
import { calculateXIRR } from "../utils/finance";
import { cn } from "../lib/utils";

export const Funds = () => {
  const { funds, addFund, updateFund, deleteFund, transactions, refreshNAVs, dataLoading } = usePortfolio();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFund, setEditingFund] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MFSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState<MFSearchResult | null>(null);
  const [fundType, setFundType] = useState<FundType>(FundType.MF);

  const [selectedFundForDetail, setSelectedFundForDetail] = useState<any>(null);
  const [fundToDelete, setFundToDelete] = useState<any>(null);

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    await refreshNAVs();
    setIsRefreshing(false);
  };

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  useEffect(() => {
    if (editingFund) {
      setFundType(editingFund.type);
      setSearchQuery("");
      setSelectedScheme(editingFund.schemeCode ? { schemeCode: Number(editingFund.schemeCode), schemeName: editingFund.name } : null);
    } else {
      setFundType(FundType.MF);
      setSearchQuery("");
      setSelectedScheme(null);
    }
  }, [editingFund, isModalOpen]);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.length >= 3) {
        setIsSearching(true);
        const results = await mfService.searchFunds(searchQuery);
        setSearchResults(results.slice(0, 5));
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSelectScheme = async (scheme: MFSearchResult) => {
    setSelectedScheme(scheme);
    setSearchQuery("");
    setSearchResults([]);
    
    // Auto-fetch latest NAV
    const details = await mfService.getLatestNAV(scheme.schemeCode.toString());
    if (details) {
      const navInput = document.getElementById("currentNAV") as HTMLInputElement;
      const nameInput = document.getElementById("fundName") as HTMLInputElement;
      if (navInput) navInput.value = details.nav.toString();
      if (nameInput) nameInput.value = scheme.schemeName;
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      type: formData.get("type") as FundType,
      currentNAV: Number(formData.get("currentNAV")),
      isCustomBalance: formData.get("isCustomBalance") === "true",
      schemeCode: selectedScheme?.schemeCode?.toString() || null,
    };

    if (editingFund) {
      updateFund(editingFund.id, data);
    } else {
      addFund(data);
    }
    setIsModalOpen(false);
    setEditingFund(null);
    setSelectedScheme(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <header className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Portfolio Assets</h1>
          <p className="text-gray-500 text-xs md:text-sm italic">Tracking your live market exposure.</p>
        </header>
        <div className="flex gap-2">
          <button
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-100 text-gray-600 rounded-2xl text-[10px] font-bold hover:bg-gray-50 transition-all disabled:opacity-50 uppercase tracking-widest"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">{isRefreshing ? "Syncing..." : "Refresh NAVs"}</span>
            <span className="sm:hidden">Refresh</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-black text-white px-6 py-3 rounded-2xl hover:opacity-90 shadow-lg active:scale-95 transition-all flex items-center justify-center"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {funds.map((fund) => {
          const fundTransactions = transactions.filter(t => t.fundId === fund.id);
          const invested = fundTransactions.reduce((acc, t) => acc + t.amount, 0);
          const units = fundTransactions.reduce((acc, t) => acc + (t.units || 0), 0);
          const current = fund.isCustomBalance ? fund.currentNAV : (units * fund.currentNAV);
          const returns = current - invested;
          const returnPct = invested > 0 ? (returns / invested) * 100 : 0;

          // XIRR
          const cashFlows = [
            ...fundTransactions.map(tx => ({ date: new Date(tx.date), amount: -tx.amount })),
            { date: new Date(), amount: current }
          ];
          const xirr = calculateXIRR(cashFlows);

          return (
            <motion.div
              layout
              key={fund.id}
              className="group bento-card flex flex-col gap-5 border border-gray-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all relative overflow-hidden"
            >
              {/* Clickable Overlay for details */}
              <div 
                className="absolute inset-0 z-0 cursor-pointer" 
                onClick={() => setSelectedFundForDetail(fund)} 
              />

              <div className="flex justify-between items-start relative z-10">
                <div className="flex flex-col gap-1">
                  <span className="pill w-fit !px-2 !py-0.5 !bg-gray-50 !text-gray-400 !border-gray-100">{fund.type}</span>
                  <h3 className="text-lg md:text-xl font-bold tracking-tight text-gray-900 group-hover:text-blue-600 transition-colors leading-tight pr-12">{fund.name}</h3>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setEditingFund(fund); 
                      setIsModalOpen(true); 
                    }}
                    className="p-2 text-gray-400 hover:text-black hover:bg-white rounded-xl shadow-sm border border-gray-100 transition-all bg-white/80 backdrop-blur-sm pointer-events-auto"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setFundToDelete({ id: fund.id, name: fund.name });
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-xl shadow-sm border border-gray-100 transition-all bg-white/80 backdrop-blur-sm pointer-events-auto"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 relative z-10">
                <div className="space-y-1">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Total Value</p>
                  <p className="text-xl font-bold tracking-tighter text-black">₹{current.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  <div className={cn("text-[10px] font-bold flex items-center gap-1 uppercase tracking-tight", returns >= 0 ? "text-accent-green" : "text-red-500")}>
                    {returns >= 0 ? "+" : ""}₹{Math.abs(returns).toLocaleString()} ({returnPct.toFixed(1)}%)
                  </div>
                </div>
                <div className="space-y-1.5 pt-1">
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Holdings</p>
                    <p className="text-[11px] font-bold text-gray-600">{units.toFixed(3)} units</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Live NAV</p>
                    <p className="text-[11px] font-bold text-gray-600">₹{fund.currentNAV.toFixed(4)}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-gray-50">
                <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">
                  <Calculator size={10} className="font-bold" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">XIRR: {xirr.toFixed(1)}%</span>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-300">Last Synced</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                    {new Date(fund.lastUpdated).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
        {funds.length === 0 && (
          <div className="col-span-full py-20 space-y-4">
            <p className="text-gray-400 italic">No funds added yet. Let's list your first asset.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedFundForDetail && (
          <FundDetailModal 
            fund={selectedFundForDetail} 
            transactions={transactions.filter(t => t.fundId === selectedFundForDetail.id)}
            onClose={() => setSelectedFundForDetail(null)}
            onEdit={() => {
              setEditingFund(selectedFundForDetail);
              setIsModalOpen(true);
              setSelectedFundForDetail(null);
            }}
            onDelete={() => setFundToDelete({ id: selectedFundForDetail.id, name: selectedFundForDetail.name, fromDetail: true })}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {fundToDelete && (
          <ConfirmDeleteModal 
            title="Delete Asset"
            message={`Are you sure you want to delete "${fundToDelete.name}"? This will remove the asset and its market tracking, but existing transactions will remain in your history.`}
            onConfirm={() => {
              deleteFund(fundToDelete.id);
              if (fundToDelete.fromDetail) setSelectedFundForDetail(null);
              setFundToDelete(null);
            }}
            onCancel={() => setFundToDelete(null)}
          />
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
              className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-gray-100"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold tracking-tight">{editingFund ? 'Update Fund' : 'New Fund'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Asset Type</label>
                    <select
                      name="type"
                      value={fundType}
                      onChange={(e) => setFundType(e.target.value as FundType)}
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-black focus:ring-0 transition-all font-medium"
                    >
                      {Object.values(FundType).map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {fundType === FundType.MF && (
                    <div className="space-y-1.5 relative">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Search Mutual Fund</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search AMC or Scheme Name..."
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-black focus:ring-0 transition-all text-sm font-medium"
                        />
                        {isSearching && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                      
                      <AnimatePresence>
                        {searchResults.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden"
                          >
                            {searchResults.map((result) => (
                              <button
                                key={result.schemeCode}
                                type="button"
                                onClick={() => handleSelectScheme(result)}
                                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors text-xs font-medium border-b border-gray-50 last:border-0 flex justify-between items-center group"
                              >
                                <span className="truncate pr-2">{result.schemeName}</span>
                                <span className="text-[9px] font-bold text-gray-400 group-hover:text-black">#{result.schemeCode}</span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {selectedScheme && !searchQuery && (
                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100 mt-2">
                          <Check className="text-blue-600" size={14} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-blue-600 truncate">{selectedScheme.schemeName}</p>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => setSelectedScheme(null)}
                            className="p-1 hover:bg-blue-100 rounded-full"
                          >
                            <X size={12} className="text-blue-600" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Fund/Asset Name</label>
                    <input
                      id="fundName"
                      name="name"
                      required
                      defaultValue={editingFund?.name}
                      placeholder="e.g., Vanguard 500 ETF"
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-black focus:ring-0 transition-all font-medium"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Current Valuation (₹)</label>
                    <input
                      id="currentNAV"
                      name="currentNAV"
                      type="number"
                      required
                      step="0.01"
                      defaultValue={editingFund?.currentNAV}
                      placeholder="Current portfolio value..."
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-black focus:ring-0 transition-all font-bold tracking-tighter text-xl"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                   <input 
                    type="checkbox" 
                    name="isCustomBalance" 
                    value="true" 
                    defaultChecked={editingFund?.isCustomBalance}
                    id="isCustom" 
                    className="w-4 h-4 rounded text-black focus:ring-black" 
                  />
                   <label htmlFor="isCustom" className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Explicit total balance (use for FD/Cash)</label>
                </div>
                <button
                  type="submit"
                  className="w-full py-4 bg-black text-white font-bold rounded-xl hover:opacity-90 transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
                >
                  {editingFund ? <RefreshCw size={18} /> : <Plus size={18} />}
                  {editingFund ? 'Refresh Valuation' : 'Add to Portfolio'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ConfirmDeleteModal = ({ title, message, onConfirm, onCancel }: { title: string, message: string, onConfirm: () => void, onCancel: () => void }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-sm bg-white rounded-[32px] p-8 shadow-2xl space-y-6"
      >
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center scale-110">
          <Trash2 size={32} />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
        </div>
        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={onConfirm}
            className="w-full py-4 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-colors shadow-lg shadow-red-100"
          >
            DELETE FOREVER
          </button>
          <button
            onClick={onCancel}
            className="w-full py-4 bg-gray-50 text-gray-400 font-bold rounded-2xl hover:bg-gray-100 hover:text-gray-900 transition-all"
          >
            CANCEL
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const FundDetailModal = ({ fund, transactions, onClose, onEdit, onDelete }: any) => {
  const invested = transactions.filter((t: any) => t.amount >= 0).reduce((acc: any, t: any) => acc + t.amount, 0);
  const redemptions = Math.abs(transactions.filter((t: any) => t.amount < 0).reduce((acc: any, t: any) => acc + t.amount, 0));
  const units = transactions.reduce((acc: any, t: any) => acc + (t.units || 0), 0);
  const current = fund.isCustomBalance ? fund.currentNAV : (units * fund.currentNAV);
  const returns = current + redemptions - invested;
  const returnPct = invested > 0 ? (returns / invested) * 100 : 0;

  // XIRR
  const cashFlows = [
    ...transactions.map((tx: any) => ({ date: new Date(tx.date), amount: -tx.amount })),
    { date: new Date(), amount: current }
  ];
  const xirr = calculateXIRR(cashFlows);

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-2xl bg-white rounded-t-[40px] sm:rounded-[40px] p-8 sm:p-10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <button onClick={onClose} className="absolute right-6 top-6 p-3 hover:bg-gray-100 rounded-full transition-colors z-10">
          <X size={24} />
        </button>

        <div className="overflow-y-auto pr-2 -mr-2 space-y-10 custom-scrollbar">
          <header className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 bg-gray-900 text-white rounded-full">{fund.type}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">#{fund.schemeCode || "MANUAL"}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tighter leading-tight text-gray-900">{fund.name}</h2>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="p-8 bg-blue-50/50 rounded-[32px] space-y-1 border border-blue-100/50">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Current Value</p>
              <p className="text-4xl font-bold tracking-tighter text-blue-600">₹{current.toLocaleString()}</p>
              <div className={cn("text-sm font-bold flex items-center gap-1.5 mt-2", returns >= 0 ? "text-accent-green" : "text-red-500")}>
                {returns >= 0 ? <TrendingUp size={16} /> : <Calculator size={16} />}
                {returns >= 0 ? "+" : ""}₹{Math.abs(returns).toLocaleString()} ({returnPct.toFixed(2)}%)
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-gray-50 rounded-[24px] space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">XIRR</p>
                <p className="text-xl font-bold tracking-tighter text-gray-900">{xirr.toFixed(2)}%</p>
              </div>
              <div className="p-6 bg-gray-50 rounded-[24px] space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Units</p>
                <p className="text-xl font-bold tracking-tighter text-gray-900">{units.toFixed(4)}</p>
              </div>
              <div className="p-6 bg-gray-50 rounded-[24px] space-y-1 col-span-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Net Invested</p>
                <p className="text-xl font-bold tracking-tighter text-gray-900">₹{(invested - redemptions).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold tracking-tight">Recent Activity</h3>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{transactions.length} Records</span>
            </div>
            <div className="space-y-3">
              {transactions.slice(0, 5).map((t: any) => (
                <div key={t.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl">
                  <div className="flex gap-3 items-center">
                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", t.amount >= 0 ? "bg-accent-green/10 text-accent-green" : "bg-red-50 text-red-500")}>
                      {t.amount >= 0 ? <Plus size={14} /> : <X size={14} />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{t.amount >= 0 ? "Purchase" : "Redemption"}</p>
                      <p className="text-[10px] font-medium text-gray-400">{new Date(t.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className={cn("text-sm font-bold tracking-tight", t.amount >= 0 ? "text-gray-900" : "text-red-500")}>
                    {t.amount >= 0 ? "+" : "-"}₹{Math.abs(t.amount).toLocaleString()}
                  </p>
                </div>
              ))}
              {transactions.length === 0 && <p className="text-center py-6 text-gray-400 italic text-sm">No transaction history found.</p>}
            </div>
          </div>

          <footer className="pt-10 border-t border-gray-100 flex flex-col sm:flex-row gap-4 pb-4">
            <button 
              onClick={onEdit}
              className="flex-1 py-4 bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              <Edit2 size={16} /> Edit Asset Config
            </button>
            <button 
              onClick={onDelete}
              className="flex-1 py-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              <Trash2 size={16} /> Delete from Portfolio
            </button>
          </footer>
        </div>
      </motion.div>
    </div>
  );
};
