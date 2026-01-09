import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  // Sécurité : Si pas de clé, on laisse passer par défaut pour ne pas bloquer l'app
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ is_safe: true, quality_score: 80 });
  }

  try {
    const { title, description, price } = await req.json();

    const prompt = `
      Tu es un modérateur IA pour "Comores Market". 
      Tâche : Analyse cette annonce pour vérifier sa sécurité et sa qualité.

      ANNONCE :
      - Titre : "${title}"
      - Description : "${description}"
      - Prix : "${price}"

      CRITÈRES DE REFUS (DANGER) :
      - Armes, Drogues, Contenu Adulte/Sexuel, Arnaques évidentes, Discours de haine.

      CRITÈRES DE QUALITÉ (0-100) :
      - 100 : Description riche, détaillée, bonne orthographe.
      - 50 : Description basique.
      - 0 : Description vide ou incompréhensible.

      Réponds UNIQUEMENT au format JSON strict :
      {
        "is_safe": boolean,
        "reason": "Explication courte si refusé, sinon vide",
        "quality_score": number
      }
    `;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Tu es un modérateur strict mais juste. Tu réponds uniquement en JSON valide."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      // Utilisation de Llama 3.3 70B qui est excellent pour suivre les instructions JSON
      model: "llama-3.3-70b-versatile", 
      temperature: 0, // Zéro créativité, on veut de l'analyse pure
      response_format: { type: "json_object" } // Force la réponse JSON
    });

    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
        throw new Error("Réponse vide de l'IA");
    }

    const result = JSON.parse(content);

    return NextResponse.json({
        is_safe: result.is_safe ?? true,
        reason: result.reason || "",
        quality_score: result.quality_score || 70
    });

  } catch (error) {
    console.error("ERREUR MODERATION:", error);
    // En cas d'erreur API, on valide par défaut (Fail-safe)
    return NextResponse.json({ is_safe: true, quality_score: 50 });
  }
}