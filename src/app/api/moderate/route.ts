import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { title, description } = await req.json();
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `Analyse cette annonce : "${title} - ${description}". 
    Réponds UNIQUEMENT en JSON sous ce format : {"is_safe": boolean, "reason": "string", "quality_score": number}. 
    Pas de texte avant ou après.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Nettoyage de la réponse (enlève les ```json ... ``` si l'IA en ajoute)
    const jsonString = text.replace(/```json|```/g, "").trim();
    const jsonResponse = JSON.parse(jsonString);

    return NextResponse.json(jsonResponse);
  } catch (error: any) {
    console.error("ERREUR MODÉRATION :", error.message);
    // En cas d'échec de l'IA, on laisse passer l'annonce par sécurité mais avec un score moyen
    return NextResponse.json({ is_safe: true, reason: "Vérification manuelle", quality_score: 5 });
  }
}