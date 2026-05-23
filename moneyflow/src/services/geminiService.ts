import { GoogleGenAI } from "@google/genai";
import { Transaction, Category } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export class GeminiService {
  static async analyzeSpending(transactions: Transaction[], categories: Category[]) {
    const prompt = `
      As a Financial Advisor AI, analyze these transactions and provide 3 key insights/recommendations.
      Categories: ${JSON.stringify(categories.map(c => ({ id: c.id, name: c.name })))}
      Transactions: ${JSON.stringify(transactions.map(t => ({ amount: t.amount, type: t.type, categoryId: t.categoryId, date: t.date, note: t.note })))}
      
      Return a response in JSON format:
      {
        "insights": [
          { "title": "...", "description": "...", "type": "warning|info|success" }
        ],
        "forecast": "Short forecast for end of month based on trend"
      }
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });
      const text = response.text || '{}';
      const jsonContent = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonContent);
    } catch (error) {
      console.error("Gemini analysis error:", error);
      return null;
    }
  }

  static async parseVoiceInput(text: string, categories: Category[]) {
    const prompt = `
      Parse this financial message into a transaction object.
      Message: "${text}"
      Available Categories: ${JSON.stringify(categories.map(c => ({ id: c.id, name: c.name })))}
      
      Return JSON:
      {
        "amount": number,
        "type": "income" | "expense",
        "categoryId": "string id",
        "note": "string",
        "date": "YYYY-MM-DD (today is ${new Date().toISOString().split('T')[0]})"
      }
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });
      const text = response.text || '{}';
      const jsonContent = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonContent);
    } catch (error) {
      console.error("Gemini parsing error:", error);
      return null;
    }
  }
}
