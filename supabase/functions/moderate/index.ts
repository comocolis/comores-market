
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import Groq from "npm:groq-sdk@0.7.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const groqApiKey = Deno.env.get('GROQ_API_KEY')!

    if (!groqApiKey) {
      // If no API key, default to safe
      return new Response(JSON.stringify({ is_safe: true, quality_score: 80 }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
      })
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
        return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401, headers: corsHeaders })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
         return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401, headers: corsHeaders })
    }

    const { title, description, price } = await req.json()
    if (!title) {
        return new Response(JSON.stringify({ error: "Titre invalide" }), { status: 400, headers: corsHeaders })
    }

    const groq = new Groq({ apiKey: groqApiKey })

    const prompt = `
      Tu es un modérateur IA pour "Comores Market". 
      Tâche : Analyse cette annonce pour vérifier sa sécurité et sa qualité.

      ANNONCE :
      - Titre : "${title}"
      - Description : "${description}"
      - Prix : "${price}"

      RÈGLES DE SÉCURITÉ (SAFE) :
      1. Pa d'armes, pas de drogues, pas de contenu sexuel explicite, pas d'arnaques évidentes.
      2. Pas de propos haineux ou racistes.

      FORMAT DE RÉPONSE ATTENDU (JSON pur) :
      {
        "is_safe": true/false,
        "reason": "Raison si unsafe",
        "quality_score": 0-100 (Score basé sur la clarté, les détails, l'orthographe)
      }
    `;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama3-70b-8192",
      response_format: { type: "json_object" }, 
    });

    const responseContent = completion.choices[0]?.message?.content;
    let result = { is_safe: true, quality_score: 80, reason: "" };

    try {
        if (responseContent) {
            result = JSON.parse(responseContent);
        }
    } catch (e) {
        console.error("JSON Parse Error", e);
    }

    return new Response(JSON.stringify(result), {
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
