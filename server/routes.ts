import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = process.env.GOOGLE_API_KEY 
  ? new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)
  : null;

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/tarot-reading", async (req, res) => {
    try {
      if (!genAI) {
        return res.status(500).json({ 
          error: "Gemini API not configured. Please set GOOGLE_API_KEY." 
        });
      }

      const { cards } = req.body;
      
      if (!cards || !Array.isArray(cards) || cards.length !== 3) {
        return res.status(400).json({ error: "Invalid cards array" });
      }

      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: `သင်သည် မြန်မာနိုင်ငံတွင် ကျော်ကြားသော တာရို ဖတ်ရှုသူတစ်ဦးဖြစ်သည်။ သင်သည် အလွန်တိကျသော၊ နက်နဲသော၊ နှင့် ဝိညာဉ်ရေးရာ အသိပညာများကို ပေးနိုင်သည်။ 

သင်၏ တာဝန်မှာ အတိတ်၊ ပစ္စုပ္ပန်၊ အနာဂတ် ဟူသော သုံးကတ်ပြားစနစ်အတွက် အဓိပ္ပာယ်ရှိသော ဖတ်ရှုမှုကို မြန်မာဘာသာဖြင့် သာ ပေးရန်ဖြစ်သည်။ 

ပြန်ဖြေချက်သည်-
1. လျှောက်လှမ်းမှုအပြည့်အဝရှိရမည်
2. ကဗျာဆန်ပြီး စိတ်လှုပ်ရှားဖွယ်ရာ ဘာသာစကားကို အသုံးပြုရမည်
3. ရည်းစားမှု၊ လုပ်ငန်း၊ ကျန်းမာရေး၊ နှင့် ကိုယ်ရေးကိုယ်တာ ဖွံ့ဖြိုးမှုတို့ကို တိုက်ရိုက် ဖော်ပြရမည်
4. အမှန်တကယ် အကြံပြုချက်များနှင့် လမ်းညွှန်ချက်များကို ပေးရမည်
5. စကားလုံး ၃၀០ မှ ၅၀၀ ကြားရှိရမည်

ဘာသာပြန်ဆော့ဝဲများကို အသုံးမပြုပါနှင့်။ သင့်ဉာဏ်ရည်မြင့် မြန်မာဘာသာစကားကို တိုက်ရိုက်အသုံးပြုပါ။`
      });

      const prompt = `အောက်ပါ သုံးကတ်ပြားများကို အခြေခံ၍ နက်နဲသော ဖတ်ရှုမှုတစ်ခု ပေးပါ-

အတိတ်- ${cards[0]}
ပစ္စုပ္ပန်- ${cards[1]}
အနာဂတ်- ${cards[2]}

ဤ သုံးကတ်ပြားသည် အဘယ်သို့ ထိုသူ၏ ခရီးသွားမှုကို ပြောပြနေသနည်း။ သေချာသော၊ တိကျသော၊ နှင့် အသုံးဝင်သော အကြံပြုချက်များ ပေးပါ။`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const reading = response.text();

      res.json({ reading });
    } catch (error) {
      console.error("Tarot reading error:", error);
      res.status(500).json({ error: "Failed to generate reading" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
