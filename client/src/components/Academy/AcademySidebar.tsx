import React, { useEffect, useRef } from 'react';
import { Users, BookOpen, Calendar, X, GripVertical, UserPlus, PanelLeftClose } from 'lucide-react';
import { useRecoilState } from 'recoil';
import { useLocalize, useMediaQuery } from '~/hooks';
import { cn } from '~/utils';
import store from '~/store';
import CommunityTab from './CommunityTab';
import ClassroomTab from './ClassroomTab';
import CalendarView from './CalendarView';
import MembersTab from './MembersTab';

interface AcademySidebarProps {
  onClose?: () => void;
}

const AcademySidebar: React.FC<AcademySidebarProps> = ({ onClose }) => {
  const localize = useLocalize();
  const [activeTab, setActiveTab] = useRecoilState(store.activeTab);
  const [panelWidth, setPanelWidth] = useRecoilState(store.panelWidth);
  const tabsRef = useRef<HTMLDivElement>(null);
  const isSmallScreen = useMediaQuery('(max-width: 768px)');
  
  // Load saved panel width and active tab from localStorage
  useEffect(() => {
    const savedWidth = localStorage.getItem('academyPanelWidth');
    if (savedWidth) {
      setPanelWidth(parseInt(savedWidth));
    }
    
    const savedTab = localStorage.getItem('academyActiveTab');
    if (savedTab === 'community' || savedTab === 'classroom' || savedTab === 'calendar' || savedTab === 'members') {
      setActiveTab(savedTab);
    }
  }, [setPanelWidth, setActiveTab]);
  
  // Save active tab when it changes
  useEffect(() => {
    localStorage.setItem('academyActiveTab', activeTab);
  }, [activeTab]);
  
  // Listen for storage events to switch tabs
  useEffect(() => {
    const handleStorageChange = () => {
      const savedTab = localStorage.getItem('academyActiveTab');
      if (savedTab === 'community' || savedTab === 'classroom' || savedTab === 'calendar' || savedTab === 'members' || savedTab === 'chats') {
        setActiveTab(savedTab);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [setActiveTab]);

  // Handle panel resizing (desktop only)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isSmallScreen) return; // Disable resizing on mobile
    
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = panelWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = startWidth + (e.clientX - startX);
      // Constrain width between 320px and 50% of viewport
      const constrainedWidth = Math.max(320, Math.min(newWidth, window.innerWidth * 0.5));
      setPanelWidth(constrainedWidth);
      localStorage.setItem('academyPanelWidth', constrainedWidth.toString());
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Set mobile-specific width
  const displayWidth = isSmallScreen ? '100%' : `${panelWidth}px`;

  return (
    <div 
      className={cn(
        "relative flex h-full bg-surface-primary",
        isSmallScreen && "fixed inset-0 z-50"
      )}
      style={{ width: displayWidth }}
    >
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-light px-3 py-2.5">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{localize('com_academy_title') || 'Academy'}</h2>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-surface-hover rounded-md transition-colors"
                aria-label="Collapse Academy panel"
                title="Collapse panel"
              >
                <PanelLeftClose className="w-3.5 h-3.5 text-text-secondary" />
              </button>
            )}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-surface-hover rounded-md transition-colors"
              aria-label="Close Academy"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tabs - horizontally scrollable */}
        <div 
          ref={tabsRef}
          className="relative border-b border-border-light overflow-x-auto"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'transparent transparent',
            WebkitOverflowScrolling: 'touch' // Smooth scrolling on iOS
          }}
          onMouseEnter={(e) => {
            if (e.currentTarget.scrollWidth > e.currentTarget.clientWidth) {
              e.currentTarget.style.scrollbarColor = 'var(--gray-400) transparent';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.scrollbarColor = 'transparent transparent';
          }}
        >
          <div className="flex min-w-max">
            <button
              onClick={() => setActiveTab('community')}
              className={cn(
                "flex-shrink-0 py-2 px-3 text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap",
                activeTab === 'community'
                  ? "text-text-primary border-b-2 border-green-500"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              <Users className="w-4 h-4 flex-shrink-0" />
              <span className={panelWidth < 400 ? "hidden sm:inline" : ""}>
                {localize('com_academy_community') || 'Community'}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('classroom')}
              className={cn(
                "flex-shrink-0 py-2 px-3 text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap",
                activeTab === 'classroom'
                  ? "text-text-primary border-b-2 border-green-500"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              <BookOpen className="w-4 h-4 flex-shrink-0" />
              <span className={panelWidth < 400 ? "hidden sm:inline" : ""}>
                {localize('com_academy_classroom') || 'Classroom'}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={cn(
                "flex-shrink-0 py-2 px-3 text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap",
                activeTab === 'calendar'
                  ? "text-text-primary border-b-2 border-green-500"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span className={panelWidth < 400 ? "hidden sm:inline" : ""}>
                Calendar
              </span>
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={cn(
                "flex-shrink-0 py-2 px-3 text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap",
                activeTab === 'members'
                  ? "text-text-primary border-b-2 border-green-500"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              <UserPlus className="w-4 h-4 flex-shrink-0" />
              <span className={panelWidth < 400 ? "hidden sm:inline" : ""}>
                Members
              </span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'community' ? (
            <CommunityTab />
          ) : activeTab === 'classroom' ? (
            <ClassroomTab />
          ) : activeTab === 'calendar' ? (
            <CalendarView />
          ) : (
            <MembersTab />
          )}
        </div>
      </div>

      {/* Resize Handle - Desktop only */}
      {!isSmallScreen && (
        <div
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-green-500 transition-colors flex items-center justify-center"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute right-0 h-full w-4 flex items-center justify-center">
            <GripVertical className="w-3 h-6 text-text-tertiary" />
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademySidebar;