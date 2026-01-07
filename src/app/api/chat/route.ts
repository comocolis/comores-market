import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialisation de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: "Clé API manquante" }, { status: 500 });

  try {
    const { message, history } = await req.json();

    // 1. RÉCUPÉRATION DU CONTEXTE MARCHÉ (Plus riche)
    // On récupère aussi l'île et l'ID pour que l'IA comprenne la géographie
    const { data: products } = await supabase
      .from('products')
      .select('id, title, price, category, sub_category, location_island')
      .order('created_at', { ascending: false }) // Les plus récents d'abord
      .limit(8);

    const contextProducts = products 
      ? products.map(p => `- [${p.sub_category}] ${p.title} : ${p.price} KMF à ${p.location_island}`).join('\n')
      : "Aucun produit récent.";

    // 2. LE CERVEAU (SYSTEM PROMPT OPTIMISÉ)
    const SYSTEM_PROMPT = `
      TU ES : "Elite CM", l'assistant expert de Comores Market (La 1ère marketplace des Comores).
      TON BUT : Aider l'utilisateur à acheter ou vendre, comme un conseiller de luxe.
      TON STYLE : Professionnel, Empathique, Concis et Chaleureux.

      RÈGLES ABSOLUES (A RESPECTER) :
      1. NE JAMAIS mentionner "Supabase", "Base de données", "JSON" ou des ID techniques.
      2. NE JAMAIS faire de citations techniques type "". Tu parles normalement.
      3. Si l'utilisateur cherche un produit, DEMANDE des précisions (Budget ? Île ? Modèle ?) avant de proposer.
      4. Mets en GRAS les prix et les noms de produits importants.

      INFORMATIONS COMMERCIALES :
      - Offre Élite (Vendeurs) : 2 500 KMF/mois. Avantages : Visibilité x10, Badge Vérifié, Photos illimitées.
      - Sécurité : Transactions main à la main recommandées. Ne jamais envoyer d'argent à l'avance.

      APERÇU DU MARCHÉ ACTUEL (Ce qu'il y a en rayon) :
      ${contextProducts}

      SCÉNARIOS TYPES :
      - Si on te dit "Je cherche une voiture" -> Réponds : "Bienvenue ! Quel est votre budget approximatif et sur quelle île cherchez-vous (Ngazidja, Ndzouani...) ?"
      - Si on te demande "Comment vendre ?" -> Explique le bouton "+" et suggère l'offre Élite pour vendre plus vite.
    `;

    // 3. CONFIGURATION DU MODÈLE
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Utilisation de 1.5 Flash (plus rapide et intelligent)

    const chat = model.startChat({
      history: [
        // On injecte le System Prompt comme premier message caché
        { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
        { role: "model", parts: [{ text: "Bien reçu. Je suis Elite CM, prêt à conseiller les clients de Comores Market avec élégance et précision." }] },
        // On ajoute l'historique réel de la conversation
        ...(history || [])
      ],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();
    
    return NextResponse.json({ text: text });

  } catch (error: any) {
    console.error("ERREUR AI :", error.message);
    // Message d'erreur "humain" pour l'utilisateur
    return NextResponse.json({ text: "Mes circuits sont un peu encombrés par l'affluence. Pouvez-vous répéter votre demande ?" });
  }
}