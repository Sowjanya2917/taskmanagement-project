// components/NotificationIndicator.jsx
import React from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { Link } from 'react-router-dom';

const NotificationIndicator = () => {
  const { unreadCount, loading } = useNotifications();
  
  // Don't show anything while loading
  if (loading) {
    return null;
  }
  
  return (
    <Link 
      to="/notifications" 
      className="relative inline-flex items-center p-1 rounded-full text-gray-700 hover:bg-gray-100 hover:text-indigo-600 transition duration-300"
    >
      <Bell className="h-5 w-5" />
      
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 min-w-4 flex items-center justify-center px-1">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
};

export default NotificationIndicator;