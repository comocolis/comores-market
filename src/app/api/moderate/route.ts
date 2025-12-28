import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { title, description, price } = await req.json();
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
      Tu es "La Sentinelle", le système de modération de Comores Market.
      Analyse cette annonce et détermine si elle respecte nos standards de prestige.

      ANNONCE :
      Titre: ${title}
      Description: ${description}
      Prix: ${price} KMF

      CRITÈRES DE REFUS :
      1. Arnaques ou promesses de gain d'argent facile.
      2. Produits illégaux, drogues ou armes (Attention : les masseurs comme le "Pistolet Fascia" sont autorisés).
      3. Langage offensant ou de très mauvaise qualité.
      4. Prix incohérent (ex: une voiture à 100 KMF).

      RÉPONSE ATTENDUE (JSON UNIQUEMENT) :
      {
        "is_safe": boolean,
        "reason": "explication courte en français",
        "quality_score": number (sur 10)
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonResponse = JSON.parse(response.text().replace(/```json|```/g, ""));

    return NextResponse.json(jsonResponse);
  } catch (error: any) {
    return NextResponse.json({ is_safe: true, reason: "Erreur technique, validation manuelle requise." });
  }
}