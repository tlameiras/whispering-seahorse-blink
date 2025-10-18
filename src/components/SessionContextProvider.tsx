"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "./ThemeProvider"; // Import ThemeProvider

interface SessionContextType {
  session: Session | null;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setIsLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
        setIsLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

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
      <SessionContext.Provider value={{ session, isLoading }}>
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