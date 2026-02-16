
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import Groq from "npm:groq-sdk@0.7.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, history, systemContext } = await req.json()

    // 1. SETUP SUPABASE
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const groqApiKey = Deno.env.get('GROQ_API_KEY')

    if (!supabaseUrl || !supabaseAnonKey || !groqApiKey) {
      throw new Error('Missing environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const groq = new Groq({ apiKey: groqApiKey })

    if (!message || typeof message !== 'string') {
        return new Response(JSON.stringify({ error: "Message vide" }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
        });
    }

    const safeHistory = Array.isArray(history) ? history : [];

    // --- A. ANALYSE RAPIDE ---
    const keywords = message
      .replace(/[^\w\s]|_/g, "")
      .replace(/\b(je|tu|il|nous|vous|ils|le|la|les|un|une|des|du|de|dans|et|ou|est|sont|avoir|chercher|voudrais|veux|recherche|bonjour|salut|hello|dispo|disponible|prix|coute|combien|y a t il)\b/gi, "")
      .trim();

    // --- B. RECHERCHE CIBLÉE ---
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
        let role = msg.role;
        
        if (typeof msg.content === 'string') content = msg.content;
        else if (Array.isArray(msg.parts) && msg.parts[0]?.text) content = msg.parts[0].text;
        
        // Normalize role
        if (role === 'model') role = 'assistant';
        if (role !== 'user' && role !== 'assistant' && role !== 'system') role = 'user';

        return { role, content: content || "" };
    });

    const fullConversation = [
      { role: "system", content: SYSTEM_PROMPT },
      ...normalizedHistory,
      { role: "user", content: message }
    ];

    const completion = await groq.chat.completions.create({
      messages: fullConversation as any,
      model: "llama-3.3-70b-versatile", 
      temperature: 0.4, 
      max_tokens: 400,
    });

    const responseText = completion.choices[0]?.message?.content || "Je n'ai pas de réponse.";

    return new Response(JSON.stringify({ text: responseText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
