import React, { useState, useEffect } from 'react';
import { X, Edit, Calendar, Clock, Tag, MessageSquare, CheckCircle, Circle } from 'lucide-react';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { app } from "../firebase"
import TaskComments from './TaskComments';

const TaskDetailView = ({ taskId, onClose, onEdit }) => {
  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details'); // 'details' or 'comments'
  const db = getFirestore(app);
  
  // Fetch task details
  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId) return;
      
      setIsLoading(true);
      try {
        const taskDoc = await getDoc(doc(db, 'tasks', taskId));
        if (taskDoc.exists()) {
          const taskData = taskDoc.data();
          setTask({
            id: taskDoc.id,
            ...taskData,
            dueDate: taskData.dueDate?.toDate() || null
          });
        }
      } catch (error) {
        console.error('Error fetching task:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTask();
  }, [taskId, db]);
  
  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'No due date';
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };
  
  // Get status display name
  const getStatusName = (statusId) => {
    switch (statusId) {
      case 'not-started':
        return 'Not Started';
      case 'in-progress':
        return 'In Progress';
      case 'review':
        return 'Review';
      case 'completed':
        return 'Completed';
      default:
        return statusId;
    }
  };
  
  // Get status color
  const getStatusColor = (statusId) => {
    switch (statusId) {
      case 'not-started':
        return 'bg-gray-100 text-gray-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'review':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Toggle task completion (completed status)
  const toggleTaskCompletion = async () => {
    if (!task) return;
    
    const newStatus = task.status === 'completed' ? 'not-started' : 'completed';
    
    try {
      await updateDoc(doc(db, 'tasks', task.id), {
        status: newStatus
      });
      
      // Update local state
      setTask({
        ...task,
        status: newStatus
      });
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };
  
  // Handle click outside modal
  const handleClickOutside = (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      onClose();
    }
  };
  
  if (!taskId) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 modal-backdrop"
      onClick={handleClickOutside}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col" 
        onClick={e => e.stopPropagation()}
      >
        {isLoading ? (
          <div className="flex-1 flex justify-center items-center p-8">
            <svg className="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : task ? (
          <>
            {/* Header */}
            <div className="flex justify-between items-start p-4 border-b sticky top-0 bg-white z-10">
              <div className="pr-8">
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={toggleTaskCompletion}
                    className="focus:outline-none"
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400 hover:text-indigo-500" />
                    )}
                  </button>
                  <h2 className="text-xl font-semibold text-gray-900">{task.title}</h2>
                </div>
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${getStatusColor(task.status)}`}>
                  {getStatusName(task.status)}
                </div>
              </div>
              
              <div className="flex items-center">
                <button
                  onClick={() => onEdit(task)}
                  className="mr-2 p-1 rounded-full hover:bg-gray-100"
                >
                  <Edit className="h-5 w-5 text-gray-500" />
                </button>
                <button
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="flex border-b">
              <button
                className={`flex-1 py-3 text-sm font-medium text-center ${
                  activeTab === 'details' 
                    ? 'text-indigo-600 border-b-2 border-indigo-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('details')}
              >
                Details
              </button>
              <button
                className={`flex-1 py-3 text-sm font-medium text-center ${
                  activeTab === 'comments' 
                    ? 'text-indigo-600 border-b-2 border-indigo-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('comments')}
              >
                Comments
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'details' ? (
                <div className="p-4 space-y-4">
                  {/* Description */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                    <p className="text-gray-800 whitespace-pre-wrap">
                      {task.description || 'No description provided.'}
                    </p>
                  </div>
                  
                  {/* Priority */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Priority</h3>
                    <p className={`font-medium capitalize ${getPriorityColor(task.priority)}`}>
                      {task.priority || 'None'}
                    </p>
                  </div>
                  
                  {/* Due Date */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Due Date</h3>
                    <p className="text-gray-800 flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                      {task.dueDate ? formatDate(task.dueDate) : 'No due date'}
                    </p>
                  </div>
                  
                  {/* Tags */}
                  {task.tags && task.tags.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {task.tags.map((tag, index) => (
                          <span 
                            key={index} 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Created and Updated */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      Created: {task.createdAt ? new Date(task.createdAt.seconds * 1000).toLocaleString() : 'Unknown'}
                    </div>
                  </div>
                </div>
              ) : (
                // Comments tab
                <div className="h-full">
                  {/* We'll embed the TaskComments component directly */}
                  <div className="h-full">
                    <TaskComments 
                      taskId={task.id}
                      isOpen={true}
                      embedded={true}
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-4 text-center text-gray-500">
            Task not found
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDetailView;