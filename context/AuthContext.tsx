"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import liff from '@line/liff';

interface UserProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  idToken: string | null;
  isLoading: boolean;
  error: string | null;
  isAdmin: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user?.userId) {
      const adminIds = process.env.NEXT_PUBLIC_ADMIN_USER_IDS?.split(",") || [];
      setIsAdmin(adminIds.includes(user.userId));
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  useEffect(() => {
    const initLiff = async () => {
      // Mock mode for Localhost development
      if (process.env.NEXT_PUBLIC_SKIP_LIFF === "true") {
        console.log("🛠️ Running in Mock Auth Mode");
        setUser({
          userId: process.env.NEXT_PUBLIC_MOCK_USER_ID || "dev-user-mock",
          displayName: "Developer (Mock)",
          pictureUrl: "https://ui-avatars.com/api/?name=Dev+Mock&background=random",
        });
        setIdToken("mock-token-dev");
        setIsLoading(false);
        return;
      }

      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID || "2009678810-bt80GDIl";
        
        await liff.init({ liffId });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const profile = await liff.getProfile();
        setUser(profile);
        setIdToken(liff.getIDToken());
      } catch (err: any) {
        console.error('LIFF initialization failed', err);
        setError(err.message || 'Failed to initialize LINE login');
      } finally {
        setIsLoading(false);
      }
    };

    initLiff();
  }, []);

  const logout = () => {
    if (liff.isLoggedIn()) {
      liff.logout();
      window.location.reload();
    }
  };

  return (
    <AuthContext.Provider value={{ user, idToken, isLoading, error, isAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
