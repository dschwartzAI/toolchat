import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface Conversation {
  id: string;
  unreadCount: number;
}

interface UseUnreadMessagesReturn {
  unreadCount: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useUnreadMessages = (enabled: boolean = true): UseUnreadMessagesReturn => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!enabled) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/lms/messages/conversations');
      const conversations: Conversation[] = response.data.conversations || [];
      
      // Calculate total unread count
      const total = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
      setUnreadCount(total);
    } catch (err) {
      console.error('Error fetching unread messages count:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch unread count'));
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    
    // Fetch immediately
    fetchUnreadCount();

    // Set up polling every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    // Clean up on unmount
    return () => clearInterval(interval);
  }, [fetchUnreadCount, enabled]);

  // Also refetch when window regains focus
  useEffect(() => {
    if (!enabled) return;
    
    const handleFocus = () => {
      fetchUnreadCount();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchUnreadCount, enabled]);

  return {
    unreadCount,
    loading,
    error,
    refetch: fetchUnreadCount,
  };
};

export default useUnreadMessages;