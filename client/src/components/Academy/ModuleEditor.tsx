import React, { useState } from 'react';
import { ArrowLeft, Save, X, Upload } from 'lucide-react';
import { Button, Input, Textarea, Label, Switch } from '~/components/ui';
import { useCreateModuleMutation, useUpdateModuleMutation } from '~/data-provider/Academy';
import { useToastContext } from '~/Providers';
import { useLocalize } from '~/hooks';
import type { TModule } from '~/data-provider/Academy/types';

interface ModuleEditorProps {
  module?: TModule | null;
  onSave: () => void;
  onCancel: () => void;
}

const ModuleEditor: React.FC<ModuleEditorProps> = ({ module, onSave, onCancel }) => {
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const createModule = useCreateModuleMutation();
  const updateModule = useUpdateModuleMutation();
  
  const [formData, setFormData] = useState({
    title: module?.title || '',
    description: module?.description || '',
    videoUrl: module?.videoUrl || '',
    textContent: module?.textContent || { header: '', subtext: '' },
    transcript: module?.transcript || '',
    thumbnail: module?.thumbnail || '',
    isPublished: module?.isPublished || false,
    resources: module?.resources || [],
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      showToast({ message: 'Title is required', status: 'error' });
      return;
    }

    setIsSaving(true);
    
    try {
      if (module) {
        await updateModule.mutateAsync({
          moduleId: module._id,
          updates: formData,
        });
        showToast({ message: 'Module updated successfully', status: 'success' });
      } else {
        await createModule.mutateAsync(formData);
        showToast({ message: 'Module created successfully', status: 'success' });
      }
      onSave();
    } catch (error) {
      showToast({ 
        message: module ? 'Failed to update module' : 'Failed to create module', 
        status: 'error' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddResource = () => {
    setFormData({
      ...formData,
      resources: [...formData.resources, { title: '', url: '' }],
    });
  };

  const handleRemoveResource = (index: number) => {
    setFormData({
      ...formData,
      resources: formData.resources.filter((_, i) => i !== index),
    });
  };

  const handleResourceChange = (index: number, field: 'title' | 'url', value: string) => {
    const newResources = [...formData.resources];
    newResources[index] = { ...newResources[index], [field]: value };
    setFormData({ ...formData, resources: newResources });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-light">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold text-text-primary">
            {module ? 'Edit Module' : 'Create Module'}
          </h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="cancel"
            onClick={onCancel}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            variant="submit"
            onClick={handleSubmit}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="required">
                {localize('com_academy_title')}
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter module title"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">
                {localize('com_academy_description')}
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter module description"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="thumbnail">
                Thumbnail URL
              </Label>
              <Input
                id="thumbnail"
                value={formData.thumbnail}
                onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <Label htmlFor="videoUrl">
                Video URL
              </Label>
              <Input
                id="videoUrl"
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                placeholder="https://vimeo.com/123456789 or https://youtube.com/watch?v=..."
              />
              <p className="mt-1 text-xs text-text-tertiary">
                Supports Vimeo and YouTube URLs. Just paste the regular video URL - it will be automatically converted.
              </p>
            </div>
          </div>

          {/* Text Content */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-text-primary">Text Content</h3>
            
            <div>
              <Label htmlFor="header">
                Header
              </Label>
              <Input
                id="header"
                value={formData.textContent.header}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  textContent: { ...formData.textContent, header: e.target.value }
                })}
                placeholder="Enter header text"
              />
            </div>

            <div>
              <Label htmlFor="subtext">
                Content
              </Label>
              <Textarea
                id="subtext"
                value={formData.textContent.subtext}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  textContent: { ...formData.textContent, subtext: e.target.value }
                })}
                placeholder="Enter module content"
                rows={6}
              />
            </div>
          </div>

          {/* Transcript */}
          <div>
            <Label htmlFor="transcript">
              Transcript
            </Label>
            <Textarea
              id="transcript"
              value={formData.transcript}
              onChange={(e) => setFormData({ ...formData, transcript: e.target.value })}
              placeholder="Enter video transcript"
              rows={6}
            />
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-text-primary">Resources</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddResource}
              >
                Add Resource
              </Button>
            </div>
            
            {formData.resources.map((resource, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={resource.title}
                  onChange={(e) => handleResourceChange(index, 'title', e.target.value)}
                  placeholder="Resource title"
                  className="flex-1"
                />
                <Input
                  value={resource.url}
                  onChange={(e) => handleResourceChange(index, 'url', e.target.value)}
                  placeholder="Resource URL"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="cancel"
                  size="icon"
                  onClick={() => handleRemoveResource(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Publish Status */}
          <div className="flex items-center gap-3">
            <Switch
              checked={formData.isPublished}
              onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
            />
            <Label>
              Publish Module
            </Label>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModuleEditor;