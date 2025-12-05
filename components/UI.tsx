import React from 'react';

// --- Colors & Styles ---
// Using the colors defined in index.html tailwind config

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '', 
  ...props 
}) => {
  // Chunky 3D Button Style
  const baseStyles = "font-black rounded-[20px] transition-all transform active:translate-y-[4px] active:border-b-0 border-b-[6px] relative overflow-hidden flex items-center justify-center gap-2 outline-none";
  
  const variants = {
    primary: "bg-candy-pink text-white border-candy-pinkDark hover:bg-[#FF8E96]",
    secondary: "bg-candy-aqua text-teal-800 border-candy-aquaDark hover:bg-[#A5E1CC]",
    accent: "bg-candy-lemon text-orange-800 border-orange-200 hover:bg-[#FFD1B0]",
    neutral: "bg-white text-gray-600 border-gray-200 hover:bg-gray-50",
    danger: "bg-red-400 text-white border-red-600 hover:bg-red-500"
  };

  const sizes = {
    sm: "px-4 py-1 text-sm border-b-[3px] active:translate-y-[2px]",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-xl rounded-[24px]",
    xl: "px-10 py-6 text-2xl rounded-[30px]"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string; color?: string; decoration?: string }> = ({ 
  children, 
  className = "",
  color = "bg-white",
  decoration
}) => {
  return (
    <div className={`${color} rounded-[32px] p-6 shadow-[0_10px_0_rgba(0,0,0,0.05)] border-4 border-white relative ${className}`}>
      {decoration && (
        <div className="absolute -top-6 -right-6 text-6xl opacity-50 pointer-events-none animate-wiggle">
          {decoration}
        </div>
      )}
      {children}
    </div>
  );
};

export const PageTitle: React.FC<{ children: React.ReactNode; icon?: string }> = ({ children, icon }) => (
  <div className="text-center mb-8 relative">
    {icon && <div className="text-6xl mb-2 animate-bounce-slow inline-block">{icon}</div>}
    <h1 className="text-4xl md:text-5xl font-black text-gray-700 tracking-tight drop-shadow-sm flex items-center justify-center gap-3">
      {children}
    </h1>
    <div className="w-32 h-2 bg-candy-pink/50 mx-auto mt-4 rounded-full"></div>
  </div>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input 
    className="w-full px-6 py-4 rounded-2xl border-4 border-gray-100 focus:border-candy-pink focus:bg-white bg-gray-50 outline-none transition-all text-gray-700 font-bold placeholder-gray-400 text-lg shadow-inner"
    {...props}
  />
);

export const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center p-8 gap-4">
    <div className="relative">
      <div className="animate-spin-slow text-6xl">☀️</div>
      <div className="absolute top-0 left-0 animate-bounce text-6xl">☁️</div>
    </div>
    <span className="text-candy-pinkDark font-bold text-xl animate-pulse">Đang suy nghĩ...</span>
  </div>
);