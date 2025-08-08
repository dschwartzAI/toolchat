import React, { useState, useEffect } from 'react';
import { ArrowLeft, PlayCircle, FileText, Link, ChevronDown, ChevronUp, ChevronRight, CheckCircle, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EModelEndpoint } from 'librechat-data-provider';
import useNewConvo from '~/hooks/useNewConvo';
import { cn } from '~/utils';
import type { TModule } from '~/data-provider/Academy/types';

interface ModuleViewerProps {
  module: TModule;
  onBack: () => void;
}

const ModuleViewer: React.FC<ModuleViewerProps> = ({ module, onBack }) => {
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const navigate = useNavigate();
  const { newConversation } = useNewConvo();

  // Helper function to convert video URLs to proper embed format
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    
    // Handle Vimeo URLs
    if (url.includes('vimeo.com')) {
      // Extract video ID from various Vimeo URL formats
      const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
      if (vimeoMatch) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}?badge=0&autopause=0&player_id=0&app_id=58479`;
      }
    }
    
    // Handle YouTube URLs
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      // Already embedded YouTube URL
      if (url.includes('youtube.com/embed/')) {
        return url;
      }
      // Convert watch URL to embed
      const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
      if (youtubeMatch) {
        return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
      }
    }
    
    // Return original URL if it's already in embed format or unrecognized
    return url;
  };

  const handleMarkComplete = () => {
    setIsCompleted(true);
    // In production, this would update the backend
    console.log('Module completed:', module._id);
  };

  const handleChatWithCourse = () => {
    // Create a new conversation with SovereignJK agent
    const initialText = `I'm watching "${module.title}". Help me understand `;
    
    // First, create a new conversation with the SovereignJK agent
    newConversation({
      template: {
        endpoint: EModelEndpoint.agents,
        agent_id: 'agent_KVXW88WVte1tcyABlAowy',
        title: `Academy: ${module.title}`
      },
      buildDefault: true
    });
    
    // Navigate with the initial text - the newConversation already handles navigation
    // We just need to update the state after a brief delay to ensure the conversation is set
    setTimeout(() => {
      // The newConversation already navigated to /c/new
      // We need to set the initial text in the chat form
      const currentPath = window.location.pathname;
      if (currentPath.includes('/c/')) {
        // Force update the location state with initial text
        navigate(currentPath, {
          replace: true,
          state: { 
            focusChat: true,
            initialText: initialText
          }
        });
      }
    }, 200);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} minutes`;
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-light bg-surface-primary">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
            aria-label="Back to modules"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </button>
          <div>
            <div className="text-xs text-text-tertiary">Module {module.order}</div>
            <h1 className="text-xl font-semibold text-text-primary">{module.title}</h1>
          </div>
        </div>
        {isCompleted && (
          <div className="flex items-center gap-2 text-green-500">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Completed</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-4 space-y-6">
          {/* Video Section */}
          {module.videoUrl && (
            <div className="bg-surface-secondary rounded-lg overflow-hidden">
              <div className="aspect-video bg-black">
                <iframe
                  src={getEmbedUrl(module.videoUrl)}
                  className="w-full h-full"
                  allowFullScreen
                  title={module.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                />
              </div>
              <div className="p-3 border-t border-border-light">
                <div className="flex items-center justify-between mb-3">
                  {module.duration && (
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <PlayCircle className="w-4 h-4" />
                      <span>Duration: {formatDuration(module.duration)}</span>
                    </div>
                  )}
                  {!isCompleted && (
                    <button
                      onClick={handleMarkComplete}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                    >
                      Mark as Complete
                    </button>
                  )}
                </div>
                {/* Chat with SovereignJK Button */}
                <button
                  onClick={handleChatWithCourse}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Ask SovereignJK about this module</span>
                </button>
              </div>
            </div>
          )}

          {/* Text Content Section */}
          {module.textContent && (
            <div className="bg-surface-secondary rounded-lg p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-3">
                {module.textContent.header}
              </h2>
              <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">
                {module.textContent.subtext}
              </p>
            </div>
          )}

          {/* Resources Section */}
          {module.resources && module.resources.length > 0 && (
            <div className="bg-surface-secondary rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-text-primary">Resources</h2>
              </div>
              <div className="space-y-3">
                {module.resources.map((resource, index) => (
                  <a
                    key={index}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-surface-primary rounded-lg hover:bg-surface-hover transition-colors group"
                  >
                    <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                      <Link className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-text-primary font-medium">{resource.title}</p>
                      <p className="text-xs text-text-tertiary">{resource.url}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-text-secondary transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Transcript Section */}
          {module.transcript && (
            <div className="bg-surface-secondary rounded-lg overflow-hidden">
              <button
                onClick={() => setIsTranscriptExpanded(!isTranscriptExpanded)}
                className="w-full p-6 flex items-center justify-between hover:bg-surface-hover transition-colors"
              >
                <h2 className="text-lg font-semibold text-text-primary">Transcript</h2>
                {isTranscriptExpanded ? (
                  <ChevronUp className="w-5 h-5 text-text-secondary" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-text-secondary" />
                )}
              </button>
              
              <div
                className={cn(
                  "overflow-hidden transition-all duration-300",
                  isTranscriptExpanded ? "max-h-[2000px]" : "max-h-0"
                )}
              >
                <div className="px-6 pb-6 border-t border-border-light">
                  <div className="mt-4 p-4 bg-surface-primary rounded-lg">
                    <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">
                      {module.transcript}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Completion Button (if not already completed and no video) */}
          {!isCompleted && !module.videoUrl && (
            <div className="flex justify-center py-6">
              <button
                onClick={handleMarkComplete}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                Mark Module as Complete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModuleViewer;