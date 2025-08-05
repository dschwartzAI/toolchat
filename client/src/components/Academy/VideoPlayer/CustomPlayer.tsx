import React, { forwardRef, useRef, useImperativeHandle, useEffect } from 'react';

interface CustomPlayerProps {
  videoUrl: string;
  initialTime?: number;
  onReady?: () => void;
  onProgress?: (time: number, duration: number) => void;
  onComplete?: () => void;
}

const CustomPlayer = forwardRef<any, CustomPlayerProps>(({
  videoUrl,
  initialTime = 0,
  onReady,
  onProgress,
  onComplete
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const handleLoadedMetadata = () => {
    if (videoRef.current && initialTime > 0) {
      videoRef.current.currentTime = initialTime;
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

  const handleTimeUpdate = () => {
    if (videoRef.current && onProgress) {
      const currentTime = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      
      if (!isNaN(duration)) {
        onProgress(currentTime, duration);

        // Check if video is near completion (within 5 seconds of end)
        if (currentTime >= duration - 5 && !hasCompletedRef.current) {
          hasCompletedRef.current = true;
          if (onComplete) {
            onComplete();
          }
        }
      }
    }
  };

  const startProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = setInterval(() => {
      handleTimeUpdate();
    }, 1000);
  };

  useImperativeHandle(ref, () => ({
    play: () => videoRef.current?.play(),
    pause: () => videoRef.current?.pause(),
    seekTo: (time: number) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
      }
    },
    getCurrentTime: () => videoRef.current?.currentTime || 0,
    getDuration: () => videoRef.current?.duration || 0
  }));

  return (
    <video
      ref={videoRef}
      src={videoUrl}
      className="w-full h-full object-contain"
      controls
      onLoadedMetadata={handleLoadedMetadata}
      onPlay={handlePlay}
      onPause={handlePause}
      onEnded={handleEnded}
      onTimeUpdate={handleTimeUpdate}
    >
      Your browser does not support the video tag.
    </video>
  );
});

CustomPlayer.displayName = 'CustomPlayer';

export default CustomPlayer;