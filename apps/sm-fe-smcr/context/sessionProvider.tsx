"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { UserProfile } from "@/lib/types/userProfile";
import { getUserMember, getUserPreferences } from "@/lib/actions/user.action";
import {
  readMemberByEmail,
  createMember,
} from "@/lib/services/members.service";

type SessionClaims = {
  email: string;
  name: string;
  roles: string[];
  userId: string;
};

interface SessionContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
  refreshUserData: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
  setIsReady: (ready: boolean) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = useCallback(async (): Promise<
    Pick<UserProfile, "email" | "id" | "name">
  > => {
    const response = await fetch("/api/user/profile", {
      cache: "no-store",
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Errore nel recupero del profilo utente");
    }

    const res = await response.json();
    return res.data;
  }, []);

  const fetchSessionClaims =
    useCallback(async (): Promise<SessionClaims | null> => {
      const response = await fetch("/api/auth/me", {
        cache: "no-store",
        credentials: "same-origin",
        method: "GET",
      });

      if (response.status === 401) {
        return null;
      }

      if (!response.ok) {
        throw new Error("Errore nel recupero della sessione autenticata");
      }

      const payload = await response.json();
      return payload.claims ?? null;
    }, []);

  const splitDisplayName = useCallback((name: string) => {
    const [firstname = "Unknown", ...lastnameParts] = name.trim().split(/\s+/);

    return {
      firstname,
      lastname: lastnameParts.join(" ") || "User",
    };
  }, []);

  const refreshUserData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsReady(false);

    try {
      const claims = await fetchSessionClaims();

      if (!claims?.email || !claims.name) {
        setUser(null);
        return;
      }

      const userProfile = await fetchUserProfile();

      // Check if member exists in the new members table, create if not
      const memberResult = await readMemberByEmail(claims.email);
      if (memberResult.error || !memberResult.data) {
        // Member doesn't exist - create one
        console.log("Member not found, creating new member for:", claims.email);

        const { firstname, lastname } = splitDisplayName(claims.name);

        const createResult = await createMember({
          email: claims.email,
          firstname,
          lastname,
        });

        if (createResult.error) {
          console.error("Failed to create member:", createResult.error);
        } else {
          console.log("Member created successfully:", createResult.data);
        }
      }

      // const userTeams = await getUserTeams(userProfile.id);
      const userMember = await getUserMember(userProfile.id);
      const userPreferences = await getUserPreferences(userProfile.id);
      setUser({
        ...userProfile,
        email: claims.email,
        name: claims.name,
        membersOf: userMember,
        activeTeam: null,
        preferences: {
          teamId: userPreferences.teamId,
          theme: userPreferences.theme,
        },
      });
    } catch (err: any) {
      console.error("Errore caricamento profilo:", err);
      setError(err.message || "Errore sconosciuto");
      setUser(null);
    } finally {
      setIsLoading(false);
      setIsReady(true);
    }
  }, [fetchSessionClaims, fetchUserProfile, splitDisplayName]);

  const logout = useCallback(async () => {
    try {
      setUser(null);
      setIsReady(false);
      window.location.assign("/api/auth/logout");
    } catch (err: any) {
      console.error("Errore durante il logout:", err);
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    void refreshUserData();
  }, [refreshUserData]);

  const value: SessionContextType = {
    user,
    isLoading,
    isReady,
    error,
    refreshUserData,
    logout,
    setUser,
    setIsReady,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession deve essere usato dentro SessionProvider");
  }
  return context;
}
