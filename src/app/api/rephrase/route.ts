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
    const { text } = await req.json();

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Tu es un expert en marketing de luxe. Ta mission : Réécrire la description produit fournie pour qu'elle soit vendeuse, professionnelle, chaleureuse et sans fautes. Utilise des emojis avec parcimonie. Ne mets pas de guillemets au début ou à la fin. Garde les informations techniques exactes."
        },
        {
          role: "user",
          content: text
        }
      ],
      model: "llama-3.3-70b-versatile", // Modèle texte très puissant et gratuit
      temperature: 0.7,
      max_tokens: 1024,
    });

    const newText = completion.choices[0]?.message?.content || text;
    return NextResponse.json({ text: newText });

  } catch (error: any) {
    console.error("ERREUR REPHRASE:", error);
    return NextResponse.json({ error: "Erreur de reformulation" }, { status: 500 });
  }
}