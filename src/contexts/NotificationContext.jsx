import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  onSnapshot,
  orderBy, 
  limit,
  updateDoc,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { app } from '../firebase';

// Create context
const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const db = getFirestore(app);
  
  // Set up real-time listener for notifications
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    // Get the user's team ID
    const getUserTeam = async () => {
      try {
        const userTeamDoc = await getDoc(doc(db, 'userTeams', currentUser.uid));
        const teamId = userTeamDoc.exists() ? userTeamDoc.data().teamId : null;
        
        // Set up notification listener based on personal and team notifications
        let notificationQuery;
        
        if (teamId) {
          // If user is part of a team, get both personal and team notifications
          notificationQuery = query(
            collection(db, 'notifications'),
            where('recipients', 'array-contains', currentUser.uid),
            orderBy('createdAt', 'desc'),
            limit(50)
          );
        } else {
          // If user is not part of a team, get only personal notifications
          notificationQuery = query(
            collection(db, 'notifications'),
            where('recipients', 'array-contains', currentUser.uid),
            orderBy('createdAt', 'desc'),
            limit(50)
          );
        }
        
        // Set up real-time listener
        const unsubscribe = onSnapshot(notificationQuery, (snapshot) => {
          const notificationList = [];
          
          snapshot.forEach((doc) => {
            notificationList.push({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate() || new Date()
            });
          });
          
          setNotifications(notificationList);
          
          // Count unread notifications
          const unreadNotifications = notificationList.filter(
            notification => !notification.readBy || !notification.readBy.includes(currentUser.uid)
          );
          
          setUnreadCount(unreadNotifications.length);
          setLoading(false);
        });
        
        return unsubscribe;
      } catch (error) {
        console.error("Error setting up notification listener:", error);
        setLoading(false);
        return () => {};
      }
    };
    
    const unsubscribePromise = getUserTeam();
    
    // Clean up listener on unmount
    return () => {
      unsubscribePromise.then(unsubscribe => unsubscribe());
    };
  }, [currentUser, db]);
  
  // Create a notification
  const createNotification = async (data) => {
    if (!data.type || !data.message) {
      console.error("Invalid notification data", data);
      return;
    }
    
    try {
      // Create notification document
      const notificationRef = doc(collection(db, 'notifications'));
      
      await setDoc(notificationRef, {
        ...data,
        createdAt: serverTimestamp(),
        readBy: []
      });
      
      return notificationRef.id;
    } catch (error) {
      console.error("Error creating notification:", error);
      return null;
    }
  };
  
  // Mark a notification as read
  const markAsRead = async (notificationId) => {
    if (!currentUser || !notificationId) return;
    
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      const notificationDoc = await getDoc(notificationRef);
      
      if (notificationDoc.exists()) {
        const currentReadBy = notificationDoc.data().readBy || [];
        
        // Only update if user hasn't already read this notification
        if (!currentReadBy.includes(currentUser.uid)) {
          await updateDoc(notificationRef, {
            readBy: [...currentReadBy, currentUser.uid]
          });
        }
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!currentUser || notifications.length === 0) return;
    
    try {
      // Create a batch of updates
      const batch = [];
      
      notifications.forEach(notification => {
        const currentReadBy = notification.readBy || [];
        
        // Only update if user hasn't already read this notification
        if (!currentReadBy.includes(currentUser.uid)) {
          batch.push(
            updateDoc(doc(db, 'notifications', notification.id), {
              readBy: [...currentReadBy, currentUser.uid]
            })
          );
        }
      });
      
      // Execute all updates
      if (batch.length > 0) {
        await Promise.all(batch);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };
  
  // Delete a notification
  const deleteNotification = async (notificationId) => {
    if (!notificationId) return;
    
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };
  
  // Check if a notification is unread
  const isUnread = (notification) => {
    if (!currentUser) return false;
    return !notification.readBy || !notification.readBy.includes(currentUser.uid);
  };
  
  // Format notification time
  const formatNotificationTime = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // Difference in seconds
    
    if (diff < 60) {
      return 'Just now';
    } else if (diff < 3600) {
      const minutes = Math.floor(diff / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diff < 86400) {
      const hours = Math.floor(diff / 3600);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diff < 604800) {
      const days = Math.floor(diff / 86400);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  // Context value
  const value = {
    notifications,
    unreadCount,
    loading,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isUnread,
    formatNotificationTime
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotifications = () => {
  return useContext(NotificationContext);
};