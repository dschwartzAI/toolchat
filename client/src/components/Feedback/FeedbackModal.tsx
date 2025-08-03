import React, { useState } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { useAuthContext, useLocalize } from '~/hooks';
import { useToastContext } from '~/Providers';
import { Dialog, DialogContent } from '~/components/ui';
import { Button } from '~/components/ui/Button';
import { Label } from '~/components/ui/Label';
import { Textarea } from '~/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/Select';
import { Input } from '~/components/ui/Input';
import { request } from 'librechat-data-provider';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const localize = useLocalize();
  const { user } = useAuthContext();
  const { showToast } = useToastContext();
  
  const [category, setCategory] = useState<string>('general');
  const [feedback, setFeedback] = useState<string>('');
  const [email, setEmail] = useState<string>(user?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      showToast({
        message: localize('com_ui_feedback_error_empty'),
        status: 'error',
      });
      return;
    }

    if (feedback.length > 5000) {
      showToast({
        message: localize('com_ui_feedback_error_too_long'),
        status: 'error',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await request.post('/api/feedback', {
        category,
        feedback: feedback.trim(),
        email: email.trim() || undefined,
      });

      console.log('Feedback response:', response);

      if (response && response.success) {
        showToast({
          message: response.message || localize('com_ui_feedback_success'),
          status: 'success',
        });
        
        // Reset form and close modal
        setFeedback('');
        setCategory('general');
        onClose();
      } else if (response && response.error) {
        throw new Error(response.error);
      } else {
        // If we get here, we probably got HTML instead of JSON
        console.error('Unexpected response format:', response);
        throw new Error('Failed to submit feedback - server error');
      }
    } catch (error: any) {
      console.error('Feedback submission error:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      
      // Check if it's a network error
      if (!error.response) {
        showToast({
          message: 'Network error: Unable to connect to server',
          status: 'error',
        });
      } else {
        showToast({
          message: error.response?.data?.error || error.message || localize('com_ui_feedback_error_submit'),
          status: 'error',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] p-0 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" showCloseButton={false}>
        <div className="p-6 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-600 pb-3">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{localize('com_ui_feedback_title')}</h3>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-lg p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label={localize('com_ui_close')}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="category" className="mb-2 block text-gray-700 dark:text-gray-300">
              {localize('com_ui_feedback_category')}
            </Label>
            <Select value={category} onValueChange={setCategory} disabled={isSubmitting}>
              <SelectTrigger id="category" className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[1000] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600" position="popper" sideOffset={5}>
                <SelectItem value="bug">{localize('com_ui_feedback_category_bug')}</SelectItem>
                <SelectItem value="feature">{localize('com_ui_feedback_category_feature')}</SelectItem>
                <SelectItem value="general">{localize('com_ui_feedback_category_general')}</SelectItem>
                <SelectItem value="other">{localize('com_ui_feedback_category_other')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="feedback" className="mb-2 block text-gray-700 dark:text-gray-300">
              {localize('com_ui_feedback_message')} <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={localize('com_ui_feedback_placeholder')}
              rows={5}
              maxLength={5000}
              disabled={isSubmitting}
              className="resize-none bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {feedback.length}/5000 {localize('com_ui_characters')}
            </p>
          </div>

          <div>
            <Label htmlFor="email" className="mb-2 block text-gray-700 dark:text-gray-300">
              {localize('com_ui_feedback_email_optional')}
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={localize('com_ui_feedback_email_placeholder')}
              disabled={isSubmitting}
              className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {localize('com_ui_feedback_email_help')}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {localize('com_ui_cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !feedback.trim()}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {localize('com_ui_submitting')}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  {localize('com_ui_submit')}
                </>
              )}
            </Button>
          </div>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackModal;