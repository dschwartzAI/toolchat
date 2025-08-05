import React, { forwardRef, useEffect, useRef, useImperativeHandle, useCallback } from 'react';

declare global {
  interface Window {
    Vimeo: any;
  }
}

interface VimeoPlayerProps {
  videoUrl: string;
  initialTime?: number;
  onReady?: () => void;
  onProgress?: (time: number, duration: number) => void;
  onComplete?: () => void;
}

const VimeoPlayer = forwardRef<any, VimeoPlayerProps>(({
  videoUrl,
  initialTime = 0,
  onReady,
  onProgress,
  onComplete
}, ref) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasCompletedRef = useRef(false);

  // Extract video ID from Vimeo URL
  const getVideoId = (url: string) => {
    const match = url.match(/(?:vimeo\.com\/)(\d+)/);
    return match ? match[1] : '';
  };

  const videoId = getVideoId(videoUrl);

  // Load Vimeo Player SDK
  useEffect(() => {
    if (!window.Vimeo) {
      const script = document.createElement('script');
      script.src = 'https://player.vimeo.com/api/player.js';
      script.onload = initializePlayer;
      document.body.appendChild(script);
    } else {
      initializePlayer();
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoId]);

  const initializePlayer = useCallback(() => {
    if (!containerRef.current || !window.Vimeo?.Player) return;

    const iframe = document.createElement('iframe');
    iframe.src = `https://player.vimeo.com/video/${videoId}`;
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.frameBorder = '0';
    iframe.allow = 'autoplay; fullscreen; picture-in-picture';
    containerRef.current.appendChild(iframe);

    playerRef.current = new window.Vimeo.Player(iframe);

    // Set up event listeners
    playerRef.current.on('loaded', handlePlayerReady);
    playerRef.current.on('play', handlePlay);
    playerRef.current.on('pause', handlePause);
    playerRef.current.on('ended', handleEnded);
    playerRef.current.on('timeupdate', handleTimeUpdate);
  }, [videoId]);

  const handlePlayerReady = async () => {
    if (initialTime > 0) {
      await playerRef.current.setCurrentTime(initialTime);
    }

    if (onReady) {
      onReady();
    }
  };

  const handlePlay = () => {
    startProgressTracking();
  };

  const handlePause = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  };

  const handleEnded = () => {
    if (!hasCompletedRef.current) {
      hasCompletedRef.current = true;
      if (onComplete) {
        onComplete();
      }
    }
  };

  const handleTimeUpdate = async (data: { seconds: number; duration: number }) => {
    if (onProgress) {
      onProgress(data.seconds, data.duration);
    }

    // Check if video is near completion (within 5 seconds of end)
    if (data.duration > 0 && data.seconds >= data.duration - 5 && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      if (onComplete) {
        onComplete();
      }
    }
  };

  const startProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = setInterval(async () => {
      if (playerRef.current) {
        try {
          const currentTime = await playerRef.current.getCurrentTime();
          const duration = await playerRef.current.getDuration();
          
          if (onProgress && duration > 0) {
            onProgress(currentTime, duration);
          }
        } catch (error) {
          console.error('Error getting video progress:', error);
        }
      }
    }, 1000);
  };

  useImperativeHandle(ref, () => ({
    play: () => playerRef.current?.play(),
    pause: () => playerRef.current?.pause(),
    seekTo: (time: number) => playerRef.current?.setCurrentTime(time),
    getCurrentTime: async () => {
      try {
        return await playerRef.current?.getCurrentTime() || 0;
      } catch {
        return 0;
      }
    },
    getDuration: async () => {
      try {
        return await playerRef.current?.getDuration() || 0;
      } catch {
        return 0;
      }
    }
  }));

  return <div ref={containerRef} className="w-full h-full" />;
});

VimeoPlayer.displayName = 'VimeoPlayer';

export default VimeoPlayer;