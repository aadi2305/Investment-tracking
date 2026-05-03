/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum FundType {
  MF = "Mutual Fund",
  STOCK = "Stock",
  FD = "Fixed Deposit",
  EPF = "EPF / VPF",
  PPF = "PPF",
  CASH = "Cash / Bank",
  OTHER = "Other"
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  deadline?: string | null;
  monthlyInvestment?: number | null;
  icon?: string | null;
  createdAt: string;
}

export interface Fund {
  id: string;
  name: string;
  type: FundType;
  currentNAV: number;
  lastUpdated: string;
  schemeCode?: string | null;
  isCustomBalance?: boolean; // For FD/Cash where NAV doesn't make sense, currentNAV acts as total value
}

export interface Transaction {
  id: string;
  amount: number; // For MFs, this is the amount invested. For units-based assets, we might need units.
  units?: number; // Optional: if we want to track units vs NAV
  date: string;
  fundId: string;
  goalId?: string | null;
}

export interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  totalReturns: number;
  percentageReturn: number;
  cagr: number;
}

export interface GoalProgress extends Goal {
  investedAmount: number;
  currentValue: number;
  progressPercentage: number;
}
