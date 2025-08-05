import React from 'react';
import { Outlet } from 'react-router-dom';

export default function AcademyLayout() {
  return (
    <div className="flex h-full bg-surface-primary">
      {/* Main content - Academy sidebar is managed at the Root level */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}