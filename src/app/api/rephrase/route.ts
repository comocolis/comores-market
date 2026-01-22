import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "Clé API manquante" }, { status: 500 });
  }

  try {
    // Validate user is authenticated
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { text } = await req.json();
    
    // Validate input
    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: "Texte invalide" }, { status: 400 });
    }

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