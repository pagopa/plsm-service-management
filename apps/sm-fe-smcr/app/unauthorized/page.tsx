"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-500 to-cyan-510 text-white flex items-center justify-center px-4">
      <div className="backdrop-blur-3xl bg-white/5 border border-white/20 rounded-3xl p-10 shadow-2xl max-w-md text-center">
        <div className="flex justify-center mb-6">
          <ShieldAlert className="h-12 w-12 text-red-500" />
        </div>
        <h1 className="text-3xl text-black font-bold mb-4">Accesso Negato</h1>
        <p className="text-sm text-black mb-6">
          Non hai i permessi per visualizzare questa pagina.
          <br />
          Se pensi si tratti di un errore, contatta l’amministratore.
        </p>
        <Link href="/">
          <Button className="bg-red-600 hover:bg-red-700 transition-colors">
            Effettua il Login
          </Button>
        </Link>
      </div>
    </div>
  );
}
