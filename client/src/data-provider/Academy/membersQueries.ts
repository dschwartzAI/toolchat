import { useState, useEffect } from 'react';
import axios from 'axios';

export type Member = {
  id: string;
  name: string;
  username?: string;
  avatarUrl: string;
  bio?: string;
  location?: string;
  jobTitle?: string;
  company?: string;
  role?: string;
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
        // Use axios like the rest of LibreChat - it handles cookies automatically
        const response = await axios.get<MembersResponse>('/api/lms/members');
        
        setMembers(response.data.members || []);
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