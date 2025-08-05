export { default as VideoPlayer } from './VideoPlayer';
export { default as YouTubePlayer } from './YouTubePlayer';
export { default as VimeoPlayer } from './VimeoPlayer';
export { default as CustomPlayer } from './CustomPlayer';
export { useVideoProgress } from './useVideoProgress';

// Video provider detection utilities
export const detectVideoProvider = (url: string): 'youtube' | 'vimeo' | 'custom' => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }
  if (url.includes('vimeo.com')) {
    return 'vimeo';
  }
  return 'custom';
};

export const validateVideoUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};