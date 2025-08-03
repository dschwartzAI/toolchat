import React, { useState, useContext } from 'react';
import { ThemeContext } from '~/hooks';
import { cn } from '~/utils';

interface LogoProps {
  className?: string;
  textClassName?: string;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  onClick?: () => void;
}

const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  textClassName = '',
  size = 'medium', 
  showText = true,
  onClick 
}) => {
  const [imageError, setImageError] = useState(false);
  const { theme } = useContext(ThemeContext);
  
  const sizeClasses = {
    small: 'h-4 w-auto',
    medium: 'h-6 w-auto',
    large: 'h-8 w-auto'
  };

  const textSizeClasses = {
    small: 'text-lg',
    medium: 'text-xl',
    large: 'text-3xl'
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div 
      className={cn('flex items-center gap-2', onClick && 'cursor-pointer', className)}
      onClick={onClick}
    >
      {!imageError ? (
        <img 
          src={theme === 'dark' ? '/assets/soloOS-white.png' : '/assets/soloOSblack.png'} 
          alt="SoloOS Logo" 
          className={cn(
            sizeClasses[size], 
            'object-contain'
          )}
          onError={handleImageError}
        />
      ) : (
        <div className={cn(
          'flex items-center justify-center rounded-md bg-gray-200 dark:bg-gray-700',
          sizeClasses[size],
          'min-w-[24px]'
        )}>
          <span className="font-bold text-gray-600 dark:text-gray-400">S</span>
        </div>
      )}
      {showText && (
        <span className={cn(
          'font-bold text-gray-900 dark:text-white',
          textSizeClasses[size],
          textClassName
        )}>
          SoloOS
        </span>
      )}
    </div>
  );
};

export default Logo;