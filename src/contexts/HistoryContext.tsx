import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { MathProblem, MathSolution } from "@/lib/groq-api";
import { toast } from "@/components/ui/sonner";

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

// Utility functions for data compression and safe storage
const compressData = (data: any): string => {
  try {
    // Only keep essential fields to reduce storage size
    const minimalData = data.map((item: HistoryItem) => ({
      id: item.id,
      timestamp: item.timestamp,
      problem: {
        problem: item.problem.problem,
        type: item.problem.type
      },
      solution: {
        solution: item.solution.solution,
        steps: item.solution.steps?.slice(0, 3) || [], // Only keep first 3 steps
        explanation: item.solution.explanation?.substring(0, 500) || "", // Limit explanation length
        latex: item.solution.latex?.substring(0, 300) || "" // Limit LaTeX length
      }
    }));
    return JSON.stringify(minimalData);
  } catch (error) {
    console.error("Failed to compress history data:", error);
    return "[]";
  }
};

const safelyStoreData = (key: string, data: any): boolean => {
  try {
    const compressedData = compressData(data);
    localStorage.setItem(key, compressedData);
    return true;
  } catch (error) {
    console.error("Failed to store history:", error);
    
    // Try with only the most recent 5 items if there's a quota error
    if (error instanceof DOMException && error.name === "QuotaExceededError" && data.length > 5) {
      try {
        const compressedData = compressData(data.slice(0, 5));
        localStorage.setItem(key, compressedData);
        toast.warning("History storage limit reached. Only keeping recent items.");
        return true;
      } catch (innerError) {
        console.error("Failed even with reduced history:", innerError);
      }
    }
    return false;
  }
};

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
      if (!safelyStoreData(`mathWizard_history_${user.id}`, newHistory)) {
        // If storage fails completely, update state but don't persist
        toast.error("Couldn't save history due to storage limits");
      }
    } else {
      try {
        sessionStorage.setItem("mathWizard_guest_history", JSON.stringify(newHistory));
      } catch (error) {
        console.error("Failed to save guest history:", error);
        toast.error("Couldn't save history due to storage limits");
      }
    }
  };

  const addToHistory = (problem: MathProblem, solution: MathSolution) => {
    const newItem: HistoryItem = {
      id: `history_${Date.now()}`,
      timestamp: Date.now(),
      problem,
      solution,
    };
    
    // More aggressively limit history size based on user type
    const maxItems = user ? 30 : 10; // Reduce from 100/20 to 30/10
    const updatedHistory = [newItem, ...history];
    const limitedHistory = updatedHistory.slice(0, maxItems);
    
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
