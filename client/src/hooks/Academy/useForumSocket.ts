import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from '~/mocks/socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '~/hooks/AuthContext';
import { useToastContext } from '~/Providers';
import { QueryKeys } from 'librechat-data-provider';
import type { ForumPost, ForumReply } from '~/data-provider/Academy/types';

interface UseForumSocketOptions {
  onNewPost?: (post: ForumPost) => void;
  onPostUpdate?: (postId: string, updates: Partial<ForumPost>) => void;
  onNewReply?: (postId: string, reply: ForumReply) => void;
  onReplyUpdate?: (replyId: string, updates: Partial<ForumReply>) => void;
  onUserTyping?: (data: { postId: string; userId: string; userName: string }) => void;
}

export const useForumSocket = (options: UseForumSocketOptions = {}) => {
  const socketRef = useRef<Socket | null>(null);
  const { token, user } = useAuthContext();
  const { showToast } = useToastContext();
  const queryClient = useQueryClient();
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!token || socketRef.current?.connected) return;

    const socket = io(window.location.origin, {
      path: '/ws/forum',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    // Connection events
    socket.on('connect', () => {
      console.log('Forum socket connected');
      reconnectAttemptsRef.current = 0;
      
      // Join user's rooms
      if (user?._id) {
        socket.emit('join:user', user._id);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('Forum socket connection error:', error);
      reconnectAttemptsRef.current++;
      
      if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        showToast({
          message: 'Unable to connect to forum updates. Please refresh the page.',
          status: 'error'
        });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('Forum socket disconnected:', reason);
    });

    // Forum events
    socket.on('post:new', (post: ForumPost) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries([QueryKeys.academyForumPosts]);
      
      if (options.onNewPost) {
        options.onNewPost(post);
      }
    });

    socket.on('post:update', ({ postId, updates }: { postId: string; updates: Partial<ForumPost> }) => {
      // Update specific post query
      queryClient.setQueryData(
        [QueryKeys.academyForumPost, postId],
        (oldData: ForumPost | undefined) => {
          if (!oldData) return oldData;
          return { ...oldData, ...updates };
        }
      );
      
      // Invalidate list queries
      queryClient.invalidateQueries([QueryKeys.academyForumPosts]);
      
      if (options.onPostUpdate) {
        options.onPostUpdate(postId, updates);
      }
    });

    socket.on('reply:new', ({ postId, reply }: { postId: string; reply: ForumReply }) => {
      // Update post with new reply
      queryClient.setQueryData(
        [QueryKeys.academyForumPost, postId],
        (oldData: ForumPost | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            replies: [...(oldData.replies || []), reply],
            replyCount: (oldData.replyCount || 0) + 1
          };
        }
      );
      
      if (options.onNewReply) {
        options.onNewReply(postId, reply);
      }
    });

    socket.on('reply:update', ({ replyId, updates }: { replyId: string; updates: Partial<ForumReply> }) => {
      // Find and update reply in cached posts
      const updateReplyInPost = (post: ForumPost): ForumPost => {
        const updateReplyRecursive = (replies: ForumReply[]): ForumReply[] => {
          return replies.map(reply => {
            if (reply._id === replyId) {
              return { ...reply, ...updates };
            }
            if (reply.replies) {
              return { ...reply, replies: updateReplyRecursive(reply.replies) };
            }
            return reply;
          });
        };

        if (post.replies) {
          return { ...post, replies: updateReplyRecursive(post.replies) };
        }
        return post;
      };

      // Update all cached posts that might contain this reply
      queryClient.setQueriesData(
        { queryKey: [QueryKeys.academyForumPost] },
        (oldData: ForumPost | undefined) => {
          if (!oldData) return oldData;
          return updateReplyInPost(oldData);
        }
      );
      
      if (options.onReplyUpdate) {
        options.onReplyUpdate(replyId, updates);
      }
    });

    socket.on('typing:start', (data: { postId: string; userId: string; userName: string }) => {
      if (options.onUserTyping && data.userId !== user?._id) {
        options.onUserTyping(data);
      }
    });

    socketRef.current = socket;
  }, [token, user, queryClient, showToast, options]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const joinPost = useCallback((postId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join:post', postId);
    }
  }, []);

  const leavePost = useCallback((postId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave:post', postId);
    }
  }, []);

  const emitTyping = useCallback((postId: string) => {
    if (socketRef.current?.connected && user) {
      socketRef.current.emit('typing:start', {
        postId,
        userId: user._id,
        userName: user.name || 'Anonymous'
      });
    }
  }, [user]);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false,
    joinPost,
    leavePost,
    emitTyping
  };
};