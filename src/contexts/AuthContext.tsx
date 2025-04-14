
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "@/components/ui/sonner";

interface User {
  id: string;
  email: string;
  name: string | null;
  photoURL: string | null;
  isPremium: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock implementation for demo purposes
// In a real app, this would connect to an actual authentication service
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for saved user in localStorage (simulating persistent authentication)
    const savedUser = localStorage.getItem("mathWizardUser");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Failed to parse saved user:", error);
        localStorage.removeItem("mathWizardUser");
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock validation
      if (!email.includes("@") || password.length < 6) {
        throw new Error("Invalid email or password");
      }
      
      // Create mock user
      const newUser = {
        id: `user_${Date.now()}`,
        email,
        name: email.split("@")[0],
        photoURL: null,
        isPremium: false
      };
      
      setUser(newUser);
      localStorage.setItem("mathWizardUser", JSON.stringify(newUser));
      toast.success("Signed in successfully!");
    } catch (error) {
      toast.error("Failed to sign in. Please check your credentials.");
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create mock Google user
      const newUser = {
        id: `google_user_${Date.now()}`,
        email: "user@example.com",
        name: "Google User",
        photoURL: "https://lh3.googleusercontent.com/a/default-user",
        isPremium: true
      };
      
      setUser(newUser);
      localStorage.setItem("mathWizardUser", JSON.stringify(newUser));
      toast.success("Signed in with Google successfully!");
    } catch (error) {
      toast.error("Failed to sign in with Google.");
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock validation
      if (!email.includes("@") || password.length < 6) {
        throw new Error("Invalid email or password");
      }
      
      // Create mock user
      const newUser = {
        id: `user_${Date.now()}`,
        email,
        name,
        photoURL: null,
        isPremium: false
      };
      
      setUser(newUser);
      localStorage.setItem("mathWizardUser", JSON.stringify(newUser));
      toast.success("Account created successfully!");
    } catch (error) {
      toast.error("Failed to create account. Please try again.");
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setUser(null);
      localStorage.removeItem("mathWizardUser");
      toast.success("Signed out successfully!");
    } catch (error) {
      toast.error("Failed to sign out.");
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signInWithGoogle,
        signUp,
        signOut,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
