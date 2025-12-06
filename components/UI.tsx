import React, { useState } from 'react';

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

// --- NEW COMPONENT: SmartImage ---
// Handles image loading state with a fun placeholder animation and RETRY logic
interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
}

export const SmartImage: React.FC<SmartImageProps> = ({ src, alt, className, fallbackSrc, ...props }) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Reset state when src prop changes
  React.useEffect(() => {
    setCurrentSrc(src);
    setIsLoading(true);
    setHasError(false);
    setRetryCount(0);
  }, [src]);

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    setHasError(false);
    setRetryCount(prev => prev + 1);
    // Append a unique timestamp to force browser to re-fetch the image
    const separator = src?.includes('?') ? '&' : '?';
    setCurrentSrc(`${src}${separator}retry=${Date.now()}`);
  };

  return (
    <div className={`relative overflow-hidden bg-gray-100 group ${className}`}>
      {/* Loading Skeleton / Animation */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10 transition-opacity">
          <div className="w-full h-full absolute inset-0 bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 animate-[shimmer_2s_infinite]"></div>
          <div className="relative z-20 flex flex-col items-center animate-pulse">
            <span className="text-5xl mb-2 animate-bounce">🎨</span>
            <span className="text-candy-pinkDark font-bold text-sm">Đang vẽ tranh...</span>
          </div>
        </div>
      )}

      {/* Actual Image */}
      {!hasError ? (
        <img
          src={currentSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-700 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          {...props}
        />
      ) : (
        /* Error Placeholder with Retry Button */
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-400 p-4 text-center">
           <span className="text-4xl mb-2 grayscale opacity-50">🖼️</span>
           <span className="text-xs font-bold mb-3">Chưa tải được ảnh</span>
           <button 
             onClick={handleRetry}
             className="bg-candy-pink text-white text-xs font-bold px-4 py-2 rounded-full shadow-md hover:bg-candy-pinkDark hover:scale-105 transition-all active:scale-95 z-30"
           >
             🔄 Thử lại
           </button>
        </div>
      )}
    </div>
  );
};