import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Instructions de personnalité pour l'IA
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "Tu es Elite CM, l'assistant IA de ComoresMarket. Tu es poli, professionnel et tu aides les utilisateurs à vendre leurs produits ou à naviguer sur le site. Ton style est 'Prestige & Silk'. Réponds de manière concise." }],
        },
        {
          role: "model",
          parts: [{ text: "Bonjour ! Je suis Elite CM. Comment puis-je sublimer votre expérience sur ComoresMarket aujourd'hui ?" }],
        },
        ...history
      ],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });
  } catch (error) {
    return NextResponse.json({ error: "Erreur IA" }, { status: 500 });
  }
}