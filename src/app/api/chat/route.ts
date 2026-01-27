import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
    return NextResponse.json({ text: "Erreur serveur : Clé API manquante." }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { message, history, systemContext } = body;
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: "Message vide" }, { status: 400 });
    }

    const safeHistory = Array.isArray(history) ? history : [];

    // --- A. ANALYSE RAPIDE ---
    const keywords = message
      .replace(/[^\w\s]|_/g, "")
      .replace(/\b(je|tu|il|nous|vous|ils|le|la|les|un|une|des|du|de|dans|et|ou|est|sont|avoir|chercher|voudrais|veux|recherche|bonjour|salut|hello|dispo|disponible|prix|coute|combien|y a t il)\b/gi, "")
      .trim();

    // --- B. RECHERCHE CIBLÉE ---
    let productsContext = "";
    let productsData: any[] = [];

    if (keywords.length > 2) {
        const { data: searchResults } = await supabase
            .from('products')
            .select('title, price, sub_category, location_island, description')
            .or(`title.ilike.%${keywords}%,sub_category.ilike.%${keywords}%,description.ilike.%${keywords}%`)
            .limit(5);

        if (searchResults && searchResults.length > 0) {
            productsData = searchResults;
        }
    }

    if (productsData.length === 0) {
        const { data: recent } = await supabase
            .from('products')
            .select('title, price, sub_category, location_island')
            .order('created_at', { ascending: false })
            .limit(3);
        productsData = recent || [];
    }

    // --- C. CONTEXTE INVISIBLE ---
    const formattedProducts = productsData.map((p: any) => {
        return `- ${p.title} (${p.price} KMF) à ${p.location_island}`;
    }).join('\n');

    const contextPrompt = systemContext ? `\nCONTEXTE UTILISATEUR : ${systemContext}` : "";

    // ✅ NOUVEAU SYSTEM PROMPT : GRAMMAIRE RENFORCÉE
    const SYSTEM_PROMPT = `
      Tu es l'assistant intelligent de Comores Market. Agis comme un expert humain serviable.

      TES INSTRUCTIONS STRICTES :
      1. **Ton français doit être grammaticalement PARFAIT.** Relis-toi avant de répondre. Pas de fautes de syntaxe ("ce que vous besoin" est interdit -> "ce dont vous avez besoin").
      2. **Ne donne JAMAIS de statistiques** (ex: "Il y a 300 articles") sauf si on te le demande explicitement.
      3. **Réponds directement à l'intention.** Sois utile immédiatement.
      4. **Sois naturel et fluide.** Evite le style robotique, mais garde une syntaxe correcte.
      5. **Utilise le contexte ci-dessous intelligemment** pour répondre aux questions sur les produits.

      CONTEXTE DES PRODUITS (À utiliser pour répondre, ne pas lister bêtement) :
      ${formattedProducts}
      
      ${contextPrompt}
      
      Si la liste des produits ci-dessus ne correspond pas à la demande, dis simplement que tu n'as pas ça sous la main mais qu'il peut chercher sur le site.
    `;

    // --- E. EXÉCUTION ---
    const normalizedHistory = safeHistory.map((msg: any) => {
        let content = "";
        if (typeof msg.content === 'string') content = msg.content;
        else if (Array.isArray(msg.parts) && msg.parts[0]?.text) content = msg.parts[0].text;
        
        return {
            role: (msg.role === 'user' || msg.role === 'model' || msg.role === 'assistant') 
                  ? (msg.role === 'model' ? 'assistant' : msg.role) 
                  : 'user',
            content: content || ""
        };
    });

    const fullConversation = [
      { role: "system", content: SYSTEM_PROMPT },
      ...normalizedHistory,
      { role: "user", content: message }
    ];

    const completion = await groq.chat.completions.create({
      messages: fullConversation as any,
      model: "llama-3.3-70b-versatile", 
      temperature: 0.4, // 📉 J'ai baissé légèrement la température (0.5 -> 0.4) pour réduire les risques d'erreurs bizarres.
      max_tokens: 400,
    });

    const responseText = completion.choices[0]?.message?.content || "Je n'ai pas de réponse.";
    
    return NextResponse.json({ text: responseText });

  } catch (error: any) {
    console.error("API CHAT ERREUR :", error);
    return NextResponse.json({ text: "Erreur serveur." }, { status: 500 });
  }
}