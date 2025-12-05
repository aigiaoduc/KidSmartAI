import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Story, StoryPage, Flashcard, QuizQuestion } from "../types";

// --- CẤU HÌNH API KEY ---
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

// --- 1. Lesson Planner ---
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

// --- 2. Flashcard Generator ---
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

// --- 3. Story Generator (Text) ---
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

// --- 4. Image Generation (MULTI-MODEL STRATEGY) ---
export const generateImage = async (prompt: string): Promise<string | undefined> => {
  // CHIẾN THUẬT 1: Thử model Nano Banana (Nhanh nhất)
  try {
    console.log("[KidSmart] Đang thử tạo ảnh với Nano Banana (gemini-2.5-flash-image)...");
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
    });

    if (response.candidates && response.candidates.length > 0) {
        const content = response.candidates[0].content;
        if (content && content.parts) {
            for (const part of content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    const mimeType = part.inlineData.mimeType || 'image/png';
                    console.log("[KidSmart] Thành công với Nano Banana!");
                    return `data:${mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
    }
    console.warn("[KidSmart] Nano Banana không trả về dữ liệu ảnh, chuyển sang phương án 2...");
  } catch (e) {
    console.warn("[KidSmart] Nano Banana gặp lỗi:", e);
  }

  // CHIẾN THUẬT 2: Thử model Imagen 3 (Chất lượng cao, Ổn định)
  // Lưu ý: Model này dùng hàm generateImages, không phải generateContent
  try {
    console.log("[KidSmart] Đang thử tạo ảnh với Imagen 3 (imagen-3.0-generate-001)...");
    const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            aspectRatio: '1:1',
            outputMimeType: 'image/jpeg'
        }
    });
    
    if (response.generatedImages && response.generatedImages.length > 0) {
        const imgBytes = response.generatedImages[0].image.imageBytes;
        if (imgBytes) {
             console.log("[KidSmart] Thành công với Imagen 3!");
             return `data:image/jpeg;base64,${imgBytes}`;
        }
    }
    console.warn("[KidSmart] Imagen 3 không trả về dữ liệu ảnh.");
  } catch (e) {
     console.warn("[KidSmart] Imagen 3 gặp lỗi:", e);
  }

  // CHIẾN THUẬT 3: Thử Gemini 3 Pro Preview (Dự phòng cuối cùng)
  try {
    console.log("[KidSmart] Đang thử tạo ảnh với Gemini 3 Pro (gemini-3-pro-image-preview)...");
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: prompt }] },
    });
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }
  } catch (e) {
      console.error("[KidSmart] Tất cả các model tạo ảnh đều thất bại.", e);
  }

  return undefined;
};

// --- 5. Text to Speech (Native Browser) ---
export const generateSpeech = async (text: string): Promise<string | undefined> => {
  return undefined; 
};

// --- 6. Quiz Generator (Placeholder) ---
export const generateQuiz = async (topic: string): Promise<QuizQuestion> => {
  return {} as QuizQuestion;
};