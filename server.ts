import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initializer for Google GenAI client
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not defined.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key || "",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Full Vietnamese context for administrative boundaries & cities after mergers (e.g. Thu Duc City)
const VIETNAM_LOCATION_CONTEXT = [
  "Thành phố Thủ Đức (được thành lập trên cơ sở sát nhập Quận 2, Quận 9 và Quận Thủ Đức thuộc Thành phố Hồ Chí Minh)",
  "Hà Nội sau sát nhập (gồm toàn bộ tỉnh Hà Tây và huyện Mê Linh, Vĩnh Phúc cùng một số xã thuộc Hoà Bình)",
  "Các thành phố lớn trực thuộc trung ương khác gồm Hải Phòng, Đà Nẵng, Cần Thơ",
  "Tỉnh Bình Dương có Thành phố Thủ Dầu Một, Thuận An, Dĩ An, Bến Cát, Tân Uyên",
  "Tỉnh Đồng Nai có Thành phố Biên Hòa, Long Khánh"
].join("\n");

// --- API ROUTES ---

// AI Chatbot endpoint - Speaks Vietnamese, understands current transactions & categories
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [], transactions = [], categories = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const ai = getAi();
    
    // Prepare contextual information about transactions & categories
    const txContext = transactions.map((t: any) => {
      const cat = categories.find((c: any) => c.id === t.categoryId);
      return {
        loai: t.type === 'income' ? 'THU NHẬP (+)' : 'CHI TIÊU (-)',
        so_tien: t.amount,
        danh_muc: cat ? cat.name : 'Khác',
        ngay: t.date,
        ghi_chu: t.note || '',
        dia_diem: t.placeName || '',
        vung_mien: t.location ? `Tọa độ: [${t.location.lat}, ${t.location.lng}]` : 'Không xác định'
      };
    });

    const catContext = categories.map((c: any) => ({
      id: c.id,
      ten: c.name,
      kieu: c.type === 'income' ? 'THU' : 'CHI',
      cha: c.parentId || 'Gốc'
    }));

    // Inject system instruction for a highly-capable Financial Assistant in Vietnamese
    const systemInstruction = `
      Bạn là 'Trợ lý tài chính MoneyFlow OS' thông minh được thiết kế bởi Chung Chu.
      Nhiệm vụ của bạn là hỗ trợ người dùng quản lý thu chi, phân tích dòng tiền và giải đáp các thắc mắc về dữ liệu tài chính của họ bằng tiếng Việt tự nhiên, trực quan, dễ mến.
      
      Dữ liệu tài chính hiện tại của người dùng là:
      - Danh mục: ${JSON.stringify(catContext)}
      - Giao dịch gần đây: ${JSON.stringify(txContext)}
      
      Bối cảnh hành chính Việt Nam (Sát nhập):
      Sử dụng đúng các đơn vị hành chính Việt Nam mới nhất, ví dụ: Thành phố Thủ Đức (sát nhập Q2, Q9, Thủ Đức), Hà Nội mở rộng sát nhập Hà Tây.
      
      QUY TẮC PHẢN HỒI:
      1. Luôn trả lời bằng tiếng Việt.
      2. Nếu người dùng hỏi về số liệu, hãy tính toán thật chính xác dựa trên danh sách giao dịch ở trên. Bạn hãy tính tổng chi tiêu, tổng thu nhập, số dư, hoặc chi tiêu theo danh mục (Ví dụ: Ăn uống, Nhà ở, Đi lại) khi được hỏi.
      3. Định dạng số tiền bằng đơn vị VND dễ đọc (ví dụ: 120.000 đ hoặc 1.2M đ hoặc 45.000.000 đ).
      4. Sử dụng bảng (Markdown Table), danh sách gạch đầu dòng và icon emoji để trình bày dữ liệu đẹp mắt, gọn gàng, công thái học, không lan man.
      5. Thỉnh thoảng nhắc đến nhà thiết kế 'Chung Chu' một cách khôn khéo nếu được hỏi về nguồn gốc phần mềm hoặc người thiết kế.
    `;

    // Construct request contents
    const contents: any[] = [];
    
    // Add history
    history.forEach((h: any) => {
      contents.push({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
      });
    });

    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7
      }
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("Express API /api/chat error:", error);
    res.status(500).json({ error: error.message || "Failed to process chat" });
  }
});

