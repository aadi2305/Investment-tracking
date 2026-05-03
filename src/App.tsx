/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { PortfolioProvider, usePortfolio } from "./context/PortfolioContext";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Goals } from "./pages/Goals";
import { Funds } from "./pages/Funds";
import { History, AddInvestment } from "./pages/InvestmentFlow";
import { LoginPage } from "./pages/LoginPage";
import { firebaseConfigError } from "./lib/firebase";
import { AlertCircle, Terminal } from "lucide-react";

const ConfigError = ({ missing }: { missing: string[] }) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50 p-6">
    <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-red-100">
      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-6">
        <AlertCircle size={32} />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Configuration Missing</h1>
      <p className="text-gray-600 mb-6 leading-relaxed">
        Your application is missing required Firebase environment variables. Please check your <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">.env</code> file or GitHub repository variables.
      </p>
      
      <div className="bg-gray-900 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 text-gray-400 mb-2 text-xs font-bold uppercase tracking-widest">
          <Terminal size={14} />
          <span>Missing Keys</span>
        </div>
        <ul className="space-y-1">
          {missing.map(key => (
            <li key={key} className="text-red-400 font-mono text-sm">{key}</li>
          ))}
        </ul>
      </div>

      <div className="space-y-4">
        <div className="text-sm text-gray-500 bg-blue-50 p-4 rounded-xl border border-blue-100">
          <strong>Tip:</strong> These values can be found in the <strong>Project Settings</strong> of your Firebase Console.
        </div>
      </div>
    </div>
  </div>
);

const PortfolioApp = () => {
  if (firebaseConfigError) {
    return <ConfigError missing={firebaseConfigError} />;
  }
  const { user, loading } = usePortfolio();
  const [activeTab, setActiveTab] = useState("dashboard");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard onNavigate={setActiveTab} />;
      case "goals":
        return <Goals />;
      case "funds":
        return <Funds />;
      case "history":
        return <History />;
      case "add":
        return <AddInvestment onSuccess={() => setActiveTab("dashboard")} />;
      default:
        return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default function App() {
  return (
    <PortfolioProvider>
      <PortfolioApp />
    </PortfolioProvider>
  );
}

