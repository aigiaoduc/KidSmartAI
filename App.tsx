
import React, { useState } from 'react';
import { AppMode } from './types';
import { TeacherDashboard } from './components/TeacherDashboard';
import { KidZone } from './components/KidZone';
import { Button } from './components/UI';

const STICKERS = {
  rocket: "https://res.cloudinary.com/dejnvixvn/image/upload/v1765032836/2632839-removebg-preview_ijrd9e.png",
  pencil: "https://res.cloudinary.com/dejnvixvn/image/upload/v1765032837/10776313-removebg-preview_anc5s6.png",
  book: "https://res.cloudinary.com/dejnvixvn/image/upload/v1765032837/10757198-removebg-preview_zvbqfo.png",
  sun: "https://res.cloudinary.com/dejnvixvn/image/upload/v1765032808/10757598-removebg-preview_hlobxd.png"
};

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.HOME);

  const renderHome = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-[#fff9f9]">
      
      {/* --- BACKGROUND DECORATIONS (STICKERS) --- */}
      
      {/* Top Left - Book/Character */}
      <img 
        src={STICKERS.book} 
        alt="Decoration" 
        className="absolute top-[10%] left-[5%] w-32 md:w-48 opacity-90 animate-float drop-shadow-xl" 
        style={{animationDelay: '0s'}}
      />

      {/* Top Right - Pencil/Art */}
      <img 
        src={STICKERS.pencil} 
        alt="Decoration" 
        className="absolute top-[15%] right-[5%] w-28 md:w-40 opacity-90 animate-wiggle drop-shadow-lg" 
        style={{animationDelay: '1s'}}
      />
      
      {/* Floating shapes (CSS only) */}
      <div className="absolute top-40 left-1/3 w-6 h-6 rounded-full bg-candy-pink animate-bounce-slow opacity-60"></div>
      <div className="absolute bottom-40 right-1/3 w-8 h-8 rounded-full bg-candy-aqua animate-wiggle opacity-60"></div>
      
      <div className="relative z-10 max-w-4xl w-full text-center">
        
        {/* Logo/Title Area */}
        <div className="mb-16 animate-pop">
           <div className="inline-block relative">
              <h1 className="text-6xl md:text-8xl font-black text-white drop-shadow-[0_8px_0_rgba(0,0,0,0.1)] stroke-text-white tracking-tight font-sans" style={{textShadow: '4px 4px 0px #FF9AA2', WebkitTextStroke: '2px #FF9AA2'}}>
                KidSmart AI
              </h1>
              <div className="absolute -top-8 -right-8 text-6xl animate-wiggle">✨</div>
           </div>
           <p className="text-2xl md:text-3xl text-gray-500 font-bold mt-6 bg-white/60 inline-block px-8 py-2 rounded-full backdrop-blur-sm shadow-sm border-2 border-white">
             Bé Học Hay - Cô Dạy Giỏi
           </p>
        </div>

        {/* Mode Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 px-4">
          <button 
            onClick={() => setMode(AppMode.TEACHER)}
            className="group relative flex flex-col items-center p-10 bg-white rounded-[40px] shadow-[0_15px_0_rgba(226,240,203,1)] border-4 border-candy-mint hover:-translate-y-4 hover:shadow-[0_25px_0_rgba(226,240,203,1)] transition-all duration-300"
          >
            <div className="w-32 h-32 bg-candy-mint rounded-full flex items-center justify-center text-7xl mb-6 shadow-inner group-hover:scale-110 transition-transform border-4 border-white">
              👩‍🏫
            </div>
            <h2 className="text-3xl font-black text-gray-700">Giáo Viên</h2>
            <p className="text-gray-400 font-bold mt-2">Soạn bài & Tạo học liệu</p>
          </button>

          <button 
            onClick={() => setMode(AppMode.KID)}
            className="group relative flex flex-col items-center p-10 bg-white rounded-[40px] shadow-[0_15px_0_rgba(255,218,193,1)] border-4 border-candy-lemon hover:-translate-y-4 hover:shadow-[0_25px_0_rgba(255,218,193,1)] transition-all duration-300"
          >
            <div className="w-32 h-32 bg-candy-lemon rounded-full flex items-center justify-center text-7xl mb-6 shadow-inner group-hover:scale-110 transition-transform border-4 border-white">
              👶
            </div>
            <h2 className="text-3xl font-black text-gray-700">Bé Yêu</h2>
            <p className="text-gray-400 font-bold mt-2">Vui chơi & Khám phá</p>
          </button>
        </div>
      </div>
      
      <div className="absolute bottom-4 text-gray-400 font-bold text-sm bg-white/50 px-6 py-2 rounded-full shadow-sm backdrop-blur-sm text-center">
        © Tác giả: Nguyễn Thị Linh - Trường Mầm non Phì Nhừ
      </div>
    </div>
  );

  return (
    <>
      {mode === AppMode.HOME && renderHome()}
      {mode === AppMode.TEACHER && <TeacherDashboard onBack={() => setMode(AppMode.HOME)} />}
      {mode === AppMode.KID && <KidZone onBack={() => setMode(AppMode.HOME)} />}
    </>
  );
};

export default App;
