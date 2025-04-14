
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { MathProblem, MathSolution } from "@/lib/groq-api";

export interface HistoryItem {
  id: string;
  timestamp: number;
  problem: MathProblem;
  solution: MathSolution;
}

interface HistoryContextType {
  history: HistoryItem[];
  addToHistory: (problem: MathProblem, solution: MathSolution) => void;
  clearHistory: () => void;
  loading: boolean;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const HistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // Load history from localStorage when the component mounts or user changes
    if (user) {
      try {
        const savedHistory = localStorage.getItem(`mathWizard_history_${user.id}`);
        if (savedHistory) {
          setHistory(JSON.parse(savedHistory));
        } else {
          setHistory([]);
        }
      } catch (error) {
        console.error("Failed to load history:", error);
        setHistory([]);
      }
    } else {
      // For non-authenticated users, use a session-based history
      try {
        const savedHistory = sessionStorage.getItem("mathWizard_guest_history");
        if (savedHistory) {
          setHistory(JSON.parse(savedHistory));
        } else {
          setHistory([]);
        }
      } catch (error) {
        console.error("Failed to load guest history:", error);
        setHistory([]);
      }
    }
    setLoading(false);
  }, [user]);

  const saveHistory = (newHistory: HistoryItem[]) => {
    if (user) {
      localStorage.setItem(`mathWizard_history_${user.id}`, JSON.stringify(newHistory));
    } else {
      sessionStorage.setItem("mathWizard_guest_history", JSON.stringify(newHistory));
    }
  };

  const addToHistory = (problem: MathProblem, solution: MathSolution) => {
    const newItem: HistoryItem = {
      id: `history_${Date.now()}`,
      timestamp: Date.now(),
      problem,
      solution,
    };
    
    const updatedHistory = [newItem, ...history];
    // Limit history to 20 items for guests and 100 for authenticated users
    const limitedHistory = updatedHistory.slice(0, user ? 100 : 20);
    
    setHistory(limitedHistory);
    saveHistory(limitedHistory);
  };

  const clearHistory = () => {
    setHistory([]);
    if (user) {
      localStorage.removeItem(`mathWizard_history_${user.id}`);
    } else {
      sessionStorage.removeItem("mathWizard_guest_history");
    }
  };

  return (
    <HistoryContext.Provider
      value={{
        history,
        addToHistory,
        clearHistory,
        loading,
      }}
    >
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = () => {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error("useHistory must be used within a HistoryProvider");
  }
  return context;
};
