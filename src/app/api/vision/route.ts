import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { isRateLimited } from "@/lib/rate-limit";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ~4 Mo en base64 : au-dela, l'image est refusee avant d'etre envoyee a l'IA.
const MAX_IMAGE_CHARS = 6_000_000;

export async function POST(req: Request) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "Clé API manquante" }, { status: 500 });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (isRateLimited(`vision:${user.id}`, 10, 10 * 60 * 1000)) {
      return NextResponse.json({ error: "Trop de demandes" }, { status: 429 });
    }

    const { imageBase64 } = await req.json();

    if (!imageBase64 || typeof imageBase64 !== 'string' || !imageBase64.startsWith('data:image/')) {
        return NextResponse.json({ error: "Image manquante ou invalide" }, { status: 400 });
    }

    if (imageBase64.length > MAX_IMAGE_CHARS) {
        return NextResponse.json({ error: "Image trop volumineuse" }, { status: 413 });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Décris cet objet pour une annonce de vente (titre court et 2 phrases vendeuses). Mentionne l'état et la couleur."
            },
            {
              type: "image_url",
              image_url: {
                url: imageBase64,
              },
            },
          ],
        },
      ],
      // Modèle multimodal inclus dans l'offre gratuite Groq
      model: "qwen/qwen3.8-27b",
      temperature: 0.5,
      max_tokens: 300,
    });

    const description = completion.choices[0]?.message?.content || "";
    
    return NextResponse.json({ text: description });

  } catch (error: any) {
    // If model fails, return error message
    if (error?.error?.code === 'model_decommissioned' || error?.status === 404) {
        return NextResponse.json({ 
            text: "Service Vision en maintenance (Modèle en cours de déploiement).", 
            error: "Model unavailable" 
        });
    }

    return NextResponse.json({ error: "Analyse impossible" }, { status: 500 });
  }
}
