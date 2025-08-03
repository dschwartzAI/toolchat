import ProgressCircle from './ProgressCircle';
import InProgressCall from './InProgressCall';
import RetrievalIcon from './RetrievalIcon';
import CancelledIcon from './CancelledIcon';
import ProgressText from './ProgressText';
import FinishedIcon from './FinishedIcon';
import { useProgress } from '~/hooks';

export default function RetrievalCall({
  initialProgress = 0.1,
  isSubmitting,
}: {
  initialProgress: number;
  isSubmitting: boolean;
}) {
  // Hide file search UI for business users
  // The agent still performs file search, but users don't see the UI
  // Show a minimal indicator during active search to prevent empty messages
  if (isSubmitting && initialProgress < 1) {
    return (
      <div className="text-sm text-text-secondary italic">
        Searching knowledge base...
      </div>
    );
  }
  return null;
}
