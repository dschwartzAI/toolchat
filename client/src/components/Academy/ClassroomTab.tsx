import React, { useState, useEffect } from 'react';
import { PlayCircle, FileText, Clock, Users, ChevronRight, Plus, Edit, Trash, MoreVertical } from 'lucide-react';
import { SystemRoles } from 'librechat-data-provider';
import ModuleViewer from './ModuleViewer';
import ModuleEditor from './ModuleEditor';
import { useGetModulesQuery, useDeleteModuleMutation } from '~/data-provider/Academy';
import { useAuthContext } from '~/hooks';
import { useToastContext } from '~/Providers';
import { cn } from '~/utils';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '~/components/ui';
import type { TModule } from '~/data-provider/Academy/types';

const ClassroomTab: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<TModule | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(() => {
    return localStorage.getItem('academySelectedModuleId');
  });
  const [editingModule, setEditingModule] = useState<TModule | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const { user } = useAuthContext();
  const { showToast } = useToastContext();
  const { data: modulesData, isLoading, refetch } = useGetModulesQuery();
  const deleteModule = useDeleteModuleMutation();
  
  const modules = modulesData?.modules || [];
  const isAdmin = user?.role === SystemRoles.ADMIN;
  
  // Restore selected module from localStorage when modules load
  useEffect(() => {
    if (selectedModuleId && modules.length > 0 && !selectedModule) {
      const module = modules.find(m => m._id === selectedModuleId);
      if (module) {
        setSelectedModule(module);
      }
    }
  }, [selectedModuleId, modules, selectedModule]);
  
  // Save selected module ID to localStorage
  useEffect(() => {
    if (selectedModule) {
      localStorage.setItem('academySelectedModuleId', selectedModule._id);
    } else {
      localStorage.removeItem('academySelectedModuleId');
    }
  }, [selectedModule]);

  const handleModuleClick = (module: TModule) => {
    setSelectedModule(module);
    setSelectedModuleId(module._id);
  };

  const handleBackToModules = () => {
    setSelectedModule(null);
    setSelectedModuleId(null);
  };

  const handleEdit = (e: React.MouseEvent, module: TModule) => {
    e.stopPropagation();
    setEditingModule(module);
  };

  const handleDelete = async (e: React.MouseEvent, module: TModule) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${module.title}"?`)) return;
    
    try {
      await deleteModule.mutateAsync(module._id);
      showToast({ message: 'Module deleted successfully', status: 'success' });
      refetch();
    } catch (error) {
      showToast({ message: 'Failed to delete module', status: 'error' });
    }
  };

  const handleSave = () => {
    setEditingModule(null);
    setIsCreating(false);
    refetch();
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

  if (editingModule || isCreating) {
    return (
      <ModuleEditor
        module={editingModule}
        onSave={handleSave}
        onCancel={() => {
          setEditingModule(null);
          setIsCreating(false);
        }}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border-light">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Training Modules</h2>
            <p className="text-sm text-text-secondary mt-1">
              Access all of James' training modules to build your sovereign business
            </p>
          </div>
          {isAdmin && (
            <Button
              onClick={() => setIsCreating(true)}
              className="gap-2"
              variant="submit"
            >
              <Plus className="w-4 h-4" />
              Add Module
            </Button>
          )}
        </div>
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
                {/* Admin controls */}
                {isAdmin && (
                  <div className="absolute top-2 right-2 z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => handleEdit(e as any, module)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => handleDelete(e as any, module)}
                          className="text-red-600"
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
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
                  style={{ display: module.thumbnail ? 'block' : 'none' }}
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
