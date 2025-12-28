import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // 1. Récupération forcée de la clé
  const key = process.env.GEMINI_API_KEY;

  if (!key) {
    console.error("ERREUR : La variable GEMINI_API_KEY est introuvable.");
    return NextResponse.json({ error: "Clé API manquante" }, { status: 500 });
  }

  try {
    const genAI = new GoogleGenerativeAI(key);
    const { message } = await req.json();

    // 2. Utilisation de gemini-1.5-flash
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(message);
    const response = await result.response;
    
    return NextResponse.json({ text: response.text() });
  } catch (error: any) {
    console.error("ERREUR SERVEUR IA :", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}