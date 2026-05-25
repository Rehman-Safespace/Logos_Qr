import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function main() {
  const result = await ai.models.embedContent({
    model: 'gemini-embedding-2',
    contents: ['hello world']
  });
  console.log(result.embeddings[0].values.length);
}
main().catch(console.error);
