import React, { useState, useEffect, useRef } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import { useAuthContext, useToast } from '~/hooks';
import { useUpdateProfileMutation } from '~/data-provider/Auth/mutations';
import { Button } from '~/components/ui';
import { NotificationSeverity } from '~/common';

const ProfileEditor: React.FC = () => {
  const { user } = useAuthContext();
  const { showToast } = useToast();
  const [charCount, setCharCount] = useState(0);
  const hasInitialized = useRef(false);
  const isSaving = useRef(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    location: '',
    jobTitle: '',
    company: '',
  });

  // Use the standard mutation hook
  const profileMutation = useUpdateProfileMutation({
    onMutate: () => {
      // Mark that we're saving to prevent form resets
      isSaving.current = true;
    },
    onSuccess: (data) => {
      console.log('[ProfileEditor] Save successful, received data:', data);
      showToast({
        message: 'Profile updated successfully!',
        severity: NotificationSeverity.SUCCESS,
      });
      // Keep the saving flag true for a bit longer to handle the delayed invalidation
      setTimeout(() => {
        isSaving.current = false;
      }, 1000);
    },
    onError: (error: any) => {
      console.error('[ProfileEditor] Save failed:', error);
      isSaving.current = false;
      showToast({
        message: error?.message || 'Failed to update profile',
        severity: NotificationSeverity.ERROR,
      });
    },
  });

  // Initialize form with user data - only on mount or when user changes (not from our save)
  useEffect(() => {
    if (user && !hasInitialized.current) {
      console.log('[ProfileEditor] Initializing form with user data:', user);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        location: user.location || '',
        jobTitle: user.jobTitle || '',
        company: user.company || '',
      });
      setCharCount((user.bio || '').length);
      hasInitialized.current = true;
    } else if (user && hasInitialized.current && !isSaving.current) {
      // Only update if we're not currently saving (prevents snapback)
      console.log('[ProfileEditor] User data changed, but not updating form (isSaving:', isSaving.current, ')');
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'bio') {
      // Enforce 500 character limit for bio
      if (value.length <= 500) {
        setFormData(prev => ({ ...prev, [name]: value }));
        setCharCount(value.length);
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[ProfileEditor] Submitting form with data:', formData);
    profileMutation.mutate(formData);
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
      <h3 className="text-base font-semibold mb-4">Profile Information</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name and Email row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Your name"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="your@email.com"
            />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium mb-1">
            Bio
            <span className="ml-2 text-xs text-gray-500">
              ({charCount}/500 characters)
            </span>
          </label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            placeholder="Tell others about yourself..."
          />
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium mb-1">
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="City, Country"
          />
        </div>

        {/* Job Title and Company row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="jobTitle" className="block text-sm font-medium mb-1">
              Job Title
            </label>
            <input
              type="text"
              id="jobTitle"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Product Manager"
            />
          </div>
          
          <div>
            <label htmlFor="company" className="block text-sm font-medium mb-1">
              Company
            </label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Acme Inc."
            />
          </div>
        </div>

        {/* Error message */}
        {profileMutation.isError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">
              {(profileMutation.error as any)?.message || 'Failed to update profile'}
            </span>
          </div>
        )}

        {/* Submit button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={profileMutation.isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {profileMutation.isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Profile
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProfileEditor;