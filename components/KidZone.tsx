
import React, { useState, useEffect } from 'react';
import { KidActivity, ExternalStory, ExternalGame } from '../types';
import { Button, Card, PageTitle, Input, LoadingSpinner } from './UI';
import { fetchStoriesFromSheet, fetchGamesFromSheet } from '../services/googleSheetService';

interface Props {
  onBack: () => void;
}

// --- CẤU HÌNH LIÊN KẾT GOOGLE SHEET (TSV) ---

// 1. LINK SHEET TRUYỆN
// Cấu trúc Sheet: Cột A = Tên Truyện, Cột B = Link Video/Truyện
const GOOGLE_SHEET_STORIES_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSaevtyjetd2jsRRbOvi0bPm6vDcTcbQwwHkH4gjl5AGHNlCMUv6D3M0KzixlTQnvQ6ZW4-2BUdeMNp/pub?output=tsv";

// 2. LINK SHEET TRÒ CHƠI (RIÊNG BIỆT)
// Cấu trúc Sheet: 
// - Cột A: Tên Trò Chơi
// - Cột B: Link Trò Chơi
// Hướng dẫn: File -> Share -> Publish to web -> Chọn Sheet Game -> Chọn định dạng TSV
const GOOGLE_SHEET_GAMES_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTuAEv6QbnMlpcvkm02HYDKOs4u7IEHX_nz8aBqPWY_HgJlqgrzmmn0cwlUrE0WSLz-G9wMYex-GhRY/pub?output=tsv"; 
// ⚠️ HÃY DÁN LINK TSV CỦA SHEET TRÒ CHƠI VÀO GIỮA HAI DẤU NGOẶC KÉP Ở TRÊN ^^
// Nếu để trống (""), hệ thống sẽ dùng dữ liệu mẫu (mặc định).

const EXTERNAL_STORY_KEY = 'kidSmart_externalStories';
const EXTERNAL_GAME_KEY = 'kidSmart_externalGames';

const CARD_COLORS = [
  'bg-candy-pink text-white border-candy-pinkDark',
  'bg-candy-aqua text-teal-800 border-candy-aquaDark',
  'bg-candy-lemon text-orange-800 border-orange-200',
  'bg-candy-lavender text-purple-900 border-purple-300',
  'bg-candy-sky text-blue-900 border-candy-skyDark',
  'bg-candy-mint text-green-900 border-candy-mintDark',
];

const BOOK_ICONS = ['🐻', '🐰', '🦊', '🐯', '🦄', '🐝', '🐞', '🌟', '🌈', '🌞', '🍎', '🚀', '⚽', '🎨'];
const GAME_ICONS = ['🎮', '🎲', '🧩', '🎳', '🎯', '🎹', '🥁', '🏎️', '🚂', '🚁', '👾', '🎪', '🏗️', '🏖️'];

// --- SEED DATA LOCAL (Dữ liệu dự phòng khi không có mạng hoặc chưa có Sheet) ---
const DEFAULT_STORIES: ExternalStory[] = [
  {
    id: 'default_1',
    title: 'Thỏ và Rùa - Truyện Cổ Tích',
    url: 'https://www.youtube.com/watch?v=kYsJ9TqS4Ag', 
    color: 'bg-candy-pink text-white border-candy-pinkDark'
  },
  {
    id: 'default_2',
    title: 'Sự Tích Cây Vú Sữa',
    url: 'https://www.youtube.com/watch?v=Xv7_sM8k4gE',
    color: 'bg-candy-aqua text-teal-800 border-candy-aquaDark'
  }
];

const DEFAULT_GAMES: ExternalGame[] = [
  {
    id: 'game_1',
    title: 'Học Đếm Số Cùng Gấu',
    url: 'https://poki.com/en/g/counting-squirrel', 
    color: 'bg-candy-mint text-green-900 border-candy-mintDark'
  },
  {
    id: 'game_2',
    title: 'Tô Màu Công Chúa',
    url: 'https://poki.com/en/g/coloring-book',
    color: 'bg-candy-sky text-blue-900 border-candy-skyDark'
  },
  {
    id: 'game_3',
    title: 'Ghép Hình Động Vật',
    url: 'https://poki.com/en/g/funny-puzzle',
    color: 'bg-candy-lemon text-orange-800 border-orange-200'
  }
];

