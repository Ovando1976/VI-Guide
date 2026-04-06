import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { User } from 'firebase/auth';

export function ProtectedRoute({
  user,
  children,
}: {
  user: User | null;
  children: React.ReactElement;
}) {
  const location = useLocation();

  if (!user) {
    return <Navigate to="/profile" replace state={{ from: location.pathname }} />;
  }

  return children;
}
