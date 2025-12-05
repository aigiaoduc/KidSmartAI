import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Story, StoryPage, Flashcard, QuizQuestion } from "../types";

// --- CẤU HÌNH API KEY ---
// The API key must be obtained exclusively from the environment variable process.env.API_KEY.
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

// --- 1. Lesson Planner ---
export const generateLessonPlan = async (topic: string): Promise<string> => {
  const prompt = `Bạn là một chuyên gia giáo dục mầm non. Hãy soạn một giáo án chi tiết cho trẻ mầm non (3-5 tuổi) về chủ đề: "${topic}".
  Cấu trúc bắt buộc:
  1. Mục tiêu (Kiến thức, Kỹ năng, Thái độ)
  2. Chuẩn bị (Đồ dùng, Không gian)
  3. Tiến trình hoạt động (Ổn định, Nội dung chính, Kết thúc)
  4. Câu hỏi gợi mở cho trẻ.
  Hãy trình bày bằng Markdown đẹp mắt, dễ đọc (dùng Heading, bullet point).`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Model tối ưu cho văn bản
      contents: { parts: [{ text: prompt }] },
    });

    if (response.text) {
      return response.text;
    } else {
      console.warn("Empty text response for lesson plan", response);
      return "Xin lỗi, hệ thống không thể tạo giáo án lúc này do nội dung bị hạn chế. Vui lòng thử lại với chủ đề khác.";
    }
  } catch (error) {
    console.error("Generate Lesson Plan Error:", error);
    throw error;
  }
};

// --- 2. Flashcard Generator ---
export const generateFlashcardList = async (topic: string, count: number): Promise<Flashcard[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Liệt kê chính xác ${count} từ vựng quan trọng nhất liên quan đến chủ đề "${topic}" cho trẻ mầm non.
    
    Yêu cầu trả về JSON với cấu trúc sau:
    1. word: Từ tiếng Việt (VD: "Con Mèo").
    2. englishWord: Từ tiếng Anh (VD: "Cat").
    3. visualDescription: Mô tả chi tiết cho NHIẾP ẢNH GIA để chụp một bức ảnh thật.
       - Phải dùng tiếng Anh.
       - Chỉ mô tả hình ảnh của vật thể, KHÔNG mô tả chữ viết, KHÔNG yêu cầu viết tên lên ảnh.
       - Ví dụ: "A cute fluffy cat sitting on a rug, white background".
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            englishWord: { type: Type.STRING },
            visualDescription: { type: Type.STRING, description: "Detailed photography prompt for AI image generator. No text requests." }
          },
          required: ["word", "englishWord", "visualDescription"]
        }
      }
    }
  });

  const list = JSON.parse(response.text || "[]");
  return list.map((item: any) => ({ 
    word: item.word,
    englishWord: item.englishWord,
    visualDescription: item.visualDescription
  }));
};

// --- 3. Story Generator (Text) ---
export const generateStoryScript = async (topic: string, numberOfPages: number): Promise<Story> => {
  const prompt = `Viết một câu chuyện ngắn, dễ thương, mang tính giáo dục cho trẻ mầm non về chủ đề: "${topic}".
  Câu chuyện BẮT BUỘC phải có đúng ${numberOfPages} phân đoạn (trang).
  
  Quan trọng:
  - Giữ hình ảnh nhân vật nhất quán xuyên suốt câu chuyện.
  - Hãy mô tả rõ đặc điểm nhân vật ngay trong 'imagePrompt' của mỗi trang (Ví dụ: "Thỏ trắng đeo nơ đỏ").
  
  Với mỗi trang, cung cấp:
  1. text: Nội dung truyện tiếng Việt (khoảng 2-3 câu).
  2. imagePrompt: Mô tả hình ảnh minh họa bằng TIẾNG ANH.
     - CHỈ MÔ TẢ HÌNH ẢNH, KHÔNG BAO GIỜ yêu cầu có chữ, tên hay lời thoại xuất hiện trong ảnh.
     - Tập trung vào hành động và biểu cảm.
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
                imagePrompt: { type: Type.STRING, description: "Detailed English image description. DO NOT include text descriptions." }
              }
            }
          }
        }
      }
    }
  });

  const data = JSON.parse(response.text || "{}");
  
  const pages = data.pages || [];
  
  return {
    id: Date.now().toString(),
    title: data.title || "Câu chuyện không tên",
    pages: pages
  };
};

// --- 4. Image Generation (Gemini / Imagen) ---
export const generateImage = async (prompt: string): Promise<string | undefined> => {
  try {
    // Sử dụng model Imagen 3 để tạo ảnh ổn định hơn
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1', // Ảnh vuông
      },
    });

    const generatedImages = response.generatedImages;
    if (generatedImages && generatedImages.length > 0) {
       const imageBytes = generatedImages[0].image.imageBytes;
       return `data:image/jpeg;base64,${imageBytes}`;
    }
    return undefined;

  } catch (e) {
    console.error("Gemini Image gen error:", e);
    // Nếu Imagen lỗi, thử fallback về model cũ
    try {
        console.log("Attempting fallback to gemini-2.5-flash-image...");
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
        });
        const candidates = response.candidates;
        if (candidates && candidates.length > 0) {
            for (const part of candidates[0].content.parts) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
    } catch (fallbackError) {
        console.error("Fallback failed:", fallbackError);
    }
    
    return undefined;
  }
};

// --- 5. Text to Speech (Deprecated/Placeholder) ---
export const generateSpeech = async (text: string): Promise<string | undefined> => {
  return undefined; 
};

// --- 6. Quiz Generator (Deprecated/Placeholder) ---
export const generateQuiz = async (topic: string): Promise<QuizQuestion> => {
  return {} as QuizQuestion;
};