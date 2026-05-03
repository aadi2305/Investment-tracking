/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { LayoutDashboard, Target, Briefcase, PlusCircle, History, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { usePortfolio } from "../context/PortfolioContext";
import { cn } from "../lib/utils";

interface NavItemProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: (id: string) => void;
}

const NavItem = ({ id, label, icon, active, onClick }: NavItemProps) => (
  <button
    onClick={() => onClick(id)}
    className={cn(
      "flex flex-col items-center justify-center py-2 px-4 transition-all duration-200 relative",
      active ? "text-blue-600" : "text-gray-500 hover:text-gray-800"
    )}
  >
    {icon}
    <span className="text-[10px] mt-1 font-medium tracking-tight uppercase">{label}</span>
    {active && (
      <motion.div
        layoutId="nav-pill"
        className="absolute -top-1 w-8 h-1 bg-blue-600 rounded-full"
        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
      />
    )}
  </button>
);

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout = ({ children, activeTab, setActiveTab }: LayoutProps) => {
  const { logout, user } = usePortfolio();
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { id: "goals", label: "Goals", icon: <Target size={20} /> },
    { id: "funds", label: "Funds", icon: <Briefcase size={20} /> },
    { id: "history", label: "Transactions", icon: <History size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 pb-20 md:pb-0 md:pt-20 font-sans">
      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-[#FAFAFA]/90 backdrop-blur-md z-40 px-6 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-gray-900">Vault.ai</span>
        </div>
        <button onClick={logout} className="p-2 text-gray-400 hover:text-black">
          <LogOut size={18} />
        </button>
      </header>

      {/* Mobile Header Spacer */}
      <div className="h-16 md:hidden"></div>

      {/* Desktop Header */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 h-20 bg-[#FAFAFA]/80 backdrop-blur-md z-50 items-center justify-between px-10 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
             <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">Vault.ai</span>
        </div>
        
        <nav className="flex items-center gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "text-sm font-medium transition-colors",
                activeTab === tab.id ? "text-black" : "text-gray-500 hover:text-black"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Authenticated</span>
            <span className="text-xs font-bold tracking-tight truncate max-w-[120px]">{user?.email}</span>
          </div>
          <button 
            onClick={() => setActiveTab("add")}
            className="bg-black text-white px-5 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            + New Investment
          </button>
          <button onClick={logout} className="p-2 text-gray-400 hover:text-black" title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </header>


      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 flex justify-around items-center z-50">
        {[...tabs, { id: "add", label: "Add", icon: <PlusCircle size={20} /> }].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              activeTab === tab.id ? "text-black" : "text-gray-400"
            )}
          >
            {tab.icon}
            <span className="text-[10px] font-bold uppercase tracking-tight">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};
