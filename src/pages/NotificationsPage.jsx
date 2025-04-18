// pages/NotificationsPage.jsx
import React, { useState } from 'react';
import { CheckCheck, Trash2, Bell, Clock, Calendar, MessageSquare, Paperclip, AlertTriangle, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

const ITEMS_PER_PAGE = 10;

const NotificationsPage = () => {
  const { 
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isUnread,
    formatNotificationTime
  } = useNotifications();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  
  // Filter notifications based on current filter
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return isUnread(notification);
    if (filter === 'read') return !isUnread(notification);
    return true;
  });
  
  // Calculate total pages
  const totalPages = Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE);
  
  // Get current page items
  const currentNotifications = filteredNotifications.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };
  
  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (isUnread(notification)) {
      markAsRead(notification.id);
    }
  };
  
  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'deadline-1hour':
      case 'deadline-1day':
      case 'deadline-5days':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'deadline-overdue':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'task-completed':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'new-comment':
        return <MessageSquare className="h-5 w-5 text-indigo-500" />;
      case 'new-attachment':
        return <Paperclip className="h-5 w-5 text-blue-500" />;
      case 'task-assigned':
        return <Calendar className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex-grow">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Bell className="h-6 w-6 mr-2" />
                Notifications
              </h1>
              <p className="text-gray-600">
                Stay updated with your tasks and team activity
              </p>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark All as Read
              </button>
            )}
          </div>
          
          {/* Filter tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              className={`px-4 py-2 text-sm font-medium ${
                filter === 'all' 
                  ? 'text-indigo-600 border-b-2 border-indigo-500' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                filter === 'unread' 
                  ? 'text-indigo-600 border-b-2 border-indigo-500' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setFilter('unread')}
            >
              Unread
              {unreadCount > 0 && (
                <span className="ml-1 bg-indigo-100 text-indigo-600 px-2 py-0.5 text-xs rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                filter === 'read' 
                  ? 'text-indigo-600 border-b-2 border-indigo-500' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setFilter('read')}
            >
              Read
            </button>
          </div>
          
          {/* Notifications list */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <svg className="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : currentNotifications.length > 0 ? (
            <div className="space-y-4">
              {currentNotifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    isUnread(notification) 
                      ? 'bg-indigo-50 border-indigo-200' 
                      : 'bg-white border-gray-200'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className={`${isUnread(notification) ? 'font-semibold' : 'font-normal'} text-gray-900`}>
                          {notification.message}
                        </p>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="mt-1 flex items-center text-xs text-gray-500">
                        <span>{formatNotificationTime(notification.createdAt)}</span>
                        
                        {notification.taskId && (
                          <Link
                            to={`/task/${notification.taskId}`}
                            className="ml-2 text-indigo-600 hover:text-indigo-800"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Task
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-8 space-x-2">
                  <button
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-md ${
                      currentPage === 1 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => handlePageChange(i + 1)}
                      className={`px-3 py-1 rounded-md ${
                        currentPage === i + 1
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-md ${
                      currentPage === totalPages 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No notifications</h3>
              <p className="text-gray-500">
                {filter === 'all' 
                  ? "You don't have any notifications yet" 
                  : filter === 'unread' 
                    ? "You don't have any unread notifications" 
                    : "You don't have any read notifications"}
              </p>
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default NotificationsPage;