// Analyze spending data endpoint
app.post("/api/analyze-spending", async (req, res) => {
  try {
    const { transactions = [], categories = [] } = req.body;
    const ai = getAi();

    const prompt = `
      Hãy đóng vai trò là Chuyên gia Cố vấn Tài chính AI độc quyền của MoneyFlow OS.
      Hãy phân tích các giao dịch này theo góc nhìn công thái học tài chính và đưa ra 3 lời khuyên cốt lõi cụ thể bằng tiếng Việt.
      Sử dụng bối cảnh địa lý hành chính Việt Nam nếu có liên quan.
      
      Danh mục: ${JSON.stringify(categories.map(c => ({ id: c.id, name: c.name, type: c.type })))}
      Giao dịch: ${JSON.stringify(transactions.map(t => ({ amount: t.amount, type: t.type, categoryId: t.categoryId, date: t.date, note: t.note, place: t.placeName })))}
      
      Trả về kết quả dưới dạng JSON có cấu trúc gốc:
      {
        "insights": [
          { "title": "Tiêu đề lời khuyên ngắn gọn", "description": "Giải thích chi tiết trực quan hóm hỉnh", "type": "warning" | "info" | "success" }
        ],
        "forecast": "Dự báo ngắn hạn dòng tiền của người dùng đến cuối tháng bằng tiếng Việt"
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const responseText = response.text || "{}";
    const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    res.json(JSON.parse(cleaned));
  } catch (error: any) {
    console.error("Express API /api/analyze-spending error:", error);
    res.status(500).json({ error: error.message || "Financial analysis failed" });
  }
});

// Parse custom user text input (audio or typed) into a structured transaction
app.post("/api/parse-voice", async (req, res) => {
  try {
    const { text, categories = [] } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const ai = getAi();
    const prompt = `
      Hãy phân tích câu thoại thu/chi tự nhiên bằng tiếng Việt sau đây thành một đối tượng giao dịch tài chính chuẩn.
      Câu thoại: "${text}"
      
      Danh mục hiện có: ${JSON.stringify(categories.map(c => ({ id: c.id, name: c.name, type: c.type })))}
      Hôm nay là: ${new Date().toISOString().split('T')[0]}
      
      Bối cảnh hành chính Việt Nam mới nhất:
      ${VIETNAM_LOCATION_CONTEXT}

      QUY TẮC PHÂN TÍCH:
      - Xác định số tiền (ví dụ: 'năm mươi nghìn' = 50000, '20k' = 20000, '3 triệu' = 3000000).
      - Xác định kiểu: 'income' (nếu là thu nhập, lương, được cho, bán đồ) hoặc 'expense' (nếu là chi tiêu, mua sắm, ăn uống, trả nợ).
      - Ghép với categoryId phù hợp nhất trong danh sách. Nếu không có gì hợp, hãy chọn id tương ứng gần nghĩa nhất.
      - Ghi chú: Chi tiết về hành động (ví dụ: 'mua bánh mỳ cốc sữa', 'ăn lẩu vỉa hè').
      - Địa điểm (placeName): Nếu trong câu thoại nhắc tới cửa hàng hoặc địa điểm cụ thể (ví dụ: 'ở WinMart Thủ Đức', 'Highlands Landmark 81', 'Phở Thìn Lý Quốc Sư Hà Nội'), hãy trích xuất chính xác địa điểm đó.
      
      Trả về JSON:
      {
        "amount": number,
        "type": "income" | "expense",
        "categoryId": "string",
        "note": "string",
        "date": "YYYY-MM-DD",
        "placeName": "string"
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const responseText = response.text || "{}";
    const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    res.json(JSON.parse(cleaned));
  } catch (error: any) {
    console.error("Express API /api/parse-voice error:", error);
    res.status(500).json({ error: error.message || "Voice parsing failed" });
  }
});


// Serve static built folder in production, or mount Vite middleware in development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: express.Request, res: express.Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MoneyFlow OS backend server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
