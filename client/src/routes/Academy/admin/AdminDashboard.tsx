import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { BookOpen, Users, BarChart, Settings } from 'lucide-react';
import { cn } from '~/utils';
import { useLocalize } from '~/hooks';

export default function AdminDashboard() {
  const localize = useLocalize();

  const navItems = [
    {
      path: '/academy/admin/courses',
      icon: BookOpen,
      label: localize('com_academy_admin_courses')
    },
    {
      path: '/academy/admin/users',
      icon: Users,
      label: localize('com_academy_admin_users')
    },
    {
      path: '/academy/admin/analytics',
      icon: BarChart,
      label: localize('com_academy_admin_analytics')
    },
    {
      path: '/academy/admin/settings',
      icon: Settings,
      label: localize('com_academy_admin_settings')
    }
  ];

  return (
    <div className="h-full flex">
      {/* Admin navigation */}
      <nav className="w-64 border-r border-border-light bg-surface-secondary p-4">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          {localize('com_academy_admin_dashboard')}
        </h2>
        
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  'hover:bg-surface-hover',
                  isActive && 'bg-surface-tertiary text-blue-600'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Admin content */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}