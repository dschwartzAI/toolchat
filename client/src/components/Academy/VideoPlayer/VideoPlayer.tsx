import React, { useRef, useMemo, useEffect, useState } from 'react';
import { cn } from '~/utils';
import { useGetLessonProgressQuery } from '~/data-provider/Academy';
import YouTubePlayer from './YouTubePlayer';
import VimeoPlayer from './VimeoPlayer';
import CustomPlayer from './CustomPlayer';

interface VideoPlayerProps {
  lessonId: string;
  videoUrl: string;
  provider: 'youtube' | 'vimeo' | 'custom';
  onProgress?: (time: number, duration: number) => void;
  onComplete?: () => void;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  lessonId,
  videoUrl,
  provider,
  onProgress,
  onComplete,
  className
}) => {
  const { data: progress } = useGetLessonProgressQuery(lessonId);
  const playerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  const PlayerComponent = useMemo(() => {
    switch (provider) {
      case 'youtube':
        return YouTubePlayer;
      case 'vimeo':
        return VimeoPlayer;
      default:
        return CustomPlayer;
    }
  }, [provider]);

  const handleReady = () => {
    setIsReady(true);
  };

  const handleProgress = (time: number, duration: number) => {
    if (onProgress) {
      onProgress(time, duration);
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className={cn('relative aspect-video bg-black rounded-lg overflow-hidden', className)}>
      <PlayerComponent
        ref={playerRef}
        videoUrl={videoUrl}
        initialTime={progress?.lastPosition || 0}
        onReady={handleReady}
        onProgress={handleProgress}
        onComplete={handleComplete}
      />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;