import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LandingPage from './pages/LandingPage';
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import "./firebase";
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import ContactPage from './pages/ContactPage';
import NotificationsPage from './pages/NotificationsPage';
import TaskViewPage from './pages/TaskViewPage';
import AnalyticsPage from './pages/AnalyticsPage';

// Protected route for users
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <svg className="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Admin-only protected route
const AdminRoute = ({ children }) => {
  const { currentUser, loading, userRole } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <svg className="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  console.log("Checking admin route, user role:", userRole);
  
  if (userRole !== 'admin') {
    console.log("Not admin, redirecting to dashboard");
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

// Public only route (accessible only when not logged in)
const PublicOnlyRoute = ({ children }) => {
  const { currentUser, loading, userRole } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <svg className="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>;
  }
  
  if (currentUser) {
    // Redirect based on user role
    if (userRole === 'admin') {
      return <Navigate to="/admin/dashboard" />;
    } else {
      return <Navigate to="/dashboard" />;
    }
  }
  
  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Routes>
          {/* Public routes */}
          <Route
            path="/"
            element={
              <PublicOnlyRoute>
                <LandingPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <RegisterPage />
              </PublicOnlyRoute>
            }
          />
          
          {/* Contact page - accessible to everyone */}
          <Route path="/contact" element={<ContactPage />} />
          
          {/* User routes */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route 
            path='/dashboard' 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path='/notifications' 
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path='/task/:taskId' 
            element={
              <ProtectedRoute>
                <TaskViewPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path='/analytics' 
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin routes */}
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          
          {/* Catch-all route */}
          <Route
            path="*"
            element={<Navigate to="/" />}
          />
        </Routes>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;