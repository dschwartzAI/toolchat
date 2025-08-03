import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/Tabs';
import GoHighLevelIntegration from './GoHighLevelIntegration';

export default function Integrations() {
  return (
    <div className="flex flex-col gap-4">
      <div className="pb-2 border-b border-border">
        <h3 className="text-lg font-medium">Integrations</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Connect external services to enhance your AI tools
        </p>
      </div>
      
      <Tabs defaultValue="crm" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="crm">CRM</TabsTrigger>
          <TabsTrigger value="communication" disabled>Communication</TabsTrigger>
          <TabsTrigger value="productivity" disabled>Productivity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="crm" className="space-y-4">
          <GoHighLevelIntegration />
        </TabsContent>
        
        <TabsContent value="communication" className="space-y-4">
          <div className="text-center text-muted-foreground py-8">
            <p>Coming soon: Slack, Discord, and more</p>
          </div>
        </TabsContent>
        
        <TabsContent value="productivity" className="space-y-4">
          <div className="text-center text-muted-foreground py-8">
            <p>Coming soon: Google Workspace, Notion, and more</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}