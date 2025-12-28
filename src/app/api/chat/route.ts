import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js"; // Assurez-vous d'avoir installé @supabase/supabase-js

// Initialisation de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: "Clé manquante" }, { status: 500 });

  try {
    const { message, history } = await req.json();

    // 1. RÉCUPÉRATION DES DONNÉES TEMPS RÉEL
    const { data: products } = await supabase
      .from('products')
      .select('title, price, category')
      .limit(10);

    const productsList = products 
      ? products.map(p => `- ${p.title} (${p.price} KMF)`).join('\n')
      : "Aucun produit disponible pour le moment.";

    // 2. CONFIGURATION DU MODÈLE
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const SYSTEM_PROMPT = `
      Tu es Elite CM, l'IA centrale de Comores Market.
      
      CONTEXTE RÉEL DU SITE :
      Voici les derniers produits en vente que tu dois connaître :
      ${productsList}

      RAPPELS IMPORTANTS :
      - Offre Élite : 2 500 KMF/mois (Visibilité boostée, photos illimitées).
      - Sécurité : Comptes gérés via Supabase [cite: 2025-12-09].
      - Style : Prestige, Silk & Stone. Sois concis.
    `;

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
        { role: "model", parts: [{ text: "Je suis connecté à la base de données. Je connais les stocks actuels." }] },
        ...(history || [])
      ],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    
    return NextResponse.json({ text: response.text().normalize("NFC") });

  } catch (error: any) {
    console.error("ERREUR CONNECTÉE :", error.message);
    return NextResponse.json({ error: "Erreur de liaison base de données." }, { status: 500 });
  }
}