import React, { useEffect } from 'react';
import { Users, BookOpen, Calendar, X, GripVertical } from 'lucide-react';
import { useRecoilState } from 'recoil';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';
import store from '~/store';
import CommunityTab from './CommunityTab';
import ClassroomTab from './ClassroomTab';
import CalendarView from './CalendarView';

interface AcademySidebarProps {
  onClose?: () => void;
}

const AcademySidebar: React.FC<AcademySidebarProps> = ({ onClose }) => {
  const localize = useLocalize();
  const [activeTab, setActiveTab] = useRecoilState(store.activeTab);
  const [panelWidth, setPanelWidth] = useRecoilState(store.panelWidth);
  
  // Load saved panel width and active tab from localStorage
  useEffect(() => {
    const savedWidth = localStorage.getItem('academyPanelWidth');
    if (savedWidth) {
      setPanelWidth(parseInt(savedWidth));
    }
    
    const savedTab = localStorage.getItem('academyActiveTab');
    if (savedTab === 'community' || savedTab === 'classroom' || savedTab === 'calendar') {
      setActiveTab(savedTab);
    }
  }, [setPanelWidth, setActiveTab]);
  
  // Save active tab when it changes
  useEffect(() => {
    localStorage.setItem('academyActiveTab', activeTab);
  }, [activeTab]);

  // Handle panel resizing
  const handleMouseDown = (e: React.MouseEvent) => {
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

  return (
    <div 
      className="relative flex h-full bg-surface-primary"
      style={{ width: `${panelWidth}px` }}
    >
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-light px-4 py-3">
          <h2 className="text-lg font-semibold">{localize('com_academy_title') || 'Academy'}</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-surface-hover rounded-lg transition-colors"
              aria-label="Close Academy"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-light">
          <button
            onClick={() => setActiveTab('community')}
            className={cn(
              "flex-1 py-2 px-3 text-sm font-medium transition-colors flex items-center justify-center gap-1.5",
              activeTab === 'community'
                ? "text-text-primary border-b-2 border-green-500"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            <Users className="w-4 h-4" />
            {localize('com_academy_community') || 'Community'}
          </button>
          <button
            onClick={() => setActiveTab('classroom')}
            className={cn(
              "flex-1 py-2 px-3 text-sm font-medium transition-colors flex items-center justify-center gap-1.5",
              activeTab === 'classroom'
                ? "text-text-primary border-b-2 border-green-500"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            <BookOpen className="w-4 h-4" />
            {localize('com_academy_classroom') || 'Classroom'}
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={cn(
              "flex-1 py-2 px-3 text-sm font-medium transition-colors flex items-center justify-center gap-1.5",
              activeTab === 'calendar'
                ? "text-text-primary border-b-2 border-green-500"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            <Calendar className="w-4 h-4" />
            Calendar
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'community' ? (
            <CommunityTab />
          ) : activeTab === 'classroom' ? (
            <ClassroomTab />
          ) : (
            <CalendarView />
          )}
        </div>
      </div>

      {/* Resize Handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-green-500 transition-colors flex items-center justify-center"
        onMouseDown={handleMouseDown}
      >
        <div className="absolute right-0 h-full w-4 flex items-center justify-center">
          <GripVertical className="w-3 h-6 text-text-tertiary" />
        </div>
      </div>
    </div>
  );
};

export default AcademySidebar;