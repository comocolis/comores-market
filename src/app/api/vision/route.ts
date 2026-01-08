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

    // On utilise le modèle Vision de Groq (Llama 3.2)
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyse cette image et écris une description de vente courte, séduisante et précise pour une marketplace (Comores Market). Mentionne la couleur, l'état apparent et le type d'objet. Sois vendeur !"
            },
            {
              type: "image_url",
              image_url: {
                url: imageBase64, // Format attendu: "data:image/jpeg;base64,..."
              },
            },
          ],
        },
      ],
      model: "llama-3.2-11b-vision-preview", // Modèle Vision Gratuit de Groq
      temperature: 0.5,
      max_tokens: 500,
    });

    const description = completion.choices[0]?.message?.content || "";
    return NextResponse.json({ text: description });

  } catch (error: any) {
    console.error("ERREUR VISION:", error);
    return NextResponse.json({ error: "Impossible d'analyser l'image" }, { status: 500 });
  }
}