import { useState, useEffect } from 'react';

export type Member = {
  id: string;
  name: string;
  username?: string;
  avatarUrl: string;
  bio?: string;
  location?: string;
};

export type MembersResponse = {
  members: Member[];
};

/**
 * Simple hook to fetch members - no React Query for MVP
 */
export const useGetMembers = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        // Get the token from localStorage (LibreChat stores it there)
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const response = await fetch('/api/lms/members', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Server returned non-JSON response');
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch members: ${response.status}`);
        }

        const data: MembersResponse = await response.json();
        setMembers(data.members || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching members:', err);
        setError(err instanceof Error ? err.message : 'Failed to load members');
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  return { members, loading, error };
};