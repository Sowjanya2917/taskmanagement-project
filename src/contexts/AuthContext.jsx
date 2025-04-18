import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getAuth,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { app } from "../firebase"

// Create context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'admin' or 'user'
  const [loading, setLoading] = useState(true);
  const auth = getAuth(app);
  const db = getFirestore(app);
  
  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Check if user data exists in Firestore
        try {
          console.log("Checking user role for:", user.uid);
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const role = userDoc.data().role || 'user';
            console.log("User role found:", role);
            setUserRole(role);
          } else {
            console.log("No user document found, creating with default role");
            // Default to 'user' role if not specified
            setUserRole('user');
            
            // Create a default user document
            await setDoc(doc(db, 'users', user.uid), {
              email: user.email,
              name: user.displayName || '',
              role: 'user',
              createdAt: new Date()
            });
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          setUserRole('user'); // Default to user on error
        }
      } else {
        setUserRole(null);
      }
      
      setLoading(false);
    });
    
    // Cleanup subscription on unmount
    return unsubscribe;
  }, [auth, db]);
  
  // Sign out function
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUserRole(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };
  
  // Password reset function
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  };
  
  // Check if a user is admin - useful utility function
  const checkIsAdmin = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      return userDoc.exists() && userDoc.data().role === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };
  
  // Create or update user role in Firestore
  const setUserRoleInFirestore = async (userId, role) => {
    try {
      console.log("Setting user role:", userId, role);
      await setDoc(doc(db, 'users', userId), { 
        role,
        updatedAt: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('Error setting user role:', error);
      throw error;
    }
  };
  
  // Context values
  const value = {
    currentUser,
    userRole,
    loading,
    signOut,
    resetPassword,
    setUserRoleInFirestore,
    checkIsAdmin,
    isAdmin: userRole === 'admin'
  };
  
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};