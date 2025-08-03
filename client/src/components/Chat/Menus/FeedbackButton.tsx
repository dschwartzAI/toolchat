import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useLocalize, useMediaQuery } from '~/hooks';
import FeedbackModal from '~/components/Feedback/FeedbackModal';

const FeedbackButton: React.FC = () => {
  const localize = useLocalize();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 640px)');

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        title={localize('com_ui_feedback')}
        aria-label={localize('com_ui_feedback')}
        data-tour="feedback-button"
      >
        {isMobile ? (
          <MessageSquare className="h-4 w-4" />
        ) : (
          <>
            <MessageSquare className="mr-2 h-4 w-4" />
            {localize('com_ui_feedback')}
          </>
        )}
      </button>
      
      <FeedbackModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};

export default FeedbackButton;