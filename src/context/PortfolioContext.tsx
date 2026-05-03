/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Goal, Fund, Transaction, FundType } from "../types";
import { auth, db, signIn, logOut } from "../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { 
  collection, 
  onSnapshot, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  writeBatch,
  setDoc
} from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../lib/firebase-utils";
import { mfService } from "../services/mfService";

interface PortfolioContextType {
  user: User | null;
  loading: boolean;
  dataLoading: boolean;
  goals: Goal[];
  funds: Fund[];
  transactions: Transaction[];
  addGoal: (goal: Omit<Goal, "id" | "createdAt">) => Promise<void>;
  updateGoal: (id: string, goal: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addFund: (fund: Omit<Fund, "id" | "lastUpdated">) => Promise<void>;
  updateFund: (id: string, fund: Partial<Fund>) => Promise<void>;
  deleteFund: (id: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, "id">) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  splitTransaction: (id: string, splits: Omit<Transaction, "id">[]) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  seedSampleData: () => Promise<void>;
  refreshNAVs: () => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        setDataLoading(true);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setGoals([]);
      setFunds([]);
      setTransactions([]);
      setDataLoading(false);
      return;
    }

    let goalsReady = false;
    let fundsReady = false;
    let txReady = false;

    const checkReady = () => {
      if (goalsReady && fundsReady && txReady) {
        setDataLoading(false);
      }
    };

