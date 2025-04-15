import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { MathProblem, MathSolution } from "../lib/groq-api";
import { toast } from "../components/ui/sonner";
import { supabase } from "../integrations/supabase/client";

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
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Load history when user changes
    const loadHistory = async () => {
      setLoading(true);
      
      if (isAuthenticated && user) {
        try {
          // Fetch history from Supabase
          const { data, error } = await supabase
            .from('math_history')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
            
          if (error) {
            throw error;
          }
          
          if (data) {
            // Transform data to match HistoryItem format
            const historyItems: HistoryItem[] = data.map(item => ({
              id: item.id,
              timestamp: new Date(item.created_at).getTime(),
              problem: {
                problem: item.problem,
                type: (item.problem_type || 'text') as "text" | "image" | "voice" | "drawing" | "file"
              },
              solution: {
                solution: item.solution,
                explanation: item.explanation || '',
                steps: item.steps ? (Array.isArray(item.steps) ? item.steps as string[] : []) : [],
                latex: item.latex || '',
                visualization: item.visualization || undefined
              }
            }));
            
            setHistory(historyItems);
          }
        } catch (error) {
          console.error("Failed to load history from Supabase:", error);
          // Fall back to local storage
          loadFromLocalStorage();
        }
      } else {
        // For non-authenticated users, use session storage
        loadFromSessionStorage();
      }
      
      setLoading(false);
    };
    
    const loadFromLocalStorage = () => {
      try {
        if (user) {
          const savedHistory = localStorage.getItem(`mathWizard_history_${user.id}`);
          if (savedHistory) {
            setHistory(JSON.parse(savedHistory));
          } else {
            setHistory([]);
          }
        }
      } catch (error) {
        console.error("Failed to load history from localStorage:", error);
        setHistory([]);
      }
    };
    
    const loadFromSessionStorage = () => {
      try {
        const savedHistory = sessionStorage.getItem("mathWizard_guest_history");
        if (savedHistory) {
          setHistory(JSON.parse(savedHistory));
        } else {
          setHistory([]);
        }
      } catch (error) {
        console.error("Failed to load guest history from sessionStorage:", error);
        setHistory([]);
      }
    };
    
    loadHistory();
  }, [user, isAuthenticated]);

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

  const addToHistory = async (problem: MathProblem, solution: MathSolution) => {
    const newItem: HistoryItem = {
      id: `history_${Date.now()}`,
      timestamp: Date.now(),
      problem,
      solution,
    };
    
    // More aggressively limit history size based on user type
    const maxItems = isAuthenticated ? 30 : 10; // Reduce from 100/20 to 30/10
    const updatedHistory = [newItem, ...history];
    const limitedHistory = updatedHistory.slice(0, maxItems);
    
    setHistory(limitedHistory);
    
    // Save to local storage as a backup
    if (isAuthenticated && user) {
      safelyStoreData(`mathWizard_history_${user.id}`, limitedHistory);
      
      // Don't attempt to save to Supabase here - it's done in MathOutput component
      // to avoid duplicates and to have better error handling
    } else {
      try {
        sessionStorage.setItem("mathWizard_guest_history", JSON.stringify(limitedHistory));
      } catch (error) {
        console.error("Failed to save guest history:", error);
        toast.error("Couldn't save history due to storage limits");
      }
    }
  };

  const clearHistory = async () => {
    setHistory([]);
    
    if (isAuthenticated && user) {
      try {
        // Clear from Supabase
        const { error } = await supabase
          .from('math_history')
          .delete()
          .eq('user_id', user.id);
          
        if (error) {
          throw error;
        }
        
        // Also clear from localStorage
        localStorage.removeItem(`mathWizard_history_${user.id}`);
        toast.success("History cleared successfully");
      } catch (error) {
        console.error("Failed to clear history from Supabase:", error);
        toast.error("Failed to clear history. Please try again.");
      }
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
