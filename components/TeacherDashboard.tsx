
import React, { useState, useEffect, useCallback } from 'react';
import { TeacherTool, Story, Flashcard, FlashcardSet } from '../types';
import { Button, Card, Input, PageTitle, LoadingSpinner, SmartImage } from './UI';
import { generateLessonPlan, generateFlashcardList, generateStoryScript, generateImage } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface Props {
  onBack: () => void;
}

// Helper for delay to avoid rate limits
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const STORY_STORAGE_KEY = 'kidSmart_savedStories';
const CARD_STORAGE_KEY = 'kidSmart_savedFlashcards';

// --- DATA SEEDING (DỮ LIỆU MẪU CHUẨN) ---
const DEFAULT_TEACHER_STORIES: Story[] = [
  {
    id: 'seed_story_squirrels_sharing',
    title: 'Hai Bạn Sóc Và Quả Hạt Cuối Cùng',
    pages: [
      {
        text: 'Một buổi sáng nắng đẹp trong rừng, Sóc Nâu và Sóc Cam cùng nhau đi tìm hạt dẻ. Hai bạn chạy nhảy khắp nơi, nhặt được thật nhiều hạt. Khi nhìn lại giỏ, cả hai phát hiện chỉ còn một quả hạt cuối cùng.',
        imagePrompt: 'Two cute squirrels brown and orange looking at the last chestnut in the forest cartoon',
        imageUrl: 'https://res.cloudinary.com/dejnvixvn/image/upload/v1764816519/Whisk_640185ebdc094859322492fdb03a7169dr_stoylu.jpg'
      },
      {
        text: 'Sóc Nâu và Sóc Cam đều thích quả hạt cuối cùng ấy. Cả hai nhìn nhau, ai cũng muốn nhưng lại sợ bạn buồn. Không khí trở nên im lặng khi cả hai cố suy nghĩ phải làm sao.',
        imagePrompt: 'Two squirrels looking at each other hesitating over a nut cartoon',
        imageUrl: 'https://res.cloudinary.com/dejnvixvn/image/upload/v1764816519/3_xqgeof.jpg'
      },
      {
        text: 'Sóc Cam bỗng nảy ra một ý: “Hay chúng mình chia đôi nhé! Như vậy cả hai đều được ăn và vẫn vui.” Sóc Nâu lập tức gật đầu đồng ý, cảm thấy lòng nhẹ nhõm.',
        imagePrompt: 'One squirrel having an idea to share the nut happy face cartoon',
        imageUrl: 'https://res.cloudinary.com/dejnvixvn/image/upload/v1764816519/Whisk_f2e5eb2527ccec1905045c893d4365e6dr_pm9wsd.jpg'
      },
      {
        text: 'Hai bạn cùng cắt đôi quả hạt và thưởng thức. Khi chia sẻ, cả hai cảm thấy vui hơn rất nhiều so với việc giữ riêng. Từ hôm đó, Sóc Nâu và Sóc Cam luôn nhớ: Chia sẻ giúp tình bạn thêm gắn bó.',
        imagePrompt: 'Two squirrels eating shared nut happily together friendship cartoon',
        imageUrl: 'https://res.cloudinary.com/dejnvixvn/image/upload/v1764816519/Whisk_5334313e46be271a5d8453f4a4b3f067dr_p0b05p.jpg'
      }
    ]
  },
  {
    id: 'seed_story_bear_hygiene',
    title: 'Gấu Bé Học Giữ Gìn Vệ Sinh',
    pages: [
      {
        text: 'Một buổi chiều, Gấu Bé đang chơi ngoài sân vườn. Bạn ấy đào đất, nghịch cát và làm đôi bàn tay lấm lem. Đúng lúc đó, mẹ gọi vào ăn bánh mật ong thơm phức.',
        imagePrompt: 'Cute little bear playing with mud in garden dirty hands cartoon',
        imageUrl: 'https://res.cloudinary.com/dejnvixvn/image/upload/v1764816952/Whisk_fba204fa94692b5ae44463f5565d0853dr_j8qmdh.jpg'
      },
      {
        text: 'Gấu Bé chạy vào nhà, ngồi ngay vào bàn và đưa tay chuẩn bị cầm bánh. Mẹ Gấu trông thấy đôi bàn tay bám đầy đất và nhẹ nhàng nói:\n“Gấu Bé ơi, con phải rửa tay trước khi ăn nhé!”',
        imagePrompt: 'Mother bear telling little bear to wash dirty hands before eating cartoon',
        imageUrl: 'https://res.cloudinary.com/dejnvixvn/image/upload/v1764816951/Whisk_a0fb6f3c0b97d5c8971444b2eddff631dr_zwaatw.jpg'
      },
      {
        text: 'Mẹ dẫn Gấu Bé đến bồn rửa tay. Bà chỉ cho bạn cách mở vòi nước, xoa xà phòng, kỳ giữa các ngón tay và rửa thật sạch. Những bọt xà phòng bay lên lung linh khiến Gấu Bé rất thích thú.',
        imagePrompt: 'Little bear washing hands with soap bubbles mother bear watching cartoon',
        imageUrl: 'https://res.cloudinary.com/dejnvixvn/image/upload/v1764816951/Whisk_cb610c28fc2c139bee74e6ae0d44cac3dr_pwhoqu.jpg'
      },
      {
        text: 'Rửa tay xong, Gấu Bé trở lại bàn ăn. Bạn ấy cầm chiếc bánh mật ong và cắn một miếng thật ngon. Gấu Bé cười tít mắt:\n“Rửa tay sạch xong ăn ngon hơn nhiều!”',
        imagePrompt: 'Happy little bear eating honey cake with clean hands cartoon',
        imageUrl: 'https://res.cloudinary.com/dejnvixvn/image/upload/v1764816951/Whisk_0da0b9b1b2831b78ea44dc8c5ee8c0dadr_p0bdgj.jpg'
      }
    ]
  }
];