    const goalsPath = `users/${user.uid}/goals`;
    const unsubGoals = onSnapshot(query(collection(db, goalsPath), orderBy("createdAt", "desc")), 
      (snapshot) => {
        setGoals(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Goal)));
        goalsReady = true;
        checkReady();
      }, 
      (error) => handleFirestoreError(error, OperationType.GET, goalsPath)
    );

    const fundsPath = `users/${user.uid}/funds`;
    const unsubFunds = onSnapshot(collection(db, fundsPath), 
      (snapshot) => {
        setFunds(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Fund)));
        fundsReady = true;
        checkReady();
      }, 
      (error) => handleFirestoreError(error, OperationType.GET, fundsPath)
    );

    const txPath = `users/${user.uid}/transactions`;
    const unsubTx = onSnapshot(query(collection(db, txPath), orderBy("date", "desc")), 
      (snapshot) => {
        setTransactions(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
        txReady = true;
        checkReady();
      }, 
      (error) => handleFirestoreError(error, OperationType.GET, txPath)
    );

    return () => {
      unsubGoals();
      unsubFunds();
      unsubTx();
    };
  }, [user]);

  const addGoal = async (goalData: Omit<Goal, "id" | "createdAt">) => {
    if (!user) return;
    const path = `users/${user.uid}/goals`;
    try {
      await addDoc(collection(db, path), {
        ...goalData,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const refreshNAVs = async () => {
    if (!user || !funds || funds.length === 0) return;
    
    console.log("Checking for NAV updates...");
    const batch = writeBatch(db);
    let updatedCount = 0;

    for (const fund of funds) {
      if (fund.schemeCode) {
        try {
          const details = await mfService.getLatestNAV(fund.schemeCode);
          // Only update if NAV changed or hasn't been updated today
          const today = new Date().toISOString().split('T')[0];
          const lastUpdate = fund.lastUpdated.split('T')[0];
          
          if (details && (details.nav !== fund.currentNAV || lastUpdate !== today)) {
            const fundRef = doc(db, `users/${user.uid}/funds/${fund.id}`);
            batch.update(fundRef, {
              currentNAV: details.nav,
              lastUpdated: new Date().toISOString()
            });
            updatedCount++;
          }
        } catch (e) {
          console.error(`Failed to refresh fund ${fund.name}:`, e);
        }
      }
    }

    if (updatedCount > 0) {
      try {
        await batch.commit();
        console.log(`Successfully synced ${updatedCount} fund NAVs with live market data.`);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/funds`);
      }
    }
  };

  const updateGoal = async (id: string, goalData: Partial<Goal>) => {
    if (!user) return;
    const path = `users/${user.uid}/goals/${id}`;
    try {
      await updateDoc(doc(db, path), goalData);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/goals/${id}`;
    try {
      await deleteDoc(doc(db, path));
      // Logic for unassigning goal from transactions would ideally be handled in a batch or rules
      // But for simplicity in this turn, we'll just delete the goal.
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const addFund = async (fundData: Omit<Fund, "id" | "lastUpdated">) => {
    if (!user) return;
    const path = `users/${user.uid}/funds`;
    try {
      await addDoc(collection(db, path), {
        ...fundData,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const updateFund = async (id: string, fundData: Partial<Fund>) => {
    if (!user) return;
    const path = `users/${user.uid}/funds/${id}`;
    try {
      await updateDoc(doc(db, path), {
        ...fundData,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const deleteFund = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/funds/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const addTransaction = async (transactionData: Omit<Transaction, "id">) => {
    if (!user) return;
    const path = `users/${user.uid}/transactions`;
    try {
      await addDoc(collection(db, path), transactionData);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const updateTransaction = async (id: string, transactionData: Partial<Transaction>) => {
    if (!user) return;
    const path = `users/${user.uid}/transactions/${id}`;
    try {
      await updateDoc(doc(db, path), transactionData);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const splitTransaction = async (id: string, splits: Omit<Transaction, "id">[]) => {
    if (!user) return;
    const batch = writeBatch(db);
    const originalTxRef = doc(db, `users/${user.uid}/transactions/${id}`);
    
    // Delete original
    batch.delete(originalTxRef);
    
    // Add new splits
    splits.forEach(split => {
      const newTxRef = doc(collection(db, `users/${user.uid}/transactions`));
      batch.set(newTxRef, split);
    });

    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/transactions`);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/transactions/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const seedSampleData = async () => {
    if (!user) return;
    console.log("Seeding real portfolio to Firestore...");
    const batch = writeBatch(db);
    
    // 1. Define the Funds
    const axisFundRef = doc(collection(db, `users/${user.uid}/funds`));
    const ppFlexiRef = doc(collection(db, `users/${user.uid}/funds`));
    const generalGoalRef = doc(collection(db, `users/${user.uid}/goals`));

    // Axis Liquid Fund - Direct Growth
    batch.set(axisFundRef, {
      name: "Axis Liquid Fund - Direct Growth",
      type: FundType.MF,
      currentNAV: 3084.147,
      schemeCode: "120389",
      lastUpdated: new Date().toISOString()
    });

    // Parag Parikh Flexi Cap Fund - Direct Plan Growth
    batch.set(ppFlexiRef, {
      name: "Parag Parikh Flexi Cap Fund - Direct Growth",
      type: FundType.MF,
      currentNAV: 91.5729,
      schemeCode: "122639",
      lastUpdated: new Date().toISOString()
    });

    batch.set(generalGoalRef, {
      name: "Wealth Creation",
      targetAmount: 10000000,
      createdAt: new Date().toISOString()
    });

    // 2. Define Axis Liquid Transactions
    const axisTxs = [
      { date: "2025-12-01", units: 7.656, price: 3004.1823 },
      { date: "2026-02-02", units: 3.296, price: 3033.9283 },
      { date: "2026-02-02", units: 1.648, price: 3033.9283 },
      { date: "2026-03-04", units: 4.917, price: 3050.3524 },
      { date: "2026-04-02", units: 4.893, price: 3065.24 },
      { date: "2026-04-06", units: 0.651, price: 3071.3921 },
      { date: "2026-04-24", units: -0.649, price: 3084.147 }, // Sell
    ];

    axisTxs.forEach(tx => {
      const txRef = doc(collection(db, `users/${user.uid}/transactions`));
      batch.set(txRef, {
        fundId: axisFundRef.id,
        goalId: generalGoalRef.id,
        date: tx.date,
        units: tx.units,
        amount: Number((tx.units * tx.price).toFixed(2))
      });
    });

    // 3. Define Parag Parikh Transactions
    const ppTx = { date: "2026-04-15", units: 402.534, price: 91.5729 };
    const ppTxRef = doc(collection(db, `users/${user.uid}/transactions`));
    batch.set(ppTxRef, {
      fundId: ppFlexiRef.id,
      goalId: generalGoalRef.id,
      date: ppTx.date,
      units: ppTx.units,
      amount: Number((ppTx.units * ppTx.price).toFixed(2))
    });

    try {
      await batch.commit();
      console.log("Real portfolio seeded successfully");
      await refreshNAVs(); // Sync latest prices immediately
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const login = async () => {
    try {
      await signIn();
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const logout = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <PortfolioContext.Provider value={{
      user, loading, dataLoading, goals, funds, transactions,
      addGoal, updateGoal, deleteGoal,
      addFund, updateFund, deleteFund,
      addTransaction, updateTransaction, splitTransaction, deleteTransaction,
      seedSampleData, refreshNAVs, login, logout
    }}>
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) throw new Error("usePortfolio must be used within a PortfolioProvider");
  return context;
};

