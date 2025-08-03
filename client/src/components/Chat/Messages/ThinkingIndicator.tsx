import React, { useState, useEffect } from 'react';
import { cn } from '~/utils';

interface ThinkingIndicatorProps {
  className?: string;
  variant?: 'dots' | 'text' | 'wave' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
}

const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({
  className = '',
  variant = 'dots',
  size = 'md',
}) => {
  const [textIndex, setTextIndex] = useState(0);
  const [dotCount, setDotCount] = useState(1);

  const thinkingTexts = [
    'Thinking',
    'Processing',
    'Analyzing',
    'Composing response',
  ];

  useEffect(() => {
    if (variant === 'text') {
      const interval = setInterval(() => {
        setTextIndex((prev) => (prev + 1) % thinkingTexts.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [variant]);

  useEffect(() => {
    if (variant === 'dots' || variant === 'text') {
      const interval = setInterval(() => {
        setDotCount((prev) => (prev % 3) + 1);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [variant]);

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const dotSizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  if (variant === 'dots') {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((index) => (
            <div
              key={index}
              className={cn(
                'rounded-full bg-gray-600 dark:bg-gray-400 transition-all duration-300',
                dotSizeClasses[size],
                index <= dotCount ? 'opacity-100' : 'opacity-30'
              )}
              style={{
                animation: index <= dotCount ? 'bounce 1.4s infinite' : 'none',
                animationDelay: `${index * 0.16}s`,
              }}
            />
          ))}
        </div>
        <span className={cn('ml-2 text-gray-600 dark:text-gray-400', sizeClasses[size])}>
          Thinking...
        </span>
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={cn('flex items-center', className)}>
        <span className={cn('text-gray-600 dark:text-gray-400', sizeClasses[size])}>
          {thinkingTexts[textIndex]}{'.'.repeat(dotCount)}
        </span>
      </div>
    );
  }

  if (variant === 'wave') {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        {[1, 2, 3, 4, 5].map((index) => (
          <div
            key={index}
            className={cn(
              'bg-gray-600 dark:bg-gray-400 rounded-sm',
              size === 'sm' ? 'w-0.5 h-3' : size === 'md' ? 'w-1 h-4' : 'w-1 h-5'
            )}
            style={{
              animation: 'wave 1.2s linear infinite',
              animationDelay: `${index * 0.1}s`,
            }}
          />
        ))}
        <span className={cn('ml-2 text-gray-600 dark:text-gray-400', sizeClasses[size])}>
          AI is thinking
        </span>
      </div>
    );
  }

  // Default pulse variant (enhanced version of current implementation)
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative">
        <div
          className={cn(
            'rounded-full bg-gray-700 dark:bg-gray-300',
            size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'
          )}
          style={{
            animation: 'pulseSize 1.25s ease-in-out infinite',
          }}
        />
        <div
          className={cn(
            'absolute inset-0 rounded-full bg-gray-700 dark:bg-gray-300 opacity-40',
            size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'
          )}
          style={{
            animation: 'pulseOpacity 1.25s ease-in-out infinite',
          }}
        />
      </div>
      <span className={cn('text-gray-600 dark:text-gray-400', sizeClasses[size])}>
        Processing...
      </span>
    </div>
  );
};

export default ThinkingIndicator;