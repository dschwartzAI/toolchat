import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '~/hooks';
import { SystemRoles } from 'librechat-data-provider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuthContext();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user?.role !== SystemRoles.ADMIN) {
    return <Navigate to="/academy" replace />;
  }

  return <>{children}</>;
}