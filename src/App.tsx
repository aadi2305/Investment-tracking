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

const PortfolioApp = () => {
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

