// src/components/ProtectedRoute.jsx

import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const user = useSelector((store) => store.user);

  if (!user) {
    // If user is null (not logged in), redirect to login
    return <Navigate to="/login" replace />;
  }

  // If user exists (logged in), render the child routes/components
  return <Outlet />;
};

export default ProtectedRoute;