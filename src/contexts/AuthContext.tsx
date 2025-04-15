import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "../components/ui/sonner";

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
    // Set up auth state change listener first
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event:", event);
      
      if (session?.user) {
        try {
          // Use setTimeout to prevent potential auth deadlocks
          setTimeout(async () => {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();
              
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
            setLoading(false);
          }, 0);
        } catch (error) {
          console.error("Error enhancing user:", error);
          setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
    });

    // Check existing session
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (data.session?.user) {
          // Use setTimeout to prevent potential auth deadlocks
          setTimeout(async () => {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.session.user.id)
              .maybeSingle();
              
            if (profileError) {
              console.error("Error fetching profile:", profileError);
            }
            
            const enhancedUser: UserWithMeta = {
              ...data.session.user,
              name: profileData?.name || data.session.user.email?.split('@')[0] || null,
              photoURL: profileData?.avatar_url || null,
              isPremium: false
            };
            
            setUser(enhancedUser);
          }, 0);
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

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
      console.error(error);
      toast.error(`Failed to sign in: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Get the current URL for redirection
      const origin = window.location.origin;
      const redirectTo = `${origin}/auth/callback`;
      
      console.log("Starting Google login with redirect to:", redirectTo);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: origin, // Use the app origin as the redirect URL
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      
      if (error) {
        console.error("Google OAuth error details:", error);
        toast.error(`Failed to sign in with Google: ${error.message}`);
        throw error;
      }
    } catch (error: any) {
      console.error("Detailed error:", error);
      toast.error(`Failed to sign in with Google: ${error.message}`);
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
      console.error(error);
      toast.error(`Failed to create account: ${error.message}`);
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
      console.error(error);
      toast.error(`Failed to sign out: ${error.message}`);
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
