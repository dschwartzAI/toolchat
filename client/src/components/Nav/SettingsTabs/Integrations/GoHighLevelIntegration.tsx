import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, AlertCircle, HelpCircle, Loader2, Plug, X } from 'lucide-react';
import { useToastContext } from '~/Providers/ToastContext';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Label } from '~/components/ui/Label';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '~/components/ui/HoverCard';
import { useAuthContext } from '~/hooks/AuthContext';
import { request } from 'librechat-data-provider';

interface IntegrationStatus {
  isConnected: boolean;
  lastValidated?: string;
  error?: string;
}

export default function GoHighLevelIntegration() {
  const { showToast } = useToastContext();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const [apiKey, setApiKey] = useState('');
  const [locationId, setLocationId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [savedValues, setSavedValues] = useState<{ GHL_API_KEY?: string; GHL_LOCATION_ID?: string }>({});

  // Query to get current integration status
  const { data: status, isLoading: statusLoading } = useQuery<IntegrationStatus>({
    queryKey: ['integration', 'gohighlevel', 'status'],
    queryFn: async () => {
      const response = await request.get('/api/integrations/gohighlevel/status');
      return response.data;
    },
    enabled: !!user,
  });

  // Fetch saved values when status changes
  useEffect(() => {
    if (status?.isConnected) {
      // Fetch masked values from plugin auth
      request.get('/api/user/plugins/mcp_gohighlevel')
        .then(response => {
          if (response.data.configured && response.data.fields) {
            setSavedValues(response.data.fields);
          }
        })
        .catch(console.error);
    }
  }, [status?.isConnected]);

  // Mutation to test the API connection
  const testConnection = useMutation({
    mutationFn: async () => {
      const response = await request.post('/api/integrations/gohighlevel/test', {
        apiKey,
        locationId: locationId || undefined,
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        showToast({
          message: 'Connection successful! You can now save the integration.',
          status: 'success',
        });
      }
    },
    onError: (error: any) => {
      showToast({
        message: error.response?.data?.error || 'Failed to connect to GoHighLevel',
        status: 'error',
      });
    },
  });

  // Mutation to save the integration
  const saveIntegration = useMutation({
    mutationFn: async () => {
      const response = await request.post('/api/integrations/gohighlevel/save', {
        apiKey,
        locationId: locationId || undefined,
      });
      return response.data;
    },
    onSuccess: () => {
      showToast({
        message: 'GoHighLevel integration saved successfully!',
        status: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['integration', 'gohighlevel'] });
      setShowForm(false);
      setApiKey('');
      setLocationId('');
    },
    onError: (error: any) => {
      showToast({
        message: error.response?.data?.error || 'Failed to save integration',
        status: 'error',
      });
    },
  });

  // Mutation to disconnect
  const disconnect = useMutation({
    mutationFn: async () => {
      const response = await request.delete('/api/integrations/gohighlevel');
      return response.data;
    },
    onSuccess: () => {
      showToast({
        message: 'GoHighLevel disconnected successfully',
        status: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['integration', 'gohighlevel'] });
    },
    onError: (error: any) => {
      showToast({
        message: error.response?.data?.error || 'Failed to disconnect',
        status: 'error',
      });
    },
  });

  const handleTest = async () => {
    if (!apiKey) {
      showToast({
        message: 'Please enter an API key',
        status: 'error',
      });
      return;
    }
    testConnection.mutate();
  };

  const handleSave = async () => {
    if (!apiKey) {
      showToast({
        message: 'Please enter an API key',
        status: 'error',
      });
      return;
    }
    saveIntegration.mutate();
  };

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-surface-primary rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Plug className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h4 className="font-medium">GoHighLevel</h4>
            <p className="text-sm text-muted-foreground">
              Connect your CRM to access contacts and campaigns
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
            Coming Soon
          </span>
        </div>
      </div>
    </div>
  );
}