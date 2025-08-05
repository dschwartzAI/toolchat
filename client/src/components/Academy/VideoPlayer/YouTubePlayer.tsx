import React, { forwardRef, useEffect, useRef, useImperativeHandle, useCallback } from 'react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerProps {
  videoUrl: string;
  initialTime?: number;
  onReady?: () => void;
  onProgress?: (time: number, duration: number) => void;
  onComplete?: () => void;
}

const YouTubePlayer = forwardRef<any, YouTubePlayerProps>(({
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

  // Extract video ID from YouTube URL
  const getVideoId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([^&\n?#]+)/);
    return match ? match[1] : '';
  };

  const videoId = getVideoId(videoUrl);

  // Load YouTube API script
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    } else if (window.YT.Player) {
      initializePlayer();
    }

    window.onYouTubeIframeAPIReady = initializePlayer;

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [videoId]);

  const initializePlayer = useCallback(() => {
    if (!containerRef.current || !window.YT?.Player) return;

    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId,
      playerVars: {
        autoplay: 0,
        controls: 1,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        start: Math.floor(initialTime)
      },
      events: {
        onReady: handlePlayerReady,
        onStateChange: handleStateChange
      }
    });
  }, [videoId, initialTime]);

  const handlePlayerReady = (event: any) => {
    const player = event.target;
    
    // Seek to initial time if provided
    if (initialTime > 0) {
      player.seekTo(initialTime, true);
    }

    if (onReady) {
      onReady();
    }

    // Start progress tracking
    startProgressTracking();
  };

  const handleStateChange = (event: any) => {
    const player = event.target;
    
    if (event.data === window.YT.PlayerState.PLAYING) {
      startProgressTracking();
    } else if (event.data === window.YT.PlayerState.PAUSED) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    } else if (event.data === window.YT.PlayerState.ENDED && !hasCompletedRef.current) {
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

    progressIntervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const currentTime = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();
        
        if (onProgress && duration > 0) {
          onProgress(currentTime, duration);
        }

        // Check if video is near completion (within 5 seconds of end)
        if (duration > 0 && currentTime >= duration - 5 && !hasCompletedRef.current) {
          hasCompletedRef.current = true;
          if (onComplete) {
            onComplete();
          }
        }
      }
    }, 1000);
  };

  useImperativeHandle(ref, () => ({
    play: () => playerRef.current?.playVideo(),
    pause: () => playerRef.current?.pauseVideo(),
    seekTo: (time: number) => playerRef.current?.seekTo(time, true),
    getCurrentTime: () => playerRef.current?.getCurrentTime() || 0,
    getDuration: () => playerRef.current?.getDuration() || 0
  }));

  return <div ref={containerRef} className="w-full h-full" />;
});

YouTubePlayer.displayName = 'YouTubePlayer';

export default YouTubePlayer;