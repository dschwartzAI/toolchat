import React, { useState } from 'react';
import { Plus, Edit, Trash, Eye, Upload, GripVertical, MoreVertical } from 'lucide-react';
import { SystemRoles } from 'librechat-data-provider';
import { cn } from '~/utils';
import { 
  Button, 
  Table, 
  Switch,
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Textarea,
  Label
} from '~/components/ui';
import { useLocalize, useAuthContext } from '~/hooks';
import { useToastContext } from '~/Providers';
import { useQuery } from '@tanstack/react-query';
import {
  useGetModulesQuery,
  useCreateModuleMutation,
  useUpdateModuleMutation,
  useDeleteModuleMutation,
  useRestoreModuleMutation,
  useReorderModulesMutation,
  useUploadThumbnailMutation,
  useBulkPublishMutation
} from '~/data-provider/Academy/moduleMutations';
import type { TModule } from '~/data-provider/Academy/types';

export default function ModuleManager() {
  const localize = useLocalize();
  const { user } = useAuthContext();
  const { showToast } = useToastContext();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingModule, setEditingModule] = useState<TModule | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [draggedModule, setDraggedModule] = useState<TModule | null>(null);
  
  // Queries and mutations
  const { data, isLoading, refetch } = useQuery(useGetModulesQuery(showDeleted));
  const createMutation = useCreateModuleMutation();
  const updateMutation = useUpdateModuleMutation();
  const deleteMutation = useDeleteModuleMutation();
  const restoreMutation = useRestoreModuleMutation();
  const reorderMutation = useReorderModulesMutation();
  const uploadThumbnailMutation = useUploadThumbnailMutation();
  const bulkPublishMutation = useBulkPublishMutation();
  
  const modules = data?.modules || [];
  const isAdmin = user?.role === SystemRoles.ADMIN;
  
  if (!isAdmin) {
    return (
      <div className="p-6 text-center">
        <p className="text-text-secondary">{localize('com_academy_admin_only')}</p>
      </div>
    );
  }
  
  const handleCreateModule = async (moduleData: Partial<TModule>) => {
    try {
      await createMutation.mutateAsync(moduleData);
      showToast({ message: localize('com_academy_module_created'), status: 'success' });
      setShowCreateDialog(false);
      refetch();
    } catch (error) {
      showToast({ message: localize('com_academy_create_failed'), status: 'error' });
    }
  };
  
  const handleUpdateModule = async (moduleId: string, updates: Partial<TModule>) => {
    try {
      await updateMutation.mutateAsync({ moduleId, updates });
      showToast({ message: localize('com_academy_module_updated'), status: 'success' });
      setEditingModule(null);
      refetch();
    } catch (error) {
      showToast({ message: localize('com_academy_update_failed'), status: 'error' });
    }
  };
  
  const handleDeleteModule = async (moduleId: string) => {
    if (confirm(localize('com_academy_confirm_delete_module'))) {
      try {
        await deleteMutation.mutateAsync(moduleId);
        showToast({ message: localize('com_academy_module_deleted'), status: 'success' });
        refetch();
      } catch (error) {
        showToast({ message: localize('com_academy_delete_failed'), status: 'error' });
      }
    }
  };
  
  const handleRestoreModule = async (moduleId: string) => {
    try {
      await restoreMutation.mutateAsync(moduleId);
      showToast({ message: localize('com_academy_module_restored'), status: 'success' });
      refetch();
    } catch (error) {
      showToast({ message: localize('com_academy_restore_failed'), status: 'error' });
    }
  };
  
  const handleReorderModules = async () => {
    const moduleOrders = modules.map((module, index) => ({
      moduleId: module._id,
      order: index
    }));
    
    try {
      await reorderMutation.mutateAsync(moduleOrders);
      showToast({ message: localize('com_academy_modules_reordered'), status: 'success' });
    } catch (error) {
      showToast({ message: localize('com_academy_reorder_failed'), status: 'error' });
    }
  };
  
  const handleUploadThumbnail = async (moduleId: string, file: File) => {
    try {
      await uploadThumbnailMutation.mutateAsync({ moduleId, file });
      showToast({ message: localize('com_academy_thumbnail_uploaded'), status: 'success' });
      refetch();
    } catch (error) {
      showToast({ message: localize('com_academy_upload_failed'), status: 'error' });
    }
  };
  
  const handleBulkPublish = async (isPublished: boolean) => {
    if (selectedModules.length === 0) {
      showToast({ message: localize('com_academy_select_modules'), status: 'warning' });
      return;
    }
    
    try {
      await bulkPublishMutation.mutateAsync({ moduleIds: selectedModules, isPublished });
      showToast({ 
        message: isPublished 
          ? localize('com_academy_modules_published') 
          : localize('com_academy_modules_unpublished'), 
        status: 'success' 
      });
      setSelectedModules([]);
      refetch();
    } catch (error) {
      showToast({ message: localize('com_academy_bulk_action_failed'), status: 'error' });
    }
  };
  
  const handleDragStart = (e: React.DragEvent, module: TModule) => {
    setDraggedModule(module);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDrop = (e: React.DragEvent, targetModule: TModule) => {
    e.preventDefault();
    if (!draggedModule || draggedModule._id === targetModule._id) return;
    
    const draggedIndex = modules.findIndex(m => m._id === draggedModule._id);
    const targetIndex = modules.findIndex(m => m._id === targetModule._id);
    
    const newModules = [...modules];
    newModules.splice(draggedIndex, 1);
    newModules.splice(targetIndex, 0, draggedModule);
    
    // Update local state immediately for better UX
    // Then sync with server
    handleReorderModules();
    setDraggedModule(null);
  };
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">
          {localize('com_academy_manage_modules')}
        </h1>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <Switch 
              checked={showDeleted}
              onCheckedChange={setShowDeleted}
            />
            {localize('com_academy_show_deleted')}
          </label>
          {selectedModules.length > 0 && (
            <div className="flex gap-2">
              <Button 
                onClick={() => handleBulkPublish(true)}
                variant="submit" 
                size="sm"
              >
                {localize('com_academy_publish_selected')}
              </Button>
              <Button 
                onClick={() => handleBulkPublish(false)}
                variant="cancel" 
                size="sm"
              >
                {localize('com_academy_unpublish_selected')}
              </Button>
            </div>
          )}
          <Button 
            onClick={() => setShowCreateDialog(true)}
            variant="submit" 
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            {localize('com_academy_create_module')}
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <thead>
            <tr className="border-b">
              <th className="px-4 py-3 w-8">
                <input
                  type="checkbox"
                  checked={selectedModules.length === modules.length && modules.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedModules(modules.map(m => m._id));
                    } else {
                      setSelectedModules([]);
                    }
                  }}
                />
              </th>
              <th className="px-4 py-3 w-8"></th>
              <th className="px-4 py-3 text-left">{localize('com_academy_module')}</th>
              <th className="px-4 py-3 text-left">{localize('com_academy_video')}</th>
              <th className="px-4 py-3 text-left">{localize('com_academy_resources')}</th>
              <th className="px-4 py-3 text-left">{localize('com_academy_status')}</th>
              <th className="px-4 py-3 text-left">{localize('com_academy_order')}</th>
              <th className="px-4 py-3 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="text-center py-8">
                  <span className="text-text-secondary">Loading...</span>
                </td>
              </tr>
            ) : modules.length > 0 ? (
              modules.map((module) => (
                <tr 
                  key={module._id} 
                  className={cn(
                    "border-b hover:bg-surface-hover",
                    module.deletedAt && "opacity-50 bg-red-50 dark:bg-red-900/10"
                  )}
                  draggable={!module.deletedAt}
                  onDragStart={(e) => handleDragStart(e, module)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, module)}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedModules.includes(module._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedModules([...selectedModules, module._id]);
                        } else {
                          setSelectedModules(selectedModules.filter(id => id !== module._id));
                        }
                      }}
                      disabled={!!module.deletedAt}
                    />
                  </td>
                  <td className="px-4 py-3">
                    {!module.deletedAt && (
                      <GripVertical className="h-4 w-4 text-text-secondary cursor-move" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {module.thumbnail ? (
                        <img
                          src={module.thumbnail}
                          alt={module.title}
                          className="h-12 w-12 rounded object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded bg-surface-tertiary flex items-center justify-center">
                          <Upload className="h-5 w-5 text-text-secondary" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-text-primary">{module.title}</div>
                        <div className="text-sm text-text-secondary line-clamp-1">
                          {module.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm">
                      {module.videoUrl ? localize('com_ui_yes') : localize('com_ui_no')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm">
                      {module.resources?.length || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {module.deletedAt ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                        {localize('com_academy_deleted')}
                      </span>
                    ) : (
                      <span className={cn(
                        'px-2 py-1 text-xs rounded-full',
                        module.isPublished
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                      )}>
                        {module.isPublished ? localize('com_academy_published') : localize('com_academy_draft')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm">{module.order}</span>
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {module.deletedAt ? (
                          <DropdownMenuItem onClick={() => handleRestoreModule(module._id)}>
                            {localize('com_academy_restore')}
                          </DropdownMenuItem>
                        ) : (
                          <>
                            <DropdownMenuItem onClick={() => setEditingModule(module)}>
                              <Edit className="h-4 w-4 mr-2" />
                              {localize('com_ui_edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.onchange = (e) => {
                                  const file = (e.target as HTMLInputElement).files?.[0];
                                  if (file) handleUploadThumbnail(module._id, file);
                                };
                                input.click();
                              }}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              {localize('com_academy_upload_thumbnail')}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteModule(module._id)}
                              className="text-red-600"
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              {localize('com_ui_delete')}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-8">
                  <span className="text-text-secondary">{localize('com_academy_no_modules')}</span>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog || !!editingModule} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setEditingModule(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingModule ? localize('com_academy_edit_module') : localize('com_academy_create_module')}
            </DialogTitle>
          </DialogHeader>
          <ModuleForm
            module={editingModule}
            onSubmit={(data) => {
              if (editingModule) {
                handleUpdateModule(editingModule._id, data);
              } else {
                handleCreateModule(data);
              }
            }}
            onCancel={() => {
              setShowCreateDialog(false);
              setEditingModule(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Module Form Component
interface ModuleFormProps {
  module?: TModule | null;
  onSubmit: (data: Partial<TModule>) => void;
  onCancel: () => void;
}

function ModuleForm({ module, onSubmit, onCancel }: ModuleFormProps) {
  const localize = useLocalize();
  const [formData, setFormData] = useState<Partial<TModule>>({
    title: module?.title || '',
    description: module?.description || '',
    videoUrl: module?.videoUrl || '',
    textContent: module?.textContent || { header: '', subtext: '' },
    transcript: module?.transcript || '',
    isPublished: module?.isPublished || false,
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>{localize('com_academy_title')}</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>
      
      <div>
        <Label>{localize('com_academy_description')}</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>
      
      <div>
        <Label>{localize('com_academy_video_url')}</Label>
        <Input
          value={formData.videoUrl}
          onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
          placeholder="https://youtube.com/embed/..."
        />
      </div>
      
      <div>
        <Label>{localize('com_academy_text_header')}</Label>
        <Input
          value={formData.textContent?.header}
          onChange={(e) => setFormData({ 
            ...formData, 
            textContent: { ...formData.textContent, header: e.target.value, subtext: formData.textContent?.subtext || '' }
          })}
        />
      </div>
      
      <div>
        <Label>{localize('com_academy_text_content')}</Label>
        <Textarea
          value={formData.textContent?.subtext}
          onChange={(e) => setFormData({ 
            ...formData, 
            textContent: { ...formData.textContent, subtext: e.target.value, header: formData.textContent?.header || '' }
          })}
          rows={4}
        />
      </div>
      
      <div>
        <Label>{localize('com_academy_transcript')}</Label>
        <Textarea
          value={formData.transcript}
          onChange={(e) => setFormData({ ...formData, transcript: e.target.value })}
          rows={4}
        />
      </div>
      
      <div className="flex items-center gap-2">
        <Switch
          checked={formData.isPublished}
          onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
        />
        <Label>{localize('com_academy_publish_module')}</Label>
      </div>
      
      <DialogFooter>
        <Button type="button" variant="cancel" onClick={onCancel}>
          {localize('com_ui_cancel')}
        </Button>
        <Button type="submit" variant="submit">
          {module ? localize('com_ui_save') : localize('com_ui_create')}
        </Button>
      </DialogFooter>
    </form>
  );
}