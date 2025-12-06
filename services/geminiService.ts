import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Story, StoryPage, Flashcard, QuizQuestion } from "../types";

// --- CẤU HÌNH API KEY (Chỉ dùng cho Text - Gemini) ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Helper: Decode Audio (Browser only) ---
export const decodeAudio = async (base64Audio: string): Promise<AudioBuffer> => {
  const binaryString = atob(base64Audio);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  return await audioContext.decodeAudioData(bytes.buffer);
};

// --- Helper: Clean JSON String ---
const cleanJsonString = (text: string): string => {
  if (!text) return "{}";
  // Remove markdown code blocks
  let clean = text.replace(/```json/g, '').replace(/```/g, '');
  
  // Find JSON object/array start and end
  const firstOpen = clean.search(/[{[]/);
  if (firstOpen !== -1) {
     clean = clean.substring(firstOpen);
     const lastIndex = clean.lastIndexOf('}') > clean.lastIndexOf(']') ? clean.lastIndexOf('}') : clean.lastIndexOf(']');
     if (lastIndex !== -1) {
        clean = clean.substring(0, lastIndex + 1);
     }
  }
  return clean.trim();
};

// --- 1. Lesson Planner (Gemini) ---
export const generateLessonPlan = async (topic: string): Promise<string> => {
  const prompt = `
  Bạn là chuyên gia giáo dục mầm non. Hãy soạn giáo án cho chủ đề: "${topic}".
  Trình bày dạng Markdown rõ ràng.
  Nội dung gồm: Mục tiêu, Chuẩn bị, Tiến trình hoạt động, Câu hỏi gợi mở.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: prompt }] },
    });
    return response.text || "Không tạo được nội dung.";
  } catch (error) {
    console.error("Lesson Plan Error:", error);
    return "Đã có lỗi xảy ra.";
  }
};

// --- 2. Flashcard Generator (Gemini) ---
export const generateFlashcardList = async (topic: string, count: number): Promise<Flashcard[]> => {
  const prompt = `
  Tạo danh sách ${count} từ vựng cho trẻ mầm non về chủ đề: "${topic}".
  Trả về JSON Array.
  Mỗi phần tử gồm:
  - "word": Từ tiếng Việt.
  - "englishWord": Từ tiếng Anh.
  - "visualDescription": Mô tả hình ảnh bằng tiếng Anh để vẽ minh họa (Ví dụ: "Cute cat white background").
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            englishWord: { type: Type.STRING },
            visualDescription: { type: Type.STRING }
          },
          required: ["word", "englishWord", "visualDescription"]
        }
      }
    }
  });

  try {
    const cleanText = cleanJsonString(response.text || "[]");
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("Flashcard Parse Error", e);
    return [];
  }
};

// --- 3. Story Generator (Gemini - Text Only) ---
export const generateStoryScript = async (topic: string, numberOfPages: number): Promise<Story> => {
  // Prompt được thiết kế lại để đảm bảo trả về JSON đúng cấu trúc
  const prompt = `
  Bạn là một hệ thống tạo truyện tranh cho trẻ em (API JSON).
  Yêu cầu: Viết một câu chuyện về chủ đề "${topic}".
  Độ dài: Chính xác ${numberOfPages} trang.
  
  BẮT BUỘC TRẢ VỀ ĐỊNH DẠNG JSON với cấu trúc sau:
  {
    "title": "Tên câu chuyện (Tiếng Việt)",
    "pages": [
      {
        "text": "Lời dẫn truyện của trang này (Tiếng Việt, ngắn gọn 2-3 câu, phù hợp trẻ 3-5 tuổi)",
        "imagePrompt": "Mô tả hình ảnh minh họa cho trang này bằng TIẾNG ANH (Ví dụ: Cute rabbit running in forest, cartoon style). KHÔNG yêu cầu vẽ chữ."
      }
    ]
  }

  Chỉ trả về JSON. Không thêm lời bình.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          pages: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                imagePrompt: { type: Type.STRING }
              },
              required: ["text", "imagePrompt"]
            }
          }
        },
        required: ["title", "pages"]
      }
    }
  });

  try {
    const cleanText = cleanJsonString(response.text || "{}");
    const data = JSON.parse(cleanText);
    
    return {
      id: Date.now().toString(),
      title: data.title || "Câu chuyện không tên",
      pages: data.pages || []
    };
  } catch (e) {
    console.error("Story Parse Error", e);
    // Fallback nếu lỗi JSON
    return {
      id: Date.now().toString(),
      title: "Lỗi tạo truyện",
      pages: []
    };
  }
};

// --- 4. Image Generation (POLLINATIONS.AI) ---
export const generateImage = async (prompt: string): Promise<string | undefined> => {
  try {
    // 1. Clean and Prepare Prompt
    // Pollinations hoạt động tốt nhất với tiếng Anh và prompt rõ ràng.
    const seed = Math.floor(Math.random() * 1000000); // Random seed để ảnh cố định cho URL này
    
    // Clean prompt: remove newlines that break URLs and excessive spaces
    const cleanPrompt = prompt.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

    // Cấu hình URL Pollinations
    // Model 'flux' hiện tại cho chất lượng rất tốt.
    // nologo=true để bỏ watermark.
    // Lưu ý: Chúng ta trả về URL trực tiếp thay vì fetch Blob để tránh lỗi CORS.
    // URL có chứa seed nên ảnh sẽ không bị đổi khi reload.
    const encodedPrompt = encodeURIComponent(cleanPrompt + " , high quality, children book style, cute, vibrant colors, 4k, detailed");
    const pollinationsUrl = `https://pollinations.ai/p/${encodedPrompt}?width=768&height=768&seed=${seed}&model=flux&nologo=true`;

    console.log(`[KidSmart] Generated Image URL: ${pollinationsUrl}`);
    
    // Trả về URL trực tiếp
    // Thẻ <img> của trình duyệt sẽ tự tải ảnh, không bị chặn bởi CORS trong JS.
    return pollinationsUrl;

  } catch (e) {
    console.error("[KidSmart] Image Gen Error (Pollinations):", e);
    return undefined;
  }
};

// --- 5. Text to Speech (Native Browser) ---
export const generateSpeech = async (text: string): Promise<string | undefined> => {
  return undefined; 
};

// --- 6. Quiz Generator (Placeholder) ---
export const generateQuiz = async (topic: string): Promise<QuizQuestion> => {
  return {} as QuizQuestion;
};