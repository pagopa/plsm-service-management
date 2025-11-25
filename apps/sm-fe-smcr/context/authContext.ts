// import { createContext, use } from "react";

// import authClient from "@/lib/auth-client";

// export const AuthContext = createContext<
//   ReturnType<typeof authClient.useSession> | undefined
// >(undefined);

// export function useAuth() {
//   const context = use(AuthContext);
//   if (context === undefined) {
//     throw new Error("useAuth must be used within a AuthProvider");
//   }
//   return context;
// }
