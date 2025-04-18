// pages/TaskViewPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TaskDetailView from './TaskDetailView';
import { useAuth } from '../contexts/AuthContext';
import { app } from '../firebase';

const TaskViewPage = () => {
  const { taskId } = useParams();
  const { currentUser } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const db = getFirestore(app);
  
  // Fetch task details
  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId || !currentUser) {
        setError('Invalid task ID or not authenticated');
        setLoading(false);
        return;
      }
      
      try {
        const taskDoc = await getDoc(doc(db, 'tasks', taskId));
        
        if (!taskDoc.exists()) {
          setError('Task not found');
          setLoading(false);
          return;
        }
        
        const taskData = taskDoc.data();
        
        // Check if user has access to this task
        const isOwner = taskData.userId === currentUser.uid;
        const isAssignee = taskData.assignedTo && taskData.assignedTo.includes(currentUser.uid);
        
        // Check if user is in the same team
        let isTeamMember = false;
        if (taskData.teamId) {
          const userTeamDoc = await getDoc(doc(db, 'userTeams', currentUser.uid));
          isTeamMember = userTeamDoc.exists() && userTeamDoc.data().teamId === taskData.teamId;
        }
        
        if (!isOwner && !isAssignee && !isTeamMember) {
          setError('You do not have permission to view this task');
          setLoading(false);
          return;
        }
        
        setTask({
          id: taskDoc.id,
          ...taskData,
          dueDate: taskData.dueDate?.toDate() || null
        });
        
      } catch (err) {
        console.error('Error fetching task:', err);
        setError('Error loading task details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTask();
  }, [taskId, currentUser, db]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-16 flex justify-center">
          <svg className="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <Footer />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
            <p className="text-gray-700 mb-4">{error}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  
  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Task Not Found</h2>
            <p className="text-gray-600 mb-4">The task you're looking for doesn't exist or you don't have permission to view it.</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  
  // Show task detail view
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Task Details</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <TaskDetailView
            taskId={task.id}
            task={task}
            onClose={() => navigate('/dashboard')}
            onEdit={() => {/* Handle edit if needed */}}
            embedded={true}
          />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TaskViewPage;