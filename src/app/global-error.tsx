"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

// On retire Sentry d'ici pour éviter le crash du Build
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  
  useEffect(() => {
    // Log simple dans la console du navigateur pour le débogage
    console.error("Erreur Critique Globale:", error);
  }, [error]);

  return (
    <html lang="fr">
      <body className="bg-[#F8FAFC] min-h-screen flex items-center justify-center font-sans p-6">
        
        {/* CARTE D'ERREUR STYLISÉE */}
        <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 text-center shadow-2xl shadow-black/5 border border-white">
          
          {/* Icône d'alerte */}
          <div className="bg-red-50 w-20 h-20 rounded-4xl flex items-center justify-center mx-auto mb-6 text-red-500 shadow-inner">
            <AlertTriangle size={36} strokeWidth={2.5} />
          </div>

          {/* Titre et Message */}
          <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
            Erreur Critique
          </h2>
          <p className="text-sm text-gray-500 font-medium mb-8 leading-relaxed">
            Une erreur inattendue s'est produite lors du chargement.
          </p>

          {/* Bouton de relance (Fonction reset) */}
          <button
            onClick={() => reset()}
            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-gray-900/20 active:scale-95 transition flex items-center justify-center gap-2"
          >
            <RefreshCcw size={14} />
            Relancer l'application
          </button>

        </div>
      </body>
    </html>
  );
}