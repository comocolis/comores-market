import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "Clé API manquante" }, { status: 500 });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
        return NextResponse.json({ error: "Image manquante" }, { status: 400 });
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
      // REMPLACEMENT OFFICIEL : Llama 4 Scout (17B)
      // C'est le nouveau modèle multimodal qui remplace Llama 3.2 Vision
      model: "meta-llama/llama-4-scout-17b-16e-instruct", 
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