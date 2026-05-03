/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction, Goal, Fund, PortfolioSummary, GoalProgress } from "../types";

export const STORAGE_KEYS = {
  GOALS: "wealthflow_goals",
  FUNDS: "wealthflow_funds",
  TRANSACTIONS: "wealthflow_transactions",
};

/**
 * CAGR = ((Final Value / Initial Value) ^ (1 / n)) - 1
 * where n is the number of years.
 */
export function calculateCAGR(initialValue: number, finalValue: number, startDate: Date, endDate: Date = new Date()): number {
  if (initialValue <= 0 || finalValue <= 0) return 0;
  
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
  
  if (diffYears === 0) return 0;
  
  return (Math.pow(finalValue / initialValue, 1 / diffYears) - 1) * 100;
}

export function calculateAbsoluteReturn(invested: number, current: number): { absolute: number; percentage: number } {
  if (invested <= 0) return { absolute: 0, percentage: 0 };
  const absolute = current - invested;
  const percentage = (absolute / invested) * 100;
  return { absolute, percentage };
}

export const getStoredData = <T>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    console.error(`Error reading ${key} from storage`, e);
    return defaultValue;
  }
};

export const setStoredData = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving ${key} to storage`, e);
  }
};

/**
 * XIRR Calculation using Newton-Raphson method
 * Format: [{ date: new Date(), amount: -100 }, { date: new Date(), amount: 120 }]
 * Investments are negative, current value is positive
 */
export function calculateXIRR(cashFlows: { date: Date; amount: number }[]): number {
  if (cashFlows.length < 2) return 0;

  // Initial check: must have at least one negative and one positive value
  const hasNegative = cashFlows.some(cf => cf.amount < 0);
  const hasPositive = cashFlows.some(cf => cf.amount > 0);
  if (!hasNegative || !hasPositive) return 0;

  const xirrFunc = (r: number) => {
    return cashFlows.reduce((acc, cf) => {
      const days = (cf.date.getTime() - cashFlows[0].date.getTime()) / (1000 * 60 * 60 * 24);
      return acc + cf.amount / Math.pow(1 + r, days / 365);
    }, 0);
  };

  const xirrDeriv = (r: number) => {
    return cashFlows.reduce((acc, cf) => {
      const days = (cf.date.getTime() - cashFlows[0].date.getTime()) / (1000 * 60 * 60 * 24);
      return acc - (days / 365) * cf.amount * Math.pow(1 + r, -days / 365 - 1);
    }, 0);
  };

  let rate = 0.1; // 10% initial guess
  for (let i = 0; i < 20; i++) {
    const f = xirrFunc(rate);
    const df = xirrDeriv(rate);
    if (Math.abs(df) < 1e-10) break;
    const nextRate = rate - f / df;
    if (Math.abs(nextRate - rate) < 1e-7) return nextRate * 100;
    rate = nextRate;
  }
  return rate * 100;
}
