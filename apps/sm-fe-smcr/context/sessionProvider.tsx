"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useMsal } from "@azure/msal-react";
import { UserProfile } from "@/lib/types/userProfile";
import { getUserMember, getUserPreferences } from "@/lib/actions/user.action";
import {
  readMemberByEmail,
  createMember,
} from "@/lib/services/members.service";

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
  const { accounts, instance, inProgress } = useMsal();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = useCallback(
    async (email: string, name: string): Promise<UserProfile> => {
      const response = await fetch("/api/user/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, name }),
      });

      if (!response.ok) {
        throw new Error("Errore nel recupero del profilo utente");
      }

      const res = await response.json();
      return res.data;
    },
    [],
  );

  const refreshUserData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsReady(false);

    await new Promise((resolve) => setTimeout(resolve, 100));

    if (!accounts || accounts.length === 0) {
      setUser(null);
      setIsLoading(false);
      setIsReady(true);
      return;
    }

    const msalAccount = accounts[0];
    if (!msalAccount || !msalAccount.username || !msalAccount.name) {
      setError("Account MSAL non valido o incompleto");
      setUser(null);
      setIsLoading(false);
      setIsReady(true);
      return;
    }

    try {
      const userProfile = await fetchUserProfile(
        msalAccount.username,
        msalAccount.name,
      );

      // Check if member exists in the new members table, create if not
      const memberResult = await readMemberByEmail(msalAccount.username);
      if (memberResult.error || !memberResult.data) {
        // Member doesn't exist - create one
        console.log(
          "Member not found, creating new member for:",
          msalAccount.username,
        );

        // Extract firstname and lastname from MSAL claims or parse from name
        const firstname =
          (msalAccount.idTokenClaims as any)?.given_name ||
          msalAccount.name?.split(" ")[0] ||
          "Unknown";
        const lastname =
          (msalAccount.idTokenClaims as any)?.family_name ||
          msalAccount.name?.split(" ").slice(1).join(" ") ||
          "User";

        const createResult = await createMember({
          email: msalAccount.username,
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
        email: msalAccount.username,
        name: msalAccount.name,
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
  }, [accounts, fetchUserProfile]);

  const logout = useCallback(async () => {
    try {
      setUser(null);
      await instance.logoutRedirect();
    } catch (err: any) {
      console.error("Errore durante il logout:", err);
      setError(err.message);
    }
  }, [instance]);

  useEffect(() => {
    if (inProgress !== "none") return;

    const timer = setTimeout(() => {
      refreshUserData();
    }, 50);

    return () => clearTimeout(timer);
  }, [inProgress, refreshUserData]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.includes("msal")) {
        console.log("MSAL storage changed, refreshing user data");
        refreshUserData();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
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
