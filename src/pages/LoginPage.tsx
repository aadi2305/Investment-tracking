/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { usePortfolio } from "../context/PortfolioContext";
import { motion } from "motion/react";
import { Wallet, LogIn } from "lucide-react";

export const LoginPage = () => {
  const { login } = usePortfolio();

  return (
    <div className="flex items-center justify-center min-h-screen bg-white p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8 text-center"
      >
        <div className="flex flex-col items-center gap-6">
          <div className="w-20 h-20 bg-black rounded-[24px] flex items-center justify-center shadow-2xl shadow-gray-200">
            <Wallet className="text-white" size={32} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter">Wealth Vault</h1>
            <p className="text-gray-500 text-sm font-medium">Securely track your financial future.</p>
          </div>
        </div>

        <button 
          onClick={login}
          className="w-full flex items-center justify-center gap-3 py-4 bg-black text-white font-bold rounded-2xl hover:opacity-90 transition-all active:scale-[0.98] shadow-xl"
        >
          <LogIn size={18} />
          Sign in with Google
        </button>

        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest pt-4">
          Free for individuals • Secure by Design
        </p>
      </motion.div>
    </div>
  );
};
