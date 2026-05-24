import { Transaction, Category } from "../types";

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export class GeminiService {
  static async analyzeSpending(transactions: Transaction[], categories: Category[]) {
    try {
      const res = await fetch("/api/analyze-spending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions, categories }),
      });
      if (!res.ok) throw new Error("Phân tích dữ liệu lỗi từ server");
      return await res.json();
    } catch (error) {
      console.error("Gemini proxy analysis error:", error);
      return null;
    }
  }

  static async parseVoiceInput(text: string, categories: Category[]) {
    try {
      const res = await fetch("/api/parse-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, categories }),
      });
      if (!res.ok) throw new Error("Xử lý giọng nói lỗi từ server");
      return await res.json();
    } catch (error) {
      console.error("Gemini proxy parsing error:", error);
      return null;
    }
  }

  static async chatWithAi(message: string, history: ChatMessage[], transactions: Transaction[], categories: Category[]) {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history, transactions, categories }),
      });
      if (!res.ok) throw new Error("Kết nối máy chủ trợ lý lỗi");
      const data = await res.json();
      return data.reply;
    } catch (error) {
      console.error("Gemini proxy chat error:", error);
      return "Rất tiếc, tôi đang mất kết nối đến máy chủ phân trị tài chính. Vui lòng thử lại sau giây lát!";
    }
  }
}

