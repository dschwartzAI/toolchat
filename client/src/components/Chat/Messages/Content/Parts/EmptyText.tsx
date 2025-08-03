import { memo } from 'react';
import ThinkingIndicator from '../ThinkingIndicator';

const EmptyTextPart = memo(() => {
  return (
    <div className="text-message mb-[0.625rem] flex min-h-[20px] flex-col items-start gap-3 overflow-visible">
      <div className="thinking-indicator-wrapper">
        <ThinkingIndicator variant="dots" size="md" />
      </div>
    </div>
  );
});

export default EmptyTextPart;
