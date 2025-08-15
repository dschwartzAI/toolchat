import React from 'react';

export default function Integrations() {
  return (
    <div className="flex flex-col gap-4">
      <div className="pb-2 border-b border-border">
        <h3 className="text-lg font-medium">Integrations</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Connect external services to enhance your AI tools
        </p>
      </div>
      
      <div className="text-center text-muted-foreground py-8">
        <p>No integrations configured.</p>
      </div>
    </div>
  );
}