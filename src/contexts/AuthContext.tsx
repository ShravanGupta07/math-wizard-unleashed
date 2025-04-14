
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "@/components/ui/sonner";

interface UserWithMeta extends User {
  name: string | null;
  photoURL: string | null;
  isPremium: boolean;
}

interface AuthContextType {
  user: UserWithMeta | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserWithMeta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for authenticated session
    const checkSession = async () => {
      try {
        setLoading(true);
        const { data } = await supabase.auth.getSession();
        
        if (data.session?.user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .single();
            
          if (profileError) {
            console.error("Error fetching profile:", profileError);
          }
          
          const enhancedUser: UserWithMeta = {
            ...data.session.user,
            name: profileData?.name || data.session.user.email?.split('@')[0] || null,
            photoURL: profileData?.avatar_url || null,
            isPremium: false // Default value, can be updated based on your subscription logic
          };
          
          setUser(enhancedUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error checking session:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event:", event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profileError) {
            console.error("Error fetching profile:", profileError);
          }
          
          const enhancedUser: UserWithMeta = {
            ...session.user,
            name: profileData?.name || session.user.email?.split('@')[0] || null,
            photoURL: profileData?.avatar_url || null,
            isPremium: false
          };
          
          setUser(enhancedUser);
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    // Cleanup function
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      toast.success("Signed in successfully!");
    } catch (error: any) {
      toast.error(`Failed to sign in: ${error.message}`);
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Using the correct redirect URL for the current origin
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        console.error("OAuth error details:", error);
        throw error;
      }
    } catch (error: any) {
      toast.error(`Failed to sign in with Google: ${error.message}`);
      console.error("Detailed error:", error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });
      
      if (error) throw error;
      
      toast.success("Account created successfully! Please check your email for verification.");
    } catch (error: any) {
      toast.error(`Failed to create account: ${error.message}`);
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      toast.success("Signed out successfully!");
    } catch (error: any) {
      toast.error(`Failed to sign out: ${error.message}`);
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
