import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;

  if (!key) {
    return NextResponse.json({ error: "Clé API manquante dans .env.local" }, { status: 500 });
  }

  try {
    const genAI = new GoogleGenerativeAI(key);
    const { message, history } = await req.json();

    // Utilisation du modèle 1.5-flash qui est le standard actuel
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Configuration du chat avec l'historique
    const chat = model.startChat({
      history: history || [],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();
    
    return NextResponse.json({ text });

  } catch (error: any) {
    console.error("--- ERREUR SERVEUR IA ---");
    console.error("Message:", error.message);
    
    // Si l'erreur est encore un 404, cela peut être dû au nom du modèle
    if (error.message.includes("404")) {
      console.log("ASTUCE : Tentez d'utiliser 'gemini-1.5-flash-latest' comme nom de modèle.");
    }

    return NextResponse.json({ 
      error: "L'assistant Elite CM rencontre une difficulté technique.",
      details: error.message 
    }, { status: 500 });
  }
}