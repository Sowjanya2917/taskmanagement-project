import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, Briefcase, Settings, Server, BarChart2, Mail, Check, X, ExternalLink } from 'lucide-react';
import { getFirestore, doc, getDoc, collection, query, orderBy, onSnapshot, updateDoc } from 'firebase/firestore';
import { app } from "../firebase";

const AdminDashboard = () => {
  const { currentUser, userRole } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contactMessages, setContactMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'messages'
  const navigate = useNavigate();
  const db = getFirestore(app);

  // Double-check admin status directly from Firestore when component mounts
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const isAdminUser = userDoc.exists() && userDoc.data().role === 'admin';
        
        console.log("Admin dashboard - User role from Firestore:", userDoc.data()?.role);
        setIsAdmin(isAdminUser);
        
        if (!isAdminUser) {
          console.log("Not admin, redirecting to user dashboard");
          navigate('/dashboard');
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [currentUser, navigate, db]);

  // Fetch contact messages
  useEffect(() => {
    if (!isAdmin) return;

    const q = query(
      collection(db, 'contactMessages'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messages = [];
      querySnapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        });
      });

      setContactMessages(messages);
    });

    return () => unsubscribe();
  }, [isAdmin, db]);

  // Format date for display
  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Mark message as read/unread
  const toggleMessageStatus = async (messageId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'read' ? 'unread' : 'read';
      await updateDoc(doc(db, 'contactMessages', messageId), {
        status: newStatus
      });
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <span className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
            Administrator
          </span>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-8">
          <button
            className={`py-4 px-6 text-sm font-medium ${
              activeTab === 'dashboard'
                ? 'text-indigo-600 border-b-2 border-indigo-500'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`py-4 px-6 text-sm font-medium flex items-center ${
              activeTab === 'messages'
                ? 'text-indigo-600 border-b-2 border-indigo-500'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('messages')}
          >
            Contact Messages
            {contactMessages.filter(msg => msg.status === 'unread').length > 0 && (
              <span className="ml-2 bg-red-100 text-red-800 rounded-full px-2 py-1 text-xs">
                {contactMessages.filter(msg => msg.status === 'unread').length}
              </span>
            )}
          </button>
        </div>
        
        {activeTab === 'dashboard' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                    <Users className="h-8 w-8" />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-lg font-semibold text-gray-700">Total Users</h2>
                    <p className="text-3xl font-bold text-gray-900">125</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 text-green-600">
                    <Briefcase className="h-8 w-8" />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-lg font-semibold text-gray-700">Active Tasks</h2>
                    <p className="text-3xl font-bold text-gray-900">287</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                    <Server className="h-8 w-8" />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-lg font-semibold text-gray-700">Teams</h2>
                    <p className="text-3xl font-bold text-gray-900">15</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                    <BarChart2 className="h-8 w-8" />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-lg font-semibold text-gray-700">System Health</h2>
                    <p className="text-3xl font-bold text-gray-900">99%</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-semibold text-gray-800">Administrative Controls</h2>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-4">
                  Welcome to the admin dashboard. Here you can manage users, monitor system performance, and configure application settings.
                </p>
                <p className="text-gray-600">
                  This is a placeholder for the admin interface. In a production application, you would have controls for:
                </p>
                <ul className="list-disc pl-5 mt-2 text-gray-600">
                  <li>User management (view, edit, suspend users)</li>
                  <li>Task and team monitoring</li>
                  <li>System configuration and settings</li>
                  <li>Analytics and reporting</li>
                  <li>Security and access control</li>
                </ul>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Contact Messages
              </h2>
            </div>
            
            {contactMessages.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No contact messages yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Message
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contactMessages.map((message) => (
                      <tr key={message.id} className={message.status === 'unread' ? 'bg-indigo-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(message.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{message.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{message.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{message.subject}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 max-w-xs truncate">{message.message}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            message.status === 'unread' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {message.status === 'unread' ? 'Unread' : 'Read'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => toggleMessageStatus(message.id, message.status)}
                            className={`text-indigo-600 hover:text-indigo-900 mr-4 flex items-center ${
                              message.status === 'unread' ? 'text-green-600 hover:text-green-900' : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            {message.status === 'unread' ? (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Mark as Read
                              </>
                            ) : (
                              <>
                                <X className="h-4 w-4 mr-1" />
                                Mark as Unread
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;