import React, { useState, useEffect } from 'react';
import { X, Edit, Calendar, Clock, Tag, MessageSquare, CheckCircle, Circle, Paperclip, ExternalLink, File, FileText, Image, FileSpreadsheet, Presentation, Link, RefreshCw, AlertTriangle, Play, Square } from 'lucide-react';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { app } from "../firebase"
import TaskComments from './TaskComments';
import TimeTrackingPanel from '../components/TimeTrackingPanel';
import { getActiveTimeEntries, startTimeTracking, stopTimeTracking, formatDuration } from '../utils/TimeTrackingService';

const TaskDetailView = ({ taskId, onClose, onEdit }) => {
  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'comments', or 'timeTracking'
  const [dependencies, setDependencies] = useState([]);
  const [dependenciesMet, setDependenciesMet] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timeEntryId, setTimeEntryId] = useState(null);
  const [timerInterval, setTimerInterval] = useState(null);
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
          const taskWithId = {
            id: taskDoc.id,
            ...taskData,
            dueDate: taskData.dueDate?.toDate() || null,
            recurrence: taskData.recurrence || null
          };
          
          setTask(taskWithId);
          
          // If the task has dependencies, fetch their details
          if (taskData.dependencies && taskData.dependencies.length > 0) {
            const dependencyPromises = taskData.dependencies.map(async (dependency) => {
              try {
                const depDoc = await getDoc(doc(db, 'tasks', dependency.id));
                if (depDoc.exists()) {
                  return {
                    id: depDoc.id,
                    ...depDoc.data(),
                    ...dependency // Keep original dependency info as well
                  };
                }
                return dependency;
              } catch (err) {
                console.error(`Error fetching dependency ${dependency.id}:`, err);
                return dependency;
              }
            });
            
            const dependencyDetails = await Promise.all(dependencyPromises);
            setDependencies(dependencyDetails);
            
            // Check if all dependencies are completed
            const allDependenciesMet = dependencyDetails.every(dep => dep.status === 'completed');
            setDependenciesMet(allDependenciesMet);
          } else {
            setDependencies([]);
            setDependenciesMet(true);
          }
          
          // Check for active time tracking
          checkTimeTracking();
        }
      } catch (error) {
        console.error('Error fetching task:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTask();
    
    // Clean up timer on unmount
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [taskId, db]);
  
  // Check if there's an active time tracking session for this task
  const checkTimeTracking = async () => {
    try {
      const activeEntries = await getActiveTimeEntries();
      const activeEntry = activeEntries.find(entry => entry.taskId === taskId);
      
      if (activeEntry) {
        setIsTracking(true);
        setTimeEntryId(activeEntry.id);
        
        // Calculate elapsed time
        const startTime = new Date(activeEntry.startTime);
        const now = new Date();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedTime(elapsed);
        
        // Start the timer
        const interval = setInterval(() => {
          setElapsedTime(prevTime => prevTime + 1);
        }, 1000);
        
        setTimerInterval(interval);
        
        return () => clearInterval(interval);
      } else {
        setIsTracking(false);
        setTimeEntryId(null);
        
        if (timerInterval) {
          clearInterval(timerInterval);
          setTimerInterval(null);
        }
      }
    } catch (error) {
      console.error('Error checking time tracking:', error);
    }
  };
  
  // Start time tracking
  const handleStartTracking = async () => {
    try {
      const entryId = await startTimeTracking(taskId, task.title);
      
      if (entryId) {
        setIsTracking(true);
        setTimeEntryId(entryId);
        setElapsedTime(0);
        
        // Start the timer
        const interval = setInterval(() => {
          setElapsedTime(prevTime => prevTime + 1);
        }, 1000);
        
        setTimerInterval(interval);
      }
    } catch (error) {
      console.error('Error starting time tracking:', error);
    }
  };
  
  // Stop time tracking
  const handleStopTracking = async () => {
    if (!timeEntryId) return;
    
    try {
      const success = await stopTimeTracking(timeEntryId);
      
      if (success) {
        setIsTracking(false);
        setTimeEntryId(null);
        
        if (timerInterval) {
          clearInterval(timerInterval);
          setTimerInterval(null);
        }
      }
    } catch (error) {
      console.error('Error stopping time tracking:', error);
    }
  };
  
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
  
  // Format recurrence for display
  const formatRecurrence = (recurrence) => {
    if (!recurrence || !recurrence.isRecurring) return 'Not recurring';
    
    const { frequency, interval } = recurrence;
    let frequencyText = '';
    
    switch (frequency) {
      case 'daily':
        frequencyText = interval === 1 ? 'day' : `${interval} days`;
        break;
      case 'weekly':
        frequencyText = interval === 1 ? 'week' : `${interval} weeks`;
        break;
      case 'monthly':
        frequencyText = interval === 1 ? 'month' : `${interval} months`;
        break;
      case 'yearly':
        frequencyText = interval === 1 ? 'year' : `${interval} years`;
        break;
      default:
        frequencyText = frequency;
    }
    
    let endText = '';
    if (recurrence.endAfter) {
      endText = `, ending after ${recurrence.endAfter} occurrences`;
    } else if (recurrence.endDate) {
      const endDate = recurrence.endDate instanceof Date 
        ? recurrence.endDate 
        : new Date(recurrence.endDate);
      
      endText = `, ending on ${endDate.toLocaleDateString()}`;
    }
    
    return `Repeats every ${frequencyText}${endText}`;
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
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  // Get file icon based on type
  const getFileIcon = (fileType) => {
    if (!fileType) return <File className="h-5 w-5 text-gray-500" />;
    
    if (fileType.startsWith('image/')) {
      return <Image className="h-5 w-5 text-indigo-500" />;
    } else if (fileType.includes('word')) {
      return <FileText className="h-5 w-5 text-blue-500" />;
    } else if (fileType.includes('presentation')) {
      return <Presentation className="h-5 w-5 text-orange-500" />;
    } else if (fileType.includes('sheet')) {
      return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    } else {
      return <File className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Toggle task completion (completed status)
  const toggleTaskCompletion = async () => {
    if (!task) return;
    
    // If task has unmet dependencies and trying to complete, show message
    if (!dependenciesMet && task.status !== 'completed') {
      alert("Cannot complete task. Not all dependencies are completed yet.");
      return;
    }
    
    const newStatus = task.status === 'completed' ? 'not-started' : 'completed';
    
    try {
      await updateDoc(doc(db, 'tasks', task.id), {
        status: newStatus,
        completedAt: newStatus === 'completed' ? new Date() : null
      });
      
      // Update local state
      setTask({
        ...task,
        status: newStatus,
        completedAt: newStatus === 'completed' ? new Date() : null
      });
      
      // If completing the task and it's currently being tracked, stop tracking
      if (newStatus === 'completed' && isTracking && timeEntryId) {
        await handleStopTracking();
      }
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
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col" 
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
            <div className="flex justify-between items-start p-6 border-b sticky top-0 bg-white z-10">
              <div className="pr-8 flex-1">
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={toggleTaskCompletion}
                    className="focus:outline-none"
                    disabled={!dependenciesMet && task.status !== 'completed'}
                    title={!dependenciesMet ? "Complete dependencies first" : "Toggle completion"}
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : (
                      <Circle className={`h-6 w-6 ${dependenciesMet ? 'text-gray-400 hover:text-indigo-500' : 'text-gray-300 cursor-not-allowed'}`} />
                    )}
                  </button>
                  <h2 className="text-2xl font-semibold text-gray-900">{task.title}</h2>
                </div>
                <div className="flex items-center mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                    {getStatusName(task.status)}
                  </span>
                  
                  {/* Quick time tracking button */}
                  {task.status !== 'completed' && (
                    <button
                      onClick={isTracking ? handleStopTracking : handleStartTracking}
                      className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isTracking ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800 hover:bg-indigo-100 hover:text-indigo-800'
                      }`}
                    >
                      {isTracking ? (
                        <>
                          <Square className="h-3 w-3 mr-1" />
                          <span>Stop Time ({formatDuration(elapsedTime)})</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3 mr-1" />
                          <span>Start Time</span>
                        </>
                      )}
                    </button>
                  )}
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
                  activeTab === 'timeTracking' 
                    ? 'text-indigo-600 border-b-2 border-indigo-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('timeTracking')}
              >
                <span className="flex items-center justify-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Time Tracking
                </span>
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
                <div className="p-6 space-y-6">
                  {/* Description */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                    <p className="text-gray-800 whitespace-pre-wrap">
                      {task.description || 'No description provided.'}
                    </p>
                  </div>
                  
                  {/* Dependencies Warning */}
                  {!dependenciesMet && task.status !== 'completed' && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <AlertTriangle className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            This task has unfinished dependencies. Complete them first before marking this task as completed.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Dependencies */}
                  {dependencies.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                        <Link className="h-4 w-4 mr-1 text-gray-400" />
                        Dependencies
                      </h3>
                      <ul className="space-y-2">
                        {dependencies.map(dependency => (
                          <li key={dependency.id} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-medium text-gray-900">{dependency.title}</span>
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(dependency.status)}`}>
                                  {getStatusName(dependency.status)}
                                </span>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Recurrence Information */}
                  {task.recurrence && task.recurrence.isRecurring && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                        <RefreshCw className="h-4 w-4 mr-1 text-gray-400" />
                        Recurrence
                      </h3>
                      <div className="bg-indigo-50 rounded-lg p-3">
                        <p className="text-indigo-800">
                          {formatRecurrence(task.recurrence)}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Attachments */}
                  {task.attachments && task.attachments.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                        <Paperclip className="h-4 w-4 mr-1 text-gray-400" />
                        Attachments ({task.attachments.length})
                      </h3>
                      <div className="mt-2 space-y-2">
                        {task.attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              {getFileIcon(file.type)}
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900 truncate max-w-xs">{file.name}</p>
                                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                              </div>
                            </div>
                            <a 
                              href={file.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="ml-2 text-indigo-600 hover:text-indigo-800"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Priority */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Priority</h3>
                    <p className={`font-medium capitalize ${getPriorityColor(task.priority)}`}>
                      {task.priority || 'None'}
                    </p>
                  </div>
                  
                  {/* Due Date */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Due Date</h3>
                    <p className="text-gray-800 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      {task.dueDate ? formatDate(task.dueDate) : 'No due date'}
                    </p>
                  </div>
                  
                  {/* Tags */}
                  {task.tags && task.tags.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Tags</h3>
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
                    {task.completedAt && (
                      <div className="text-xs text-gray-500 mt-1">
                        Completed: {new Date(task.completedAt.seconds * 1000).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              ) : activeTab === 'timeTracking' ? (
                // Time tracking tab
                <div className="h-full">
                  <TimeTrackingPanel 
                    taskId={task.id} 
                    isActive={isTracking}
                    onStartTracking={handleStartTracking}
                    onStopTracking={handleStopTracking}
                  />
                </div>
              ) : (
                // Comments tab
                <div className="h-full">
                  <TaskComments 
                    taskId={task.id}
                    isOpen={true}
                    embedded={true}
                  />
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