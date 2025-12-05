
import React, { useState } from 'react';
import { AppMode } from './types';
import { TeacherDashboard } from './components/TeacherDashboard';
import { KidZone } from './components/KidZone';
import { Button } from './components/UI';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.HOME);

  const renderHome = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background decorations - Clouds */}
      <div className="absolute top-[10%] left-[10%] text-[8rem] opacity-60 animate-float" style={{animationDelay: '0s'}}>☁️</div>
      <div className="absolute top-[20%] right-[15%] text-[6rem] opacity-40 animate-float" style={{animationDelay: '1s'}}>☁️</div>
      <div className="absolute bottom-[15%] left-[20%] text-[10rem] opacity-20 animate-float" style={{animationDelay: '2s'}}>☁️</div>
      
      {/* Floating shapes */}
      <div className="absolute top-20 left-1/2 w-8 h-8 rounded-full bg-candy-pink animate-bounce-slow"></div>
      <div className="absolute bottom-40 right-10 w-12 h-12 rounded-full bg-candy-aqua animate-wiggle"></div>
      
      <div className="relative z-10 max-w-4xl w-full text-center">
        
        {/* Logo/Title Area */}
        <div className="mb-16 animate-pop">
           <div className="inline-block relative">
              <h1 className="text-6xl md:text-8xl font-black text-white drop-shadow-[0_8px_0_rgba(0,0,0,0.1)] stroke-text-white tracking-tight" style={{textShadow: '4px 4px 0px #FF9AA2'}}>
                KidSmart AI
              </h1>
              <div className="absolute -top-12 -right-12 text-6xl animate-wiggle">✨</div>
              <div className="absolute -bottom-8 -left-8 text-6xl animate-bounce-slow">🚀</div>
           </div>
           <p className="text-2xl md:text-3xl text-gray-500 font-bold mt-6 bg-white/60 inline-block px-8 py-2 rounded-full backdrop-blur-sm shadow-sm">
             Bé Học Hay - Cô Dạy Giỏi
           </p>
        </div>

        {/* Mode Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 px-4">
          <button 
            onClick={() => setMode(AppMode.TEACHER)}
            className="group relative flex flex-col items-center p-10 bg-white rounded-[40px] shadow-[0_15px_0_rgba(226,240,203,1)] border-4 border-candy-mint hover:-translate-y-4 hover:shadow-[0_25px_0_rgba(226,240,203,1)] transition-all duration-300"
          >
            <div className="w-32 h-32 bg-candy-mint rounded-full flex items-center justify-center text-7xl mb-6 shadow-inner group-hover:scale-110 transition-transform">
              👩‍🏫
            </div>
            <h2 className="text-3xl font-black text-gray-700">Giáo Viên</h2>
            <p className="text-gray-400 font-bold mt-2">Soạn bài & Tạo học liệu</p>
            <div className="absolute -top-6 -right-6 text-5xl opacity-0 group-hover:opacity-100 transition-opacity animate-bounce">🍎</div>
          </button>

          <button 
            onClick={() => setMode(AppMode.KID)}
            className="group relative flex flex-col items-center p-10 bg-white rounded-[40px] shadow-[0_15px_0_rgba(255,218,193,1)] border-4 border-candy-lemon hover:-translate-y-4 hover:shadow-[0_25px_0_rgba(255,218,193,1)] transition-all duration-300"
          >
            <div className="w-32 h-32 bg-candy-lemon rounded-full flex items-center justify-center text-7xl mb-6 shadow-inner group-hover:scale-110 transition-transform">
              👶
            </div>
            <h2 className="text-3xl font-black text-gray-700">Bé Yêu</h2>
            <p className="text-gray-400 font-bold mt-2">Vui chơi & Khám phá</p>
            <div className="absolute -top-6 -right-6 text-5xl opacity-0 group-hover:opacity-100 transition-opacity animate-bounce">🎈</div>
          </button>
        </div>
      </div>
      
      <div className="absolute bottom-4 text-gray-500 font-bold text-sm bg-white/80 px-6 py-2 rounded-full shadow-sm backdrop-blur-sm text-center">
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
