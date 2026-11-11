"use client";

import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { Member, Permission } from "@/lib/auth/permissions";

interface AuthContextValue {
  currentUser: Member;
  can: (permission: Permission) => boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (res) => {
        if (res.status === 401) {
          window.location.assign("/login?error=session");
          return;
        }
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || "Could not load your account.");
        setCurrentUser(json.member);
      })
      .catch((err: unknown) =>
        setLoadError(err instanceof Error ? err.message : "Could not load your account.")
      );
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/login");
  }, []);

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6 text-sm text-muted-foreground">
        {loadError ? (
          <span role="alert">{loadError}</span>
        ) : (
          <RefreshCw className="h-5 w-5 animate-spin [animation-duration:650ms]" aria-label="Loading" />
        )}
      </div>
    );
  }

  const value: AuthContextValue = {
    currentUser,
    can: (permission) => currentUser.permissions.includes(permission),
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
