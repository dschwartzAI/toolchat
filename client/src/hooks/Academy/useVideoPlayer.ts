import { useState, useRef, useCallback, useEffect } from 'react';
import { useVideoProgress } from '~/components/Academy/VideoPlayer/useVideoProgress';

interface UseVideoPlayerOptions {
  lessonId: string;
  onComplete?: () => void;
}

export const useVideoPlayer = ({ lessonId, onComplete }: UseVideoPlayerOptions) => {
  const playerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isBuffering, setIsBuffering] = useState(false);

  const {
    percentComplete,
    handleProgress,
    handleComplete
  } = useVideoProgress({
    lessonId,
    onComplete
  });

  const play = useCallback(() => {
    if (playerRef.current?.play) {
      playerRef.current.play();
      setIsPlaying(true);
    }
  }, []);

  const pause = useCallback(() => {
    if (playerRef.current?.pause) {
      playerRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const seekTo = useCallback((time: number) => {
    if (playerRef.current?.seekTo) {
      playerRef.current.seekTo(time);
      setCurrentTime(time);
    }
  }, []);

  const skipForward = useCallback((seconds: number = 10) => {
    const newTime = Math.min(currentTime + seconds, duration);
    seekTo(newTime);
  }, [currentTime, duration, seekTo]);

  const skipBackward = useCallback((seconds: number = 10) => {
    const newTime = Math.max(currentTime - seconds, 0);
    seekTo(newTime);
  }, [currentTime, seekTo]);

  const setVolumeLevel = useCallback((level: number) => {
    const clampedLevel = Math.max(0, Math.min(1, level));
    setVolume(clampedLevel);
    
    if (clampedLevel === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = playerRef.current?.parentElement;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.error('Error attempting to exit fullscreen:', err);
      });
    }
  }, []);

  const changePlaybackRate = useCallback((rate: number) => {
    const validRates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    if (validRates.includes(rate)) {
      setPlaybackRate(rate);
    }
  }, []);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipBackward();
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipForward();
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolumeLevel(volume + 0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolumeLevel(volume - 0.1);
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case '<':
          e.preventDefault();
          changePlaybackRate(Math.max(0.5, playbackRate - 0.25));
          break;
        case '>':
          e.preventDefault();
          changePlaybackRate(Math.min(2, playbackRate + 0.25));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [
    togglePlayPause,
    skipBackward,
    skipForward,
    setVolumeLevel,
    volume,
    toggleMute,
    toggleFullscreen,
    changePlaybackRate,
    playbackRate
  ]);

  const onProgress = useCallback((time: number, totalDuration: number) => {
    setCurrentTime(time);
    setDuration(totalDuration);
    handleProgress(time, totalDuration);
  }, [handleProgress]);

  return {
    // State
    playerRef,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isFullscreen,
    playbackRate,
    isBuffering,
    percentComplete,
    
    // Controls
    play,
    pause,
    togglePlayPause,
    seekTo,
    skipForward,
    skipBackward,
    setVolumeLevel,
    toggleMute,
    toggleFullscreen,
    changePlaybackRate,
    
    // Event handlers
    onProgress,
    onComplete: handleComplete,
    setIsBuffering
  };
};