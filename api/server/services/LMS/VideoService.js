const { logger } = require('~/config');

/**
 * Service for handling video provider integrations
 */
class VideoService {
  /**
   * Extract video ID from YouTube URL
   */
  extractYouTubeId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Extract video ID from Vimeo URL
   */
  extractVimeoId(url) {
    const patterns = [
      /vimeo\.com\/(\d+)/,
      /player\.vimeo\.com\/video\/(\d+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Determine video provider and extract ID
   */
  parseVideoUrl(url) {
    if (!url) {
      return { provider: null, videoId: null };
    }

    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = this.extractYouTubeId(url);
      return {
        provider: 'youtube',
        videoId,
        embedUrl: videoId ? `https://www.youtube.com/embed/${videoId}` : null
      };
    }

    // Vimeo
    if (url.includes('vimeo.com')) {
      const videoId = this.extractVimeoId(url);
      return {
        provider: 'vimeo',
        videoId,
        embedUrl: videoId ? `https://player.vimeo.com/video/${videoId}` : null
      };
    }

    // Custom video URL (direct link)
    if (url.match(/\.(mp4|webm|ogg)$/i)) {
      return {
        provider: 'custom',
        videoId: null,
        embedUrl: url
      };
    }

    return { provider: null, videoId: null, embedUrl: null };
  }

  /**
   * Generate embed code for video
   */
  generateEmbedCode(url, options = {}) {
    const { width = 640, height = 360, autoplay = false } = options;
    const videoInfo = this.parseVideoUrl(url);

    if (!videoInfo.embedUrl) {
      return null;
    }

    const embedParams = {
      youtube: {
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        autoplay: autoplay ? 1 : 0,
        enablejsapi: 1,
        origin: process.env.DOMAIN_CLIENT || 'http://localhost:5173'
      },
      vimeo: {
        autoplay: autoplay ? 1 : 0,
        api: 1,
        player_id: 'vimeo-player'
      }
    };

    let embedUrl = videoInfo.embedUrl;
    
    // Add provider-specific parameters
    if (videoInfo.provider === 'youtube' || videoInfo.provider === 'vimeo') {
      const params = embedParams[videoInfo.provider];
      const queryString = new URLSearchParams(params).toString();
      embedUrl += `?${queryString}`;
    }

    return {
      ...videoInfo,
      embedUrl,
      embedCode: `<iframe 
        width="${width}" 
        height="${height}" 
        src="${embedUrl}" 
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen>
      </iframe>`
    };
  }

  /**
   * Get video metadata (duration, thumbnail, etc.)
   * Note: This would typically require API keys for YouTube/Vimeo APIs
   */
  async getVideoMetadata(url) {
    try {
      const videoInfo = this.parseVideoUrl(url);
      
      if (!videoInfo.videoId) {
        return null;
      }

      // Placeholder response - in production, this would call YouTube/Vimeo APIs
      const metadata = {
        provider: videoInfo.provider,
        videoId: videoInfo.videoId,
        title: 'Video Title',
        duration: 0, // Would be fetched from API
        thumbnail: this.getVideoThumbnail(videoInfo),
        embedUrl: videoInfo.embedUrl
      };

      return metadata;
    } catch (error) {
      logger.error('[VideoService] Error getting video metadata:', error);
      return null;
    }
  }

  /**
   * Get video thumbnail URL
   */
  getVideoThumbnail(videoInfo) {
    if (videoInfo.provider === 'youtube' && videoInfo.videoId) {
      return `https://img.youtube.com/vi/${videoInfo.videoId}/maxresdefault.jpg`;
    }

    if (videoInfo.provider === 'vimeo' && videoInfo.videoId) {
      // Vimeo thumbnails require API call, returning placeholder
      return `https://vumbnail.com/${videoInfo.videoId}.jpg`;
    }

    return null;
  }

  /**
   * Validate video URL
   */
  isValidVideoUrl(url) {
    const videoInfo = this.parseVideoUrl(url);
    return videoInfo.provider !== null && (videoInfo.videoId !== null || videoInfo.provider === 'custom');
  }

  /**
   * Generate video player configuration
   */
  getPlayerConfig(provider) {
    const configs = {
      youtube: {
        playerVars: {
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          enablejsapi: 1,
          origin: process.env.DOMAIN_CLIENT || 'http://localhost:5173'
        },
        events: {
          onStateChange: 'onPlayerStateChange',
          onReady: 'onPlayerReady'
        }
      },
      vimeo: {
        api: true,
        player_id: 'vimeo-player',
        autopause: false
      },
      custom: {
        controls: true,
        preload: 'metadata'
      }
    };

    return configs[provider] || configs.custom;
  }
}

module.exports = new VideoService();