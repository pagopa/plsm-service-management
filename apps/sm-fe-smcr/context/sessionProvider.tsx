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
import clientLogger from "@/lib/logger/logger.client";

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

      // Sessione valida: se l'arricchimento del profilo fallisce l'utente resta
      // comunque autenticato, con un profilo minimo. Un errore transitorio (DB
      // a freddo, timeout) non deve essere scambiato per "non autenticato" dal
      // guard di rotta, che manderebbe l'utente su /unauthorized.
      // userProfile è dichiarato qui fuori per poterne preservare l'id (dal DB,
      // via /api/user/profile) nel fallback quando la fetch è già riuscita;
      // claims.userId (id di sessione) resta solo come ultima risorsa.
      let userProfile: Pick<UserProfile, "email" | "id" | "name"> | undefined;

      try {
        userProfile = await fetchUserProfile();

        // Check if member exists in the new members table, create if not
        const memberResult = await readMemberByEmail(claims.email);
        if (memberResult.error || !memberResult.data) {
          void clientLogger.info(
            {
              info: {
                event: "session.member.create_missing",
                metadata: { email: claims.email },
              },
            },
            "Member not found, creating new member",
          );

          const { firstname, lastname } = splitDisplayName(claims.name);

          const createResult = await createMember({
            email: claims.email,
            firstname,
            lastname,
          });

          if (createResult.error) {
            void clientLogger.error(
              { error: createResult.error },
              "Failed to create member",
            );
          } else {
            void clientLogger.info("Member created successfully");
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
      } catch (enrichError: any) {
        // Autenticato ma arricchimento fallito: degradazione morbida, niente
        // logout. L'utente accede alle rotte senza vincoli di team; quelle
        // team-gated ricadono su "insufficient_permissions" (→ /dashboard),
        // non su "not_authenticated" (→ /unauthorized).
        void clientLogger.error(
          { error: enrichError },
          "Errore caricamento profilo: sessione valida, uso profilo minimo dai claim",
        );
        setError(enrichError.message || "Errore caricamento profilo");
        setUser({
          id: userProfile?.id ?? claims.userId,
          email: claims.email,
          name: claims.name,
          membersOf: [],
          activeTeam: null,
          preferences: { teamId: null, theme: "system" },
        });
      }
    } catch (err: any) {
      // Errore nel recupero dei claim (/api/auth/me non 401): stato della
      // sessione non determinabile, trattato come non autenticato.
      void clientLogger.error({ error: err }, "Errore verifica sessione");
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
      void clientLogger.error({ error: err }, "Errore durante il logout");
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
