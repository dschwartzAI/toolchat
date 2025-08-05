import React, { useState } from 'react';
import { PlayCircle, FileText, Clock, Users, ChevronRight } from 'lucide-react';
import ModuleViewer from './ModuleViewer';
import { useGetModulesQuery } from '~/data-provider/Academy';
import { cn } from '~/utils';
import type { TModule } from '~/data-provider/Academy/types';

const ClassroomTab: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<TModule | null>(null);
  
  const { data: modulesData, isLoading } = useGetModulesQuery();
  const modules = modulesData?.modules || [];

  const handleModuleClick = (module: TModule) => {
    setSelectedModule(module);
  };

  const handleBackToModules = () => {
    setSelectedModule(null);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} min`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (selectedModule) {
    return (
      <ModuleViewer 
        module={selectedModule} 
        onBack={handleBackToModules}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border-light">
        <h2 className="text-xl font-semibold text-text-primary">Training Modules</h2>
        <p className="text-sm text-text-secondary mt-1">
          Access all of James' training modules to build your sovereign business
        </p>
      </div>

      {/* Module Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {modules.map((module) => (
            <div
              key={module._id}
              onClick={() => handleModuleClick(module)}
              className="bg-surface-secondary rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group"
            >
              {/* Module Thumbnail */}
              <div className="relative aspect-video bg-surface-tertiary overflow-hidden">
                {module.thumbnail ? (
                  <img 
                    src={module.thumbnail} 
                    alt={module.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      if (target.nextElementSibling) {
                        (target.nextElementSibling as HTMLElement).style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div 
                  className={cn(
                    "absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-center",
                    module.thumbnail ? "hidden" : "flex"
                  )}
                  style={{ display: module.thumbnail ? 'none' : 'flex' }}
                >
                  <PlayCircle className="w-12 h-12 text-white/80" />
                </div>
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-white/10 backdrop-blur-sm rounded-full p-3">
                    <ChevronRight className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>

              {/* Module Info */}
              <div className="p-4">
                <h3 className="font-medium text-text-primary line-clamp-2 mb-2">
                  {module.title}
                </h3>
                {module.description && (
                  <p className="text-sm text-text-secondary line-clamp-2">
                    {module.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClassroomTab;