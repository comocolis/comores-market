import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// 1. SETUP SUPABASE
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 2. SETUP GROQ
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ text: "Erreur serveur : Clé API Groq manquante." }, { status: 500 });
  }

  try {
    // Validate user is authenticated
    const cookieStore = await cookies();
    const serverSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );
    
    const { data: { user } } = await serverSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { message, history } = await req.json();
    
    // Validate input
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: "Message invalide" }, { status: 400 });
    }
    if (!Array.isArray(history)) {
      return NextResponse.json({ error: "Historique invalide" }, { status: 400 });
    }

    // --- RÉCUPÉRATION DONNÉES ---
    let contextProducts = "Aucun produit récent.";
    try {
      const { data: products } = await supabase
        .from('products')
        .select('title, price, sub_category, location_island')
        .order('created_at', { ascending: false })
        .limit(5);

      if (products && products.length > 0) {
        contextProducts = products.map(p => `- ${p.title} (${p.price} KMF) à ${p.location_island} [${p.sub_category}]`).join('\n');
      }
    } catch (e) {
      console.error("Erreur DB:", e);
    }

    // --- SYSTEM PROMPT ---
    const SYSTEM_PROMPT = `
      Tu es Elite CM, l'assistant commercial de Comores Market.
      DIRECTIVES :
      1. Vendeur expert, poli et chaleureux.
      2. Pas de blabla technique (Supabase, JSON).
      3. Demande le budget ou l'île si besoin.
      4. Prix en **gras**.
      5. Sois concis.
      
      PRODUITS DISPONIBLES :
      ${contextProducts}
    `;

    // --- CONVERSION HISTORIQUE ---
    const apiMessages = history.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.parts[0].text || ""
    }));

    const fullConversation = [
      { role: "system", content: SYSTEM_PROMPT },
      ...apiMessages,
      { role: "user", content: message }
    ];

    // --- APPEL API GROQ (CORRECTION DU MODÈLE ICI) ---
    const completion = await groq.chat.completions.create({
      messages: fullConversation as any,
      // ON UTILISE LA VERSION 3.3 (La plus récente et active)
      model: "llama-3.3-70b-versatile", 
      temperature: 0.7,
      max_tokens: 500,
    });

    const responseText = completion.choices[0]?.message?.content || "Je réfléchis...";
    
    return NextResponse.json({ text: responseText });

  } catch (error: any) {
    console.error("ERREUR GROQ :", error);
    // Gestion spécifique de l'erreur "Modèle retiré" pour l'avenir
    if (error?.error?.code === 'model_decommissioned') {
        return NextResponse.json({ text: "Mise à jour technique en cours (changement de modèle)." });
    }
    return NextResponse.json({ text: "Une petite erreur de connexion est survenue." });
  }
}