export const KidZone: React.FC<Props> = ({ onBack }) => {
  const [activity, setActivity] = useState<KidActivity>(KidActivity.MENU);
  const [isLoading, setIsLoading] = useState(false);
  
  // External Story State
  const [localStories, setLocalStories] = useState<ExternalStory[]>([]);
  const [sheetStories, setSheetStories] = useState<ExternalStory[]>([]);
  const [showAddStoryModal, setShowAddStoryModal] = useState(false);
  const [newStoryTitle, setNewStoryTitle] = useState('');
  const [newStoryUrl, setNewStoryUrl] = useState('');

  // External Game State
  const [localGames, setLocalGames] = useState<ExternalGame[]>([]);
  const [sheetGames, setSheetGames] = useState<ExternalGame[]>([]); 
  const [showAddGameModal, setShowAddGameModal] = useState(false);
  const [newGameTitle, setNewGameTitle] = useState('');
  const [newGameUrl, setNewGameUrl] = useState('');

  // Load Data
  useEffect(() => {
    const loadData = async () => {
        setIsLoading(true);

        // 1. Load Local Stories (Personal bookmarks)
        const storedStories = localStorage.getItem(EXTERNAL_STORY_KEY);
        if (storedStories) {
            setLocalStories(JSON.parse(storedStories));
        } else {
            // Only use default seeds if NO sheet url is provided to avoid clutter
            if (!GOOGLE_SHEET_STORIES_URL) {
                 setLocalStories(DEFAULT_STORIES);
            }
        }

        // 2. Load Sheet Stories (Global library)
        if (GOOGLE_SHEET_STORIES_URL) {
            const sheetData = await fetchStoriesFromSheet(GOOGLE_SHEET_STORIES_URL);
            if (sheetData.length > 0) {
                setSheetStories(sheetData);
            }
        }

        // 3. Load Local Games
        const storedGames = localStorage.getItem(EXTERNAL_GAME_KEY);
        if (storedGames) {
            setLocalGames(JSON.parse(storedGames));
        } else {
             // Chỉ dùng default games nếu KHÔNG CÓ sheet url
             if (!GOOGLE_SHEET_GAMES_URL) {
                setLocalGames(DEFAULT_GAMES);
             }
        }

        // 4. Load Sheet Games (RIÊNG BIỆT)
        if (GOOGLE_SHEET_GAMES_URL) {
            const sheetGameData = await fetchGamesFromSheet(GOOGLE_SHEET_GAMES_URL);
            if (sheetGameData.length > 0) {
                setSheetGames(sheetGameData);
            }
        }

        setIsLoading(false);
    };

    loadData();
  }, []);

  const handleBack = () => {
    if (activity === KidActivity.MENU) {
      onBack();
    } else {
      setActivity(KidActivity.MENU);
    }
  };

  const openLink = (url: string) => {
    window.open(url, '_blank');
  };

  // --- Story Logic ---
  const handleAddStory = () => {
    if (!newStoryTitle.trim() || !newStoryUrl.trim()) return;

    let formattedUrl = newStoryUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) formattedUrl = 'https://' + formattedUrl;

    const randomColor = CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)];
    const newStory: ExternalStory = {
      id: Date.now().toString(),
      title: newStoryTitle,
      url: formattedUrl,
      color: randomColor
    };

    const updated = [newStory, ...localStories];
    setLocalStories(updated);
    localStorage.setItem(EXTERNAL_STORY_KEY, JSON.stringify(updated));
    setNewStoryTitle('');
    setNewStoryUrl('');
    setShowAddStoryModal(false);
  };

  const deleteStory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    if (window.confirm("Bé có chắc muốn xóa cuốn truyện này không?")) {
      const updated = localStories.filter(s => s.id !== id);
      setLocalStories(updated);
      localStorage.setItem(EXTERNAL_STORY_KEY, JSON.stringify(updated));
    }
  };

  // --- Game Logic ---
  const handleAddGame = () => {
    if (!newGameTitle.trim() || !newGameUrl.trim()) return;

    let formattedUrl = newGameUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) formattedUrl = 'https://' + formattedUrl;

    const randomColor = CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)];
    const newGame: ExternalGame = {
      id: Date.now().toString(),
      title: newGameTitle,
      url: formattedUrl,
      color: randomColor
    };

    const updated = [newGame, ...localGames];
    setLocalGames(updated);
    localStorage.setItem(EXTERNAL_GAME_KEY, JSON.stringify(updated));
    setNewGameTitle('');
    setNewGameUrl('');
    setShowAddGameModal(false);
  };

  const deleteGame = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    if (window.confirm("Bé có chắc muốn xóa trò chơi này không?")) {
      const updated = localGames.filter(s => s.id !== id);
      setLocalGames(updated);
      localStorage.setItem(EXTERNAL_GAME_KEY, JSON.stringify(updated));
    }
  };

  // Combine lists for display
  const allStories = [...sheetStories, ...localStories];
  const allGames = [...sheetGames, ...localGames];

  // --- Renderers ---
  
  const renderMenu = () => (
    <div className="max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
       <div className="flex justify-between w-full mb-8">
            <div></div>
            <Button variant="neutral" onClick={handleBack}>Thoát</Button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <button 
            onClick={() => setActivity(KidActivity.STORY_TIME)}
            className="group relative flex flex-col items-center p-12 bg-white rounded-[40px] shadow-[0_20px_0_rgba(255,154,162,1)] border-[6px] border-candy-pink hover:-translate-y-4 hover:shadow-[0_30px_0_rgba(255,154,162,1)] transition-all duration-300 w-80 h-80 justify-center"
          >
             <span className="text-9xl mb-4 group-hover:scale-110 transition-transform block">📚</span>
             <span className="text-4xl font-black text-candy-pinkDark uppercase tracking-wider">Đọc Truyện</span>
          </button>

          <button 
            onClick={() => setActivity(KidActivity.GAME_QUIZ)}
            className="group relative flex flex-col items-center p-12 bg-white rounded-[40px] shadow-[0_20px_0_rgba(181,234,215,1)] border-[6px] border-candy-aqua hover:-translate-y-4 hover:shadow-[0_30px_0_rgba(181,234,215,1)] transition-all duration-300 w-80 h-80 justify-center"
          >
             <span className="text-9xl mb-4 group-hover:scale-110 transition-transform block">🎮</span>
             <span className="text-4xl font-black text-teal-600 uppercase tracking-wider">Trò Chơi</span>
          </button>
       </div>
    </div>
  );

  const renderStoryTime = () => (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
          <Button variant="neutral" onClick={handleBack} size="lg">← Quay Lại</Button>
          <Button onClick={() => setShowAddStoryModal(true)} variant="primary" size="lg" className="shadow-lg animate-bounce-slow">
            ➕ Nhập Truyện Mới
          </Button>
      </div>
      
      <PageTitle icon="🌈">Tủ Truyện Của Bé</PageTitle>

      {isLoading ? (
          <div className="flex flex-col items-center mt-20">
              <LoadingSpinner />
              <p className="mt-4 text-candy-pinkDark font-bold animate-pulse">Đang lấy sách từ thư viện...</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12 px-4 mt-12">
            {allStories.length === 0 && (
                <div className="col-span-full text-center py-20 bg-white/50 rounded-[40px] border-4 border-dashed border-gray-200">
                    <p className="text-2xl text-gray-400 font-bold">Chưa có cuốn truyện nào cả 🌱</p>
                    <p className="text-gray-400 mt-2">Bấm nút "Nhập Truyện Mới" hoặc cập nhật Google Sheet nhé!</p>
                </div>
            )}

            {allStories.map((story, idx) => {
                const icon = BOOK_ICONS[idx % BOOK_ICONS.length];
                const isSheetItem = (story as any).isFromSheet; // Check if item is from sheet

                return (
                    <div 
                        key={story.id} 
                        onClick={() => openLink(story.url)}
                        className={`
                            relative aspect-[3/4] cursor-pointer group perspective-1000
                        `}
                    >
                        {/* Book Cover */}
                        <div className={`
                            absolute inset-0 rounded-r-[20px] rounded-l-[5px] shadow-[10px_10px_20px_rgba(0,0,0,0.15)] 
                            ${story.color || 'bg-white'} 
                            transition-transform duration-300 group-hover:-translate-y-4 group-hover:-rotate-2
                            flex flex-col border-4 border-l-[12px] border-black/10
                        `}>
                            {/* Decorative Patterns */}
                            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,white_2px,transparent_2px)] bg-[length:16px_16px]"></div>
                            
                            {/* Sheet Indicator Badge */}
                            {isSheetItem && (
                                <div className="absolute top-2 left-2 bg-white/30 px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider">
                                    Thư viện
                                </div>
                            )}

                            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative z-10">
                                <span className="text-7xl mb-4 filter drop-shadow-md">{icon}</span>
                                <h3 className="text-2xl font-black leading-tight line-clamp-3 text-current drop-shadow-sm">
                                    {story.title}
                                </h3>
                            </div>
                        </div>

                        {/* Pages Effect (Side) */}
                        <div className="absolute inset-y-2 right-0 w-4 bg-white rounded-r-md shadow-sm -z-10 group-hover:-translate-y-4 group-hover:-rotate-2 transition-transform duration-300 translate-x-2"></div>

                        {/* Delete Badge (Only for Local items) */}
                        {!isSheetItem && (
                            <button 
                                onClick={(e) => deleteStory(story.id, e)}
                                className="absolute -top-3 -right-3 w-12 h-12 bg-white border-4 border-red-400 text-red-500 rounded-full flex items-center justify-center text-2xl shadow-lg z-20 hover:scale-110 hover:bg-red-500 hover:text-white transition-all"
                                title="Xóa truyện cá nhân"
                            >
                                ✖
                            </button>
                        )}
                    </div>
                );
            })}
          </div>
      )}

      {/* Modal Adding Story */}
      {showAddStoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[40px] p-8 w-full max-w-lg shadow-2xl border-8 border-candy-pink relative animate-pop">
                <button 
                    onClick={() => setShowAddStoryModal(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-3xl font-bold"
                >✕</button>
                
                <h3 className="text-3xl font-black text-center text-candy-pinkDark mb-6">Thêm Truyện Cá Nhân</h3>
                <p className="text-center text-gray-400 text-sm mb-6">Truyện này chỉ lưu trên máy của bạn.</p>
                
                <div className="space-y-6">
                    <div>
                        <label className="block text-gray-600 font-bold mb-2 text-lg">Tên truyện:</label>
                        <Input 
                            value={newStoryTitle} 
                            onChange={(e) => setNewStoryTitle(e.target.value)} 
                            placeholder="Ví dụ: Nàng Bạch Tuyết..." 
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-gray-600 font-bold mb-2 text-lg">Đường dẫn (Link):</label>
                        <Input 
                            value={newStoryUrl} 
                            onChange={(e) => setNewStoryUrl(e.target.value)} 
                            placeholder="https://youtube.com/..." 
                        />
                    </div>
                    <div className="pt-4 flex gap-4">
                         <Button onClick={handleAddStory} variant="primary" size="lg" className="flex-1 text-xl">Lưu Lại ✨</Button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );

  const renderGameQuiz = () => (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
          <Button variant="neutral" onClick={handleBack} size="lg">← Quay Lại</Button>
          <Button onClick={() => setShowAddGameModal(true)} variant="secondary" size="lg" className="shadow-lg animate-bounce-slow">
            ➕ Nhập Game Mới
          </Button>
      </div>

      <PageTitle icon="🎮">Thế Giới Trò Chơi</PageTitle>

      {isLoading && allGames.length === 0 ? (
          <div className="flex flex-col items-center mt-20">
              <LoadingSpinner />
              <p className="mt-4 text-teal-600 font-bold animate-pulse">Đang tải trò chơi...</p>
          </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-4 mt-12">
            {allGames.length === 0 && (
                <div className="col-span-full text-center py-20 bg-white/50 rounded-[40px] border-4 border-dashed border-gray-200">
                    <p className="text-2xl text-gray-400 font-bold">Chưa có trò chơi nào cả 🎮</p>
                    <p className="text-gray-400 mt-2">Bấm nút "Nhập Game Mới" hoặc cập nhật Google Sheet nhé!</p>
                </div>
            )}

            {allGames.map((game, idx) => {
                const icon = GAME_ICONS[idx % GAME_ICONS.length];
                const isSheetItem = (game as any).isFromSheet; // Check logic from sheet

                return (
                    <div 
                        key={game.id}
                        onClick={() => openLink(game.url)}
                        className={`
                            relative h-64 rounded-[32px] cursor-pointer group
                            ${game.color || 'bg-gray-200'}
                            shadow-[0_12px_0_rgba(0,0,0,0.15)] border-4 border-white
                            hover:translate-y-2 hover:shadow-[0_4px_0_rgba(0,0,0,0.15)] transition-all
                            flex flex-col items-center justify-center p-6 text-center
                        `}
                    >
                        {/* Sheet Indicator Badge */}
                        {isSheetItem && (
                            <div className="absolute top-4 left-4 bg-white/30 px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wider shadow-sm border border-white/20">
                                Thư viện
                            </div>
                        )}

                        {/* Screen effect */}
                        <div className="w-full h-full bg-black/10 rounded-[20px] absolute inset-0 m-auto pointer-events-none"></div>
                        
                        <div className="relative z-10 bg-white/90 w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-4 shadow-inner">
                            {icon}
                        </div>
                        <h3 className="relative z-10 text-2xl font-black text-current drop-shadow-sm px-2 line-clamp-2">
                            {game.title}
                        </h3>

                        {/* Decorative buttons */}
                        <div className="absolute bottom-6 right-6 flex gap-2 opacity-50">
                            <div className="w-4 h-4 rounded-full bg-black/20"></div>
                            <div className="w-4 h-4 rounded-full bg-black/20"></div>
                        </div>
                        <div className="absolute bottom-6 left-6 w-8 h-8 rounded-full border-4 border-black/10 opacity-50"></div>

                        {/* Delete Badge (Only for Local items) */}
                        {!isSheetItem && (
                            <button 
                                onClick={(e) => deleteGame(game.id, e)}
                                className="absolute -top-4 -right-4 w-12 h-12 bg-white border-4 border-gray-200 text-gray-400 rounded-full flex items-center justify-center text-2xl shadow-lg z-20 hover:scale-110 hover:border-red-400 hover:text-red-500 transition-all"
                                title="Xóa game cá nhân"
                            >
                                ✖
                            </button>
                        )}
                    </div>
                )
            })}
        </div>
      )}

       {/* Modal Adding Game */}
       {showAddGameModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[40px] p-8 w-full max-w-lg shadow-2xl border-8 border-candy-aqua relative animate-pop">
                <button 
                    onClick={() => setShowAddGameModal(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-3xl font-bold"
                >✕</button>
                
                <h3 className="text-3xl font-black text-center text-teal-600 mb-6">Thêm Trò Chơi Mới</h3>
                <p className="text-center text-gray-400 text-sm mb-6">Game này chỉ lưu trên máy của bạn.</p>
                
                <div className="space-y-6">
                    <div>
                        <label className="block text-gray-600 font-bold mb-2 text-lg">Tên trò chơi:</label>
                        <Input 
                            value={newGameTitle} 
                            onChange={(e) => setNewGameTitle(e.target.value)} 
                            placeholder="Ví dụ: Học đếm số..." 
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-gray-600 font-bold mb-2 text-lg">Đường dẫn (Link):</label>
                        <Input 
                            value={newGameUrl} 
                            onChange={(e) => setNewGameUrl(e.target.value)} 
                            placeholder="https://poki.com/..." 
                        />
                    </div>
                    <div className="pt-4 flex gap-4">
                         <Button onClick={handleAddGame} variant="secondary" size="lg" className="flex-1 text-xl">Lưu Lại 🎮</Button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent p-6 pb-20">
      {activity === KidActivity.MENU && renderMenu()}
      {activity === KidActivity.STORY_TIME && renderStoryTime()}
      {activity === KidActivity.GAME_QUIZ && renderGameQuiz()}
    </div>
  );
};