// --- Toast Component ---
const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-8 left-1/2 transform -translate-x-1/2 z-[9999] animate-pop px-8 py-4 rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.15)] flex items-center gap-4 border-b-8 min-w-[300px] justify-center ${
      type === 'success' ? 'bg-white border-green-400 text-green-700' : 'bg-white border-red-400 text-red-700'
    }`}>
      <span className="text-4xl animate-bounce">{type === 'success' ? '🎉' : '🐛'}</span>
      <span className="font-black text-xl">{message}</span>
    </div>
  );
};

export const TeacherDashboard: React.FC<Props> = ({ onBack }) => {
  const [activeTool, setActiveTool] = useState<TeacherTool>(TeacherTool.MENU);
  
  // States for features
  const [topic, setTopic] = useState('');
  const [pageCount, setPageCount] = useState<number>(4); // Default 4 pages
  const [loading, setLoading] = useState(false);
  const [progressStatus, setProgressStatus] = useState('');
  
  // Notification State
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Result States
  const [lessonPlan, setLessonPlan] = useState<string>('');
  
  // Flashcard States
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [savedFlashcardSets, setSavedFlashcardSets] = useState<FlashcardSet[]>([]);
  const [currentFlashcardSetId, setCurrentFlashcardSetId] = useState<string | null>(null);
  const [flashcardCount, setFlashcardCount] = useState<number>(8);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);

  // Story States
  const [generatedStory, setGeneratedStory] = useState<Story | null>(null);
  
  // State mới: Theo dõi trang nào đang được tạo ảnh để khóa các nút khác
  const [generatingPageIndex, setGeneratingPageIndex] = useState<number | null>(null);
  
  // State mới: Bộ đếm thời gian nghỉ (Cooldown) để tránh spam nút
  const [cooldown, setCooldown] = useState<number>(0);

  const [isSpeaking, setIsSpeaking] = useState<string | null>(null); 
  
  // Library State
  const [savedStories, setSavedStories] = useState<Story[]>([]);

  // --- Effects ---
  useEffect(() => {
    const storedStories = localStorage.getItem(STORY_STORAGE_KEY);
    let parsedStories: Story[] = [];
    if (storedStories) {
      try {
        parsedStories = JSON.parse(storedStories);
      } catch (e) { console.error(e); }
    }
    
    // Check if new seeds need to be added
    const newSeedStories = DEFAULT_TEACHER_STORIES.filter(
        defaultStory => !parsedStories.some(savedStory => savedStory.id === defaultStory.id)
    );

    if (newSeedStories.length > 0) {
        const mergedStories = [...newSeedStories, ...parsedStories];
        setSavedStories(mergedStories);
        localStorage.setItem(STORY_STORAGE_KEY, JSON.stringify(mergedStories));
    } else {
        setSavedStories(parsedStories);
    }

    // Flashcards
    const storedCards = localStorage.getItem(CARD_STORAGE_KEY);
    if (storedCards) {
       try {
         setSavedFlashcardSets(JSON.parse(storedCards));
       } catch (e) { console.error(e); }
    }
  }, []);

  // Timer Effect for Cooldown
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Keyboard navigation for Flashcard Viewer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedCardIndex === null) return;
      
      if (e.key === 'ArrowRight') {
        handleNextCard(e as any);
      } else if (e.key === 'ArrowLeft') {
        handlePrevCard(e as any);
      } else if (e.key === 'Escape') {
        handleCloseCard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCardIndex, flashcards.length]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification(null);
    setTimeout(() => {
      setNotification({ message, type });
    }, 100);
  };

  const reset = () => {
    setTopic('');
    setLoading(false);
    setProgressStatus('');
    setLessonPlan('');
    setFlashcards([]);
    setGeneratedStory(null);
    setGeneratingPageIndex(null);
    setCooldown(0); // Reset cooldown
    setPageCount(4);
    setCurrentFlashcardSetId(null);
    setSelectedCardIndex(null);
    window.speechSynthesis.cancel();
    setIsSpeaking(null);
  };

  const handleBack = () => {
    window.speechSynthesis.cancel();
    if (activeTool === TeacherTool.MENU) {
      onBack();
    } else {
      setActiveTool(TeacherTool.MENU);
      reset();
    }
  };

  // --- Story Logic ---
  const saveStoryToCache = (story: Story) => {
    const newHistory = [story, ...savedStories];
    setSavedStories(newHistory);
    localStorage.setItem(STORY_STORAGE_KEY, JSON.stringify(newHistory));
    showToast('Đã lưu truyện vào thư viện! 📘', 'success');
  };

  const deleteStoryFromCache = (storyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Bạn có chắc muốn xóa truyện này không?")) {
      const newHistory = savedStories.filter(s => s.id !== storyId);
      setSavedStories(newHistory);
      localStorage.setItem(STORY_STORAGE_KEY, JSON.stringify(newHistory));
      showToast('Đã xóa truyện!', 'success');
      
      if (generatedStory?.id === storyId) {
        setGeneratedStory(null);
      }
    }
  };

  // 1. Tạo kịch bản chữ trước (Script Only)
  const handleCreateStory = async () => {
    if (!topic) return;
    setLoading(true);
    setGeneratedStory(null);
    setGeneratingPageIndex(null);
    setCooldown(0);
    window.speechSynthesis.cancel();
    
    try {
      setProgressStatus('Đang viết kịch bản truyện...');
      const storyBase = await generateStoryScript(topic, pageCount);
      setGeneratedStory(storyBase); 
      setLoading(false);
      showToast('Đã xong kịch bản! Hãy bấm nút để vẽ từng trang nhé.', 'success');
    } catch (error) {
      console.error(error);
      setProgressStatus('Có lỗi xảy ra, vui lòng thử lại');
      setLoading(false);
      showToast('Có lỗi khi tạo truyện', 'error');
    }
  };

  // 2. Hàm tạo ảnh thủ công cho từng trang (Manual Page Generation)
  const handleGeneratePageImage = async (pageIndex: number) => {
      if (!generatedStory) return;

      // Khóa hệ thống
      setGeneratingPageIndex(pageIndex);
      
      const page = generatedStory.pages[pageIndex];
      const masterStyle = "soft 3d cute cartoon style, warm lighting, pastel colors, high detail, masterpiece";
      const negativePrompt = "no text, no words, no letters, no labels, no speech bubbles, no watermark, no signature";
      const enhancedPrompt = `${masterStyle}. ${page.imagePrompt}. ${negativePrompt}`;

      try {
          // Tạo URL
          const imageUrl = await generateImage(enhancedPrompt);
          
          // Cập nhật State
          const updatedPages = [...generatedStory.pages];
          updatedPages[pageIndex] = {
              ...page,
              imageUrl: imageUrl
          };

          setGeneratedStory({
              ...generatedStory,
              pages: updatedPages
          });

          // KÍCH HOẠT COOLDOWN 20 GIÂY
          setCooldown(20);

      } catch (error) {
          console.error("Lỗi tạo ảnh trang " + pageIndex, error);
          showToast('Không tạo được ảnh, hãy thử lại!', 'error');
      } finally {
          // Mở khóa hệ thống (nhưng cooldown vẫn chạy)
          setGeneratingPageIndex(null);
      }
  };

  const speakText = (text: string, id: string) => {
    if (isSpeaking === id) {
        window.speechSynthesis.cancel();
        setIsSpeaking(null);
        return;
    }
    window.speechSynthesis.cancel();
    setIsSpeaking(id);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = 0.9;
    utterance.onend = () => setIsSpeaking(null);
    utterance.onerror = () => setIsSpeaking(null);

    window.speechSynthesis.speak(utterance);
  };

  // --- Flashcard Logic ---
  const handleCreateFlashcards = async () => {
    if (!topic) return;
    setLoading(true);
    setFlashcards([]);
    setCurrentFlashcardSetId(null);
    setSelectedCardIndex(null);

    try {
      setProgressStatus('Đang tạo bộ thẻ...');
      const list = await generateFlashcardList(topic, flashcardCount);
      setFlashcards(list);

      // Generate images for cards sequentially with 25s delay
      const updatedCards = [...list];
      for (let i = 0; i < updatedCards.length; i++) {
          
          // Nếu không phải thẻ đầu tiên, đợi 25 giây
          if (i > 0) {
              for (let s = 25; s > 0; s--) {
                  setProgressStatus(`Đang nghỉ để nạp năng lượng... Vẽ thẻ tiếp theo sau ${s}s`);
                  await delay(1000);
              }
          }

          setProgressStatus(`Đang vẽ thẻ ${i+1}/${updatedCards.length}: ${updatedCards[i].word}`);

          const cardPrompt = `Single isolated image of ${updatedCards[i].englishWord} (${updatedCards[i].visualDescription}). White background, high quality, realistic photography style. No text, no words, no labels.`;
          
          try {
             const imageUrl = await generateImage(cardPrompt);
             updatedCards[i].imageUrl = imageUrl;
             // Update state immediately to show placeholder
             setFlashcards([...updatedCards]); 
          } catch (e) {
              console.error(e);
          }
      }

      setLoading(false);
      showToast('Đã gửi yêu cầu vẽ xong! 📷', 'success');

    } catch (error) {
      console.error(error);
      setLoading(false);
      showToast('Có lỗi khi tạo flashcard', 'error');
    }
  };

  const saveFlashcardSet = () => {
      if (flashcards.length === 0) return;
      const newSet: FlashcardSet = {
          id: Date.now().toString(),
          topic: topic || "Chủ đề mới",
          cards: flashcards,
          createdAt: Date.now()
      };
      const updatedSets = [newSet, ...savedFlashcardSets];
      setSavedFlashcardSets(updatedSets);
      localStorage.setItem(CARD_STORAGE_KEY, JSON.stringify(updatedSets));
      setCurrentFlashcardSetId(newSet.id);
      showToast('Đã lưu bộ thẻ vào thư viện! ✅', 'success');
  };

  const deleteFlashcardSet = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (window.confirm("Bạn có chắc muốn xóa bộ thẻ này không?")) {
          const updatedSets = savedFlashcardSets.filter(s => s.id !== id);
          setSavedFlashcardSets(updatedSets);
          localStorage.setItem(CARD_STORAGE_KEY, JSON.stringify(updatedSets));
          if (currentFlashcardSetId === id) {
              setFlashcards([]);
              setCurrentFlashcardSetId(null);
              setTopic('');
          }
          showToast('Đã xóa bộ thẻ!', 'success');
      }
  };

  const loadFlashcardSet = (set: FlashcardSet) => {
      setTopic(set.topic);
      setFlashcards(set.cards);
      setCurrentFlashcardSetId(set.id);
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Card Viewer Logic ---
  const handleNextCard = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedCardIndex !== null && selectedCardIndex < flashcards.length - 1) {
      setSelectedCardIndex(selectedCardIndex + 1);
    } else {
        setSelectedCardIndex(0);
    }
  };

  const handlePrevCard = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedCardIndex !== null && selectedCardIndex > 0) {
      setSelectedCardIndex(selectedCardIndex - 1);
    } else {
        setSelectedCardIndex(flashcards.length - 1);
    }
  };

  const handleCloseCard = () => {
    setSelectedCardIndex(null);
  };

  // --- Lesson Plan Logic ---
  const handleCreateLessonPlan = async () => {
    if (!topic) return;
    setLoading(true);
    setLessonPlan('');
    try {
      const plan = await generateLessonPlan(topic);
      setLessonPlan(plan);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
      showToast('Có lỗi khi tạo giáo án', 'error');
    }
  };

  const copyLessonPlan = () => {
      const cleanText = lessonPlan
        .replace(/[#*`]/g, '')
        .replace(/^\s*-\s/gm, '• ')
        .replace(/\n{3,}/g, '\n\n');

      navigator.clipboard.writeText(cleanText);
      showToast('Đã sao chép nội dung! 📋', 'success');
  };

  // --- Renders ---

  const renderMenu = () => (
    <div className="max-w-6xl mx-auto relative">
      <div className="flex justify-between items-center mb-10 relative z-10">
        <h2 className="text-4xl font-black text-gray-700">Góc Giáo Viên 👩‍🏫</h2>
        <Button variant="neutral" onClick={handleBack}>Thoát</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        <button 
          onClick={() => setActiveTool(TeacherTool.STORY_CREATOR)}
          className="group relative bg-white rounded-[32px] p-8 text-center shadow-[0_10px_0_rgba(0,0,0,0.05)] border-4 border-candy-pink hover:-translate-y-2 hover:shadow-[0_15px_0_rgba(255,154,162,0.4)] transition-all"
        >
          <div className="text-6xl mb-4 group-hover:scale-110 transition-transform inline-block">📖</div>
          <h3 className="text-2xl font-bold text-gray-700">Truyện Tranh AI</h3>
          <p className="text-gray-400 mt-2">Sáng tác truyện kèm hình minh họa</p>
        </button>

        <button 
          onClick={() => setActiveTool(TeacherTool.LESSON_PLANNER)}
          className="group relative bg-white rounded-[32px] p-8 text-center shadow-[0_10px_0_rgba(0,0,0,0.05)] border-4 border-candy-aqua hover:-translate-y-2 hover:shadow-[0_15px_0_rgba(181,234,215,0.4)] transition-all"
        >
          <div className="text-6xl mb-4 group-hover:scale-110 transition-transform inline-block">📝</div>
          <h3 className="text-2xl font-bold text-gray-700">Soạn Giáo Án</h3>
          <p className="text-gray-400 mt-2">Tạo kế hoạch bài dạy chi tiết</p>
        </button>

        <button 
          onClick={() => setActiveTool(TeacherTool.FLASHCARD_MAKER)}
          className="group relative bg-white rounded-[32px] p-8 text-center shadow-[0_10px_0_rgba(0,0,0,0.05)] border-4 border-candy-lemon hover:-translate-y-2 hover:shadow-[0_15px_0_rgba(255,218,193,0.4)] transition-all"
        >
          <div className="text-6xl mb-4 group-hover:scale-110 transition-transform inline-block">🖼️</div>
          <h3 className="text-2xl font-bold text-gray-700">Tạo Flashcard</h3>
          <p className="text-gray-400 mt-2">Bộ thẻ hình ảnh theo chủ đề</p>
        </button>
      </div>
    </div>
  );

  const renderStoryCreator = () => (
    <div className="max-w-4xl mx-auto">
      <Button variant="neutral" onClick={handleBack} className="mb-6">← Quay lại</Button>
      <PageTitle icon="📖">Sáng Tác Truyện Tranh</PageTitle>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <Input 
          placeholder="Nhập chủ đề truyện (VD: Bé Thỏ đi học, Chú voi con...)" 
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <div className="w-full md:w-32">
             <Input 
                type="number" 
                min="3" 
                max="10" 
                value={pageCount}
                onChange={(e) => setPageCount(Number(e.target.value))}
                title="Số trang"
            />
        </div>
        <Button onClick={handleCreateStory} disabled={loading || !topic} size="lg">
          {loading ? 'Đang viết...' : '✨ Sáng Tác Kịch Bản'}
        </Button>
      </div>

      {loading && (
        <div className="my-12">
            <LoadingSpinner />
            <p className="text-center text-gray-500 font-bold mt-4 animate-pulse">{progressStatus}</p>
        </div>
      )}

      {/* Kết quả truyện vừa tạo hoặc đang xem */}
      {generatedStory && (
        <div className="space-y-8 animate-fade-in">
           <div className="flex justify-between items-center bg-white p-4 rounded-2xl border-2 border-dashed border-candy-pink">
               <h2 className="text-3xl font-black text-candy-pinkDark text-center flex-1">{generatedStory.title}</h2>
               <div className="flex gap-2">
                   {/* Nếu truyện này chưa có trong list thì hiện nút lưu */}
                   {!savedStories.some(s => s.id === generatedStory.id) && (
                       <Button onClick={() => saveStoryToCache(generatedStory)} variant="secondary" size="sm">💾 Lưu Truyện</Button>
                   )}
                    <Button onClick={reset} variant="neutral" size="sm">🔄 Tạo Mới</Button>
               </div>
           </div>

          <div className="grid grid-cols-1 gap-12">
            {generatedStory.pages.map((page, index) => {
              // --- LOGIC KHÓA NÚT VÀ COOLDOWN ---
              
              const isThisPageGenerating = generatingPageIndex === index;
              const hasImage = !!page.imageUrl;
              
              // Điều kiện mở khóa:
              // 1. Nếu là trang đầu tiên: Luôn mở (trừ khi đang cooldown)
              // 2. Nếu không: Trang trước phải có ảnh rồi.
              const isPreviousPageDone = index === 0 || !!generatedStory.pages[index - 1].imageUrl;
              
              // Đang bị khóa bởi Cooldown?
              // Chỉ áp dụng nếu trang này chưa có ảnh
              const isCooldownActive = cooldown > 0 && !hasImage;
              
              // Có nên disable nút không?
              // Disable khi: 
              // - Trang trước chưa xong
              // - Đang có trang nào đó đang generate
              // - Đang trong thời gian cooldown
              const isLocked = !isPreviousPageDone;
              const isDisabled = isLocked || generatingPageIndex !== null || isCooldownActive;

              return (
                <Card key={index} className="flex flex-col md:flex-row gap-8 items-center overflow-hidden" decoration={`${index + 1}`}>
                    <div className="w-full md:w-1/2 aspect-square bg-gray-100 rounded-2xl overflow-hidden shadow-inner border-4 border-white relative group">
                    {hasImage ? (
                        <div className="w-full h-full relative group">
                            <SmartImage 
                                src={page.imageUrl} 
                                alt={`Trang ${index + 1}`} 
                                className="w-full h-full"
                            />
                            {/* Nút vẽ lại */}
                            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                    size="sm" 
                                    variant="neutral" 
                                    onClick={() => handleGeneratePageImage(index)}
                                    // Vẫn cho phép vẽ lại nếu không có gì đang chạy và không cooldown
                                    disabled={generatingPageIndex !== null || cooldown > 0}
                                >
                                    {cooldown > 0 ? `⏳ ${cooldown}s` : '🔄 Vẽ lại'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-300 gap-4 p-6 text-center">
                            {isThisPageGenerating ? (
                                <>
                                    <div className="animate-spin text-5xl">🎨</div>
                                    <p className="text-candy-pinkDark font-bold animate-pulse">Đang vẽ tranh...</p>
                                </>
                            ) : (
                                <>
                                    {isLocked ? (
                                        <>
                                            <span className="text-4xl grayscale opacity-50">🔒</span>
                                            <p className="text-gray-400 font-bold text-sm">Hoàn thành trang trước để mở khóa</p>
                                        </>
                                    ) : (
                                        // Nếu không bị khóa bởi trang trước, kiểm tra Cooldown
                                        isCooldownActive ? (
                                            <div className="flex flex-col items-center animate-pulse">
                                                <span className="text-4xl mb-2">⏳</span>
                                                <p className="text-gray-500 font-bold">Đợi {cooldown} giây...</p>
                                                <div className="w-32 h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                                                    <div className="h-full bg-candy-pink transition-all duration-1000 ease-linear" style={{width: `${(cooldown / 20) * 100}%`}}></div>
                                                </div>
                                            </div>
                                        ) : (
                                            <Button 
                                                onClick={() => handleGeneratePageImage(index)}
                                                variant="primary"
                                                size="lg"
                                                className="w-full h-full flex flex-col gap-2 shadow-none border-0 bg-transparent hover:bg-candy-pink/10 text-candy-pinkDark"
                                                disabled={isDisabled}
                                            >
                                                <span className="text-5xl">🖌️</span>
                                                <span>Vẽ Minh Họa</span>
                                            </Button>
                                        )
                                    )}
                                </>
                            )}
                        </div>
                    )}
                    </div>
                    <div className="w-full md:w-1/2 space-y-4">
                    <div className="bg-candy-lemon/30 p-6 rounded-[24px] relative">
                        <p className="text-xl text-gray-700 leading-relaxed font-medium">
                            {page.text}
                        </p>
                    </div>
                    <div className="flex justify-center">
                        <Button 
                            onClick={() => speakText(page.text, `${generatedStory.id}-${index}`)} 
                            variant={isSpeaking === `${generatedStory.id}-${index}` ? "danger" : "secondary"}
                            className="rounded-full"
                        >
                        {isSpeaking === `${generatedStory.id}-${index}` ? "⏹️ Dừng đọc" : "🔊 Đọc cho bé nghe"}
                        </Button>
                    </div>
                    </div>
                </Card>
              );
            })}
          </div>
          
          <div className="h-20"></div> {/* Spacer */}
        </div>
      )}

      {/* Thư viện truyện */}
      {!loading && !generatedStory && savedStories.length > 0 && (
          <div className="mt-16 border-t-4 border-dashed border-gray-200 pt-8">
              <h3 className="text-2xl font-black text-gray-600 mb-6 flex items-center gap-2">
                  📚 Thư Viện Truyện ({savedStories.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedStories.map(story => (
                      <div key={story.id} 
                           onClick={() => setGeneratedStory(story)}
                           className="bg-white p-4 rounded-[24px] border-4 border-transparent hover:border-candy-pink shadow-sm hover:shadow-md transition-all cursor-pointer relative group flex gap-4 items-center"
                      >
                          {/* Thumbnail from first page */}
                          <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                              {story.pages[0]?.imageUrl && (
                                  <SmartImage src={story.pages[0].imageUrl} className="w-full h-full" alt="thumb" />
                              )}
                          </div>
                          <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-700 truncate">{story.title}</h4>
                              <p className="text-xs text-gray-400 mt-1">{story.pages.length} trang</p>
                          </div>
                          
                          <button 
                            onClick={(e) => deleteStoryFromCache(story.id, e)}
                            className="w-8 h-8 rounded-full bg-red-100 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors"
                            title="Xóa truyện"
                          >
                              ✕
                          </button>
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );

  const renderLessonPlanner = () => (
    <div className="max-w-3xl mx-auto">
      <Button variant="neutral" onClick={handleBack} className="mb-6">← Quay lại</Button>
      <PageTitle icon="📝">Soạn Giáo Án</PageTitle>

      <div className="flex gap-4 mb-8">
        <Input 
          placeholder="Chủ đề bài dạy (VD: Khám phá nước, Tết nguyên đán...)" 
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <Button onClick={handleCreateLessonPlan} disabled={loading || !topic} size="lg">
          {loading ? 'Đang soạn...' : '✍️ Soạn Bài'}
        </Button>
      </div>

      {loading && <LoadingSpinner />}

      {lessonPlan && (
        <Card className="animate-fade-in bg-white/80 backdrop-blur">
          <div className="prose prose-lg prose-pink max-w-none prose-headings:font-black prose-headings:text-candy-pinkDark prose-p:font-medium prose-li:marker:text-candy-aquaDark">
            <ReactMarkdown>{lessonPlan}</ReactMarkdown>
          </div>
          <div className="mt-8 flex justify-end border-t-2 border-gray-100 pt-4">
              <Button onClick={copyLessonPlan} variant="secondary">📋 Sao chép giáo án</Button>
          </div>
        </Card>
      )}
    </div>
  );

  const renderFlashcardMaker = () => (
    <div className="max-w-5xl mx-auto">
      <Button variant="neutral" onClick={handleBack} className="mb-6">← Quay lại</Button>
      <PageTitle icon="🖼️">Tạo Flashcard</PageTitle>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
            <Input 
                placeholder="Chủ đề (VD: Vật nuôi, Hoa quả, Đồ dùng học tập...)" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
            />
        </div>
        <div className="w-full md:w-48">
             <select 
                value={flashcardCount} 
                onChange={(e) => setFlashcardCount(Number(e.target.value))}
                className="w-full px-6 py-4 rounded-2xl border-4 border-gray-100 focus:border-candy-lemon focus:bg-white bg-gray-50 outline-none transition-all text-gray-700 font-bold text-lg h-full cursor-pointer appearance-none"
             >
                <option value={4}>4 thẻ</option>
                <option value={8}>8 thẻ</option>
                <option value={12}>12 thẻ</option>
                <option value={16}>16 thẻ</option>
                <option value={20}>20 thẻ</option>
             </select>
        </div>
        <Button onClick={handleCreateFlashcards} disabled={loading || !topic} size="lg">
          {loading ? 'Đang tạo...' : '🔍 Tạo Thẻ'}
        </Button>
      </div>

      {loading && (
          <div className="my-12">
            <LoadingSpinner />
            <p className="text-center text-gray-500 font-bold mt-4 animate-pulse">{progressStatus}</p>
          </div>
      )}

      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-black text-gray-600">
                {currentFlashcardSetId ? `Bộ thẻ: ${topic}` : (flashcards.length > 0 ? 'Kết quả tạo ảnh' : '')}
            </h3>
        </div>
        
        {/* The Grid of Finished Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {flashcards.map((card, idx) => (
            <div 
                key={idx} 
                onClick={() => setSelectedCardIndex(idx)}
                className="bg-white rounded-[24px] p-4 shadow-[0_8px_0_rgba(0,0,0,0.05)] border-4 border-white hover:-translate-y-2 transition-transform relative group overflow-hidden animate-pop cursor-pointer hover:border-candy-pink"
            >
                <div className="aspect-square bg-gray-50 rounded-xl mb-3 overflow-hidden border-2 border-gray-100 relative">
                    {card.imageUrl ? (
                        <SmartImage 
                            src={card.imageUrl} 
                            className="w-full h-full" 
                            alt={card.word} 
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                             <span className="text-4xl">📷</span>
                        </div>
                    )}
                </div>
                <div className="text-center">
                <p className="text-xl font-black text-gray-700 capitalize">{card.word}</p>
                {card.englishWord && <p className="text-sm font-bold text-gray-400 capitalize">{card.englishWord}</p>}
                </div>
            </div>
            ))}
        </div>

        {/* Action Buttons */}
        {flashcards.length > 0 && !loading && (
            <div className="flex flex-wrap justify-center gap-4 mt-12 bg-white/50 p-6 rounded-[30px]">
                {!currentFlashcardSetId && (
                        <Button onClick={saveFlashcardSet} variant="secondary" size="lg">💾 Lưu bộ thẻ</Button>
                )}
                <Button onClick={reset} variant="neutral" size="lg">✨ Tạo bộ khác</Button>
            </div>
        )}
      </div>

      {/* FLASHCARD LIGHTBOX MODAL */}
      {selectedCardIndex !== null && flashcards.length > 0 && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={handleCloseCard}>
              <button 
                  onClick={handleCloseCard}
                  className="absolute top-6 right-6 text-white bg-white/20 hover:bg-white/40 rounded-full w-12 h-12 flex items-center justify-center text-2xl font-bold transition-all"
              >✕</button>

              <div className="flex items-center justify-center w-full max-w-6xl gap-4">
                  {/* Prev Button */}
                  <button 
                      onClick={handlePrevCard}
                      className="text-white text-5xl hover:scale-125 transition-transform p-4 opacity-80 hover:opacity-100"
                  >
                      ➡️
                  </button>

                  {/* Main Large Card */}
                  <div 
                    className="bg-white rounded-[40px] p-6 shadow-2xl border-8 border-candy-pink max-h-[85vh] flex flex-col items-center animate-pop overflow-hidden max-w-3xl w-full"
                    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking card
                  >
                      <div className="w-full aspect-square md:aspect-video bg-gray-50 rounded-[24px] overflow-hidden mb-6 relative">
                         {flashcards[selectedCardIndex].imageUrl ? (
                             <SmartImage 
                                 src={flashcards[selectedCardIndex].imageUrl} 
                                 className="w-full h-full object-contain bg-black/5" 
                                 alt={flashcards[selectedCardIndex].word} 
                             />
                         ) : (
                             <div className="w-full h-full flex items-center justify-center bg-gray-100">Không có ảnh</div>
                         )}
                      </div>
                      <div className="text-center">
                          <h2 className="text-5xl md:text-6xl font-black text-gray-800 mb-2 capitalize">
                            {flashcards[selectedCardIndex].word}
                          </h2>
                          <p className="text-3xl font-bold text-gray-400 capitalize">
                            {flashcards[selectedCardIndex].englishWord}
                          </p>
                      </div>
                  </div>

                  {/* Next Button */}
                  <button 
                      onClick={handleNextCard}
                      className="text-white text-5xl hover:scale-125 transition-transform p-4 opacity-80 hover:opacity-100"
                  >
                      ➡️
                  </button>
              </div>
          </div>
      )}

      {/* Thư viện Flashcard */}
      {!loading && savedFlashcardSets.length > 0 && (
          <div className="mt-20 border-t-4 border-dashed border-gray-200 pt-10">
              <h3 className="text-3xl font-black text-gray-600 mb-8 flex items-center gap-3">
                  📂 Thư Viện Thẻ Của Tôi
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {savedFlashcardSets.map(set => (
                      <div 
                        key={set.id} 
                        onClick={() => loadFlashcardSet(set)}
                        className={`
                            relative cursor-pointer p-6 rounded-[30px] border-4 transition-all
                            ${currentFlashcardSetId === set.id ? 'bg-candy-lemon border-candy-pink shadow-[0_0_0_4px_#FF9AA2]' : 'bg-white border-gray-100 hover:border-candy-lemon hover:shadow-lg'}
                        `}
                      >
                          <div className="flex justify-between items-start mb-4">
                              <span className="text-4xl">📁</span>
                              <button 
                                onClick={(e) => deleteFlashcardSet(set.id, e)}
                                className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all z-50 font-bold text-xl"
                                title="Xóa bộ thẻ"
                              >
                                  ✕
                              </button>
                          </div>
                          <h4 className="text-xl font-black text-gray-700 mb-1 line-clamp-1">{set.topic}</h4>
                          <p className="text-gray-400 font-bold">{set.cards.length} thẻ</p>
                          <p className="text-xs text-gray-300 mt-4 font-semibold">
                              {new Date(set.createdAt).toLocaleDateString('vi-VN')}
                          </p>
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent p-6 pb-20">
      {notification && (
        <Toast 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}

      {activeTool === TeacherTool.MENU && renderMenu()}
      {activeTool === TeacherTool.STORY_CREATOR && renderStoryCreator()}
      {activeTool === TeacherTool.LESSON_PLANNER && renderLessonPlanner()}
      {activeTool === TeacherTool.FLASHCARD_MAKER && renderFlashcardMaker()}
    </div>
  );
};
