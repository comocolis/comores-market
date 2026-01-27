import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 1. SETUP SUPABASE (Accès global pour la recherche)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 2. SETUP GROQ
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  // Vérification de sécurité de base
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

    // --- A. INTELLIGENCE : ANALYSE DU MESSAGE ---
    // On extrait les mots-clés utiles en retirant les mots de liaison courants
    const keywords = message
      .replace(/[^\w\s]|_/g, "") // Enlève la ponctuation
      .replace(/\b(je|tu|il|nous|vous|ils|le|la|les|un|une|des|du|de|dans|et|ou|est|sont|avoir|chercher|voudrais|veux|recherche|bonjour|salut|hello|dispo|disponible|prix|coute|combien|y a t il)\b/gi, "")
      .trim();

    // --- B. INTELLIGENCE : RECHERCHE DYNAMIQUE OU NOUVEAUTÉS ---
    let productsContext = "";
    let searchMode = "Derniers ajouts";
    let productsData: any[] = [];

    // 1. Si des mots-clés sont trouvés, on fait une RECHERCHE CIBLÉE
    if (keywords.length > 2) {
        // On cherche dans le titre, la catégorie ou la description
        const { data: searchResults } = await supabase
            .from('products')
            .select('title, price, sub_category, location_island, description')
            .or(`title.ilike.%${keywords}%,sub_category.ilike.%${keywords}%,description.ilike.%${keywords}%`)
            .limit(6); // On donne les 6 meilleurs résultats pertinents

        if (searchResults && searchResults.length > 0) {
            productsData = searchResults;
            searchMode = `Résultats de recherche pour "${keywords}"`;
        }
    }

    // 2. Si la recherche ne donne rien (ou pas de mots-clés), on affiche les NOUVEAUTÉS
    if (productsData.length === 0) {
        const { data: recent } = await supabase
            .from('products')
            .select('title, price, sub_category, location_island')
            .order('created_at', { ascending: false })
            .limit(6);
        productsData = recent || [];
    }

    // --- C. STATISTIQUES GLOBALES ---
    // Pour que l'IA sache qu'il y a plus que ce qu'elle voit
    const { count } = await supabase.from('products').select('*', { count: 'exact', head: true });
    const totalCount = count || 0;

    // --- D. CONSTRUCTION DU CONTEXTE ---
    const formattedProducts = productsData.map((p: any) => {
        // On coupe la description si elle est trop longue pour économiser des tokens
        const shortDesc = p.description ? p.description.substring(0, 100) + "..." : "Pas de description";
        return `- ${p.title} (**${p.price} KMF**) à ${p.location_island} [${p.sub_category}]. Info: ${shortDesc}`;
    }).join('\n');

    const contextPrompt = systemContext ? `\nCONTEXTE NAVIGATION : ${systemContext}` : "";

    const SYSTEM_PROMPT = `
      Tu es Elite CM, l'IA experte de Comores Market.
      
      DONNÉES DU SITE EN TEMPS RÉEL :
      - Total produits sur le site : **${totalCount}** annonces.
      - Contexte actuel (Produits visibles par l'IA) : **${searchMode}**
      
      LISTE DES PRODUITS PERTINENTS (Utilise-les pour répondre) :
      ${formattedProducts}

      DIRECTIVES :
      1. Si l'utilisateur cherche un produit précis, regarde dans la liste ci-dessus.
      2. Si tu ne trouves pas dans la liste, dis : "Je n'ai pas trouvé ça dans mes résultats immédiats, mais avec ${totalCount} annonces, essayez la barre de recherche."
      3. Sois vendeur : propose les prix, les lieux et les détails.
      4. Ne parle JAMAIS de "base de données" ou de "json", parle comme un humain.
      5. Si on te demande "quoi de neuf", cite les produits de la liste.
      
      ${contextPrompt}
    `;

    // --- E. PRÉPARATION ET APPEL (Format Compatible) ---
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
      temperature: 0.7,
      max_tokens: 600,
    });

    const responseText = completion.choices[0]?.message?.content || "Je n'ai pas de réponse.";
    
    return NextResponse.json({ text: responseText });

  } catch (error: any) {
    console.error("API CHAT ERREUR :", error);
    return NextResponse.json({ text: "Désolé, une erreur interne est survenue." }, { status: 500 });
  }
}