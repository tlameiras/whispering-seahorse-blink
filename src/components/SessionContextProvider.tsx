"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "./ThemeProvider";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  updated_at: string | null;
}

interface SessionContextType {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>; // Added refreshProfile function
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchProfile = useCallback(async (userId: string) => {
    const { data: profileData, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
    } else {
      setProfile(profileData as Profile);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    setIsLoading(true);
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    setSession(currentSession);

    if (currentSession) {
      await fetchProfile(currentSession.user.id);
    } else {
      setProfile(null);
    }
    setIsLoading(false);
  }, [fetchProfile]);

  useEffect(() => {
    refreshProfile(); // Initial fetch

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
        if (currentSession) {
          fetchProfile(currentSession.user.id);
        } else {
          setProfile(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [refreshProfile, fetchProfile]);

  useEffect(() => {
    if (!isLoading) {
      if (!session && location.pathname !== "/login") {
        navigate("/login");
      } else if (session && location.pathname === "/login") {
        navigate("/");
      }
    }
  }, [session, isLoading, location.pathname, navigate]);

  if (isLoading) {
    return (
      <ThemeProvider defaultTheme="system" attribute="class">
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          Loading application...
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider defaultTheme="system" attribute="class">
      <SessionContext.Provider value={{ session, profile, isLoading, refreshProfile }}>
        {children}
      </SessionContext.Provider>
    </ThemeProvider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionContextProvider");
  }
  return context;
};