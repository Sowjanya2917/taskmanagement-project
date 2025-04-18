import React, { useState, useEffect } from 'react';
import { 
  MoreVertical, 
  Clock, 
  ArrowRight, 
  Edit, 
  Trash, 
  AlertCircle, 
  Tag, 
  MessageSquare, 
  User, 
  Eye, 
  Paperclip,
  AlertTriangle,
  Link,
  RefreshCw,
  Play,
  Square
} from 'lucide-react';
import TaskComments from './TaskComments';
import { 
  startTimeTracking, 
  stopTimeTracking, 
  getActiveTimeEntries, 
  formatDuration 
} from '../utils/TimeTrackingService';

const TaskList = ({ 
  status, 
  tasks, 
  onUpdateStatus, 
  onEditTask, 
  onDeleteTask,
  onViewDetails,
  statuses,
  isLoading,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  teamMembers = [],
  currentUser,
  showDependencyWarnings = false,
  showRecurrenceIndicators = false
}) => {
  const [activeCommentsTaskId, setActiveCommentsTaskId] = useState(null);
  const [trackingTasks, setTrackingTasks] = useState(new Set());
  const [trackingTimes, setTrackingTimes] = useState({});
  const [timer, setTimer] = useState(null);
  
  // Setup real-time tracking for active tasks
  useEffect(() => {
    if (!currentUser) return;
    
    const checkTracking = async () => {
      try {
        const activeEntries = await getActiveTimeEntries(currentUser.uid);
        
        // Update tracking tasks set
        const activeTasks = new Set(activeEntries.map(entry => entry.taskId));
        setTrackingTasks(activeTasks);
        
        // Calculate and set elapsed times
        const times = {};
        activeEntries.forEach(entry => {
          const startTime = new Date(entry.startTime);
          const now = new Date();
          const elapsed = Math.floor((now - startTime) / 1000);
          times[entry.taskId] = {
            elapsed,
            entryId: entry.id
          };
        });
        setTrackingTimes(times);
      } catch (error) {
        console.error('Error checking active time entries:', error);
      }
    };
    
    // Initial check
    checkTracking();
    
    // Set interval to update times
    const intervalId = setInterval(() => {
      // Update elapsed times
      setTrackingTimes(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(taskId => {
          updated[taskId] = {
            ...updated[taskId],
            elapsed: updated[taskId].elapsed + 1
          };
        });
        return updated;
      });
    }, 1000);
    
    // Set up a polling interval to refresh tracking status
    const trackingCheckInterval = setInterval(checkTracking, 30000); // Every 30 seconds
    
    setTimer(intervalId);
    
    return () => {
      clearInterval(intervalId);
      clearInterval(trackingCheckInterval);
    };
  }, [currentUser]);
  
  // Get the next status in the workflow
  const getNextStatus = (currentStatusId) => {
    const currentIndex = statuses.findIndex(s => s.id === currentStatusId);
    if (currentIndex < statuses.length - 1) {
      return statuses[currentIndex + 1];
    }
    return null;
  };

  // Format the due date to be more readable
  const formatDueDate = (date) => {
    if (!date) return '';
    
    const taskDate = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Check if the date is today
    if (taskDate.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    // Check if the date is tomorrow
    if (taskDate.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    
    // Otherwise, format as Mon, Jan 1
    return taskDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      weekday: 'short' 
    });
  };
  
  // Check if date is past due
  const isPastDue = (date) => {
    if (!date) return false;
    
    const taskDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of day for accurate comparison
    
    return taskDate < today;
  };
  
  // Get class for priority badge
  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Check if a task can be completed
  const canTaskBeCompleted = (task) => {
    // If task has dependencies and they're not all met
    if (task.dependencies && task.dependencies.length > 0 && task.dependenciesMet === false) {
      return false;
    }
    return true;
  };
  
  // Toggle time tracking for a task
  const toggleTimeTracking = async (e, taskId) => {
    e.stopPropagation(); // Prevent opening task details
    
    try {
      if (trackingTasks.has(taskId)) {
        // Stop tracking this task
        if (trackingTimes[taskId] && trackingTimes[taskId].entryId) {
          await stopTimeTracking(trackingTimes[taskId].entryId);
          
          // Update local state
          setTrackingTasks(prev => {
            const newSet = new Set(prev);
            newSet.delete(taskId);
            return newSet;
          });
          
          setTrackingTimes(prev => {
            const newTimes = { ...prev };
            delete newTimes[taskId];
            return newTimes;
          });
        }
      } else {
        // Get the task title
        const task = tasks.find(t => t.id === taskId);
        const taskTitle = task ? task.title : "Task";
        
        // Start tracking this task
        const entryId = await startTimeTracking(taskId, currentUser.uid);
        
        if (entryId) {
          // Update local state
          setTrackingTasks(prev => {
            const newSet = new Set(prev);
            newSet.add(taskId);
            return newSet;
          });
          
          setTrackingTimes(prev => ({
            ...prev,
            [taskId]: {
              elapsed: 0,
              entryId
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error toggling time tracking:', error);
    }
  };
  
  // Move task to the next status
  const moveToNextStatus = async (taskId, currentStatusId) => {
    const nextStatus = getNextStatus(currentStatusId);
    if (nextStatus) {
      // Get the task to check dependencies if completing
      if (nextStatus.id === 'completed') {
        const task = tasks.find(t => t.id === taskId);
        if (task && !canTaskBeCompleted(task)) {
          alert("This task has dependencies that must be completed first.");
          return;
        }
        
        // If task is being tracked, stop tracking before marking as complete
        if (trackingTasks.has(taskId) && trackingTimes[taskId] && trackingTimes[taskId].entryId) {
          await stopTimeTracking(trackingTimes[taskId].entryId);
          
          // Update tracking states
          setTrackingTasks(prev => {
            const newSet = new Set(prev);
            newSet.delete(taskId);
            return newSet;
          });
          
          setTrackingTimes(prev => {
            const newTimes = { ...prev };
            delete newTimes[taskId];
            return newTimes;
          });
        }
      }
      
      await onUpdateStatus(taskId, nextStatus.id);
    }
  };

  // Toggle dropdown menu for a task
  const toggleDropdown = (taskId) => {
    const dropdownElem = document.getElementById(`dropdown-${taskId}`);
    if (dropdownElem) {
      dropdownElem.classList.toggle('hidden');
    }
  };

  // Close all dropdowns when clicking outside
  const closeDropdowns = (e, exceptTaskId) => {
    if (!e.target.closest('.dropdown-menu') && !e.target.closest('.dropdown-toggle')) {
      document.querySelectorAll('.dropdown-menu').forEach(menu => {
        const taskId = menu.getAttribute('data-task-id');
        if (taskId !== exceptTaskId) {
          menu.classList.add('hidden');
        }
      });
    }
  };

  // Open comments modal
  const openComments = (taskId, e) => {
    e.stopPropagation(); // Prevent parent click handlers from firing
    setActiveCommentsTaskId(taskId);
  };

  // Get team member display name
  const getMemberName = (memberId) => {
    if (!memberId) return null;
    
    const member = teamMembers.find(m => m.id === memberId);
    return member ? (member.name || member.email) : null;
  };

  // Add event listener to close dropdowns when clicking outside
  React.useEffect(() => {
    document.addEventListener('click', closeDropdowns);
    return () => {
      document.removeEventListener('click', closeDropdowns);
    };
  }, []);
  
  return (
    <div 
      className="bg-white rounded-lg shadow flex flex-col h-full"
      onDragOver={(e) => onDragOver(e, status.id)}
      onDrop={(e) => onDrop(e, status.id)}
      onDragLeave={onDragLeave}
    >
      <div className={`p-4 border-b ${
        status.id === 'not-started' ? 'bg-gray-50' :
        status.id === 'in-progress' ? 'bg-blue-50' :
        status.id === 'review' ? 'bg-purple-50' :
        status.id === 'completed' ? 'bg-green-50' : 'bg-gray-50'
      }`}>
        <h3 className="font-medium text-gray-900">{status.name}</h3>
        <div className="text-sm text-gray-500">{tasks.length} tasks</div>
      </div>
      
      <div className="p-2 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : tasks.length > 0 ? (
          <ul className="space-y-3">
            {tasks.map((task) => (
              <li 
                key={task.id} 
                className="p-4 bg-white border rounded-lg hover:shadow-md transition-shadow cursor-move relative overflow-hidden"
                draggable
                onDragStart={(e) => onDragStart(e, task.id, task.status)}
                onClick={() => onViewDetails(task.id)}
              >
                {/* Priority indicator strip */}
                <div 
                  className={`absolute left-0 top-0 bottom-0 w-1 
                    ${task.priority === 'high' ? 'bg-red-500' : 
                      task.priority === 'medium' ? 'bg-yellow-500' : 
                      'bg-green-500'}`
                  }
                ></div>
                
                <div className="pl-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900 pr-6">{task.title}</h4>
                    
                    <div className="relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDropdown(task.id);
                        }} 
                        className="p-1 rounded-full hover:bg-gray-100 focus:outline-none dropdown-toggle"
                      >
                        <MoreVertical className="h-4 w-4 text-gray-500" />
                      </button>

                      <div 
                        id={`dropdown-${task.id}`}
                        data-task-id={task.id}
                        className="dropdown-menu hidden absolute right-0 z-10 mt-1 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                      >
                        <div className="py-1">
                          {/* View details option */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewDetails(task.id);
                              toggleDropdown(task.id);
                            }}
                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Eye className="mr-3 h-4 w-4" />
                            View Details
                          </button>
                          
                          {/* Time tracking option */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTimeTracking(e, task.id);
                              toggleDropdown(task.id);
                            }}
                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            {trackingTasks.has(task.id) ? (
                              <>
                                <Square className="mr-3 h-4 w-4 text-red-500" />
                                Stop Tracking
                              </>
                            ) : (
                              <>
                                <Play className="mr-3 h-4 w-4 text-green-500" />
                                Start Tracking
                              </>
                            )}
                          </button>
                          
                          {/* Comments option */}
                          <button
                            onClick={(e) => {
                              openComments(task.id, e);
                              toggleDropdown(task.id);
                            }}
                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <MessageSquare className="mr-3 h-4 w-4" />
                            Comments
                          </button>
                          
                          {/* Move to next status option */}
                          {getNextStatus(task.status) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Check if task can be completed if next status is 'completed'
                                if (getNextStatus(task.status).id === 'completed' && !canTaskBeCompleted(task)) {
                                  alert("This task has dependencies that must be completed first.");
                                  return;
                                }
                                moveToNextStatus(task.id, task.status);
                                toggleDropdown(task.id);
                              }}
                              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <ArrowRight className="mr-3 h-4 w-4" />
                              Move to {getNextStatus(task.status).name}
                            </button>
                          )}
                          
                          {/* Edit option */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditTask(task);
                              toggleDropdown(task.id);
                            }}
                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Edit className="mr-3 h-4 w-4" />
                            Edit
                          </button>
                          
                          {/* Delete option */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteTask(task.id);
                              toggleDropdown(task.id);
                            }}
                            className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash className="mr-3 h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Time tracking indicator */}
                  {trackingTasks.has(task.id) && (
                    <div className="flex items-center text-green-600 text-xs font-medium mb-2 bg-green-50 rounded-full px-2 py-0.5 w-fit">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>Tracking: {formatDuration(trackingTimes[task.id]?.elapsed || 0)}</span>
                    </div>
                  )}
                  
                  {task.description && (
                    <p className="text-sm text-gray-600 mt-1 mb-3 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  {/* Dependency warning */}
                  {showDependencyWarnings && 
                  task.dependencies && 
                  task.dependencies.length > 0 && 
                  task.dependenciesMet === false && (
                    <div className="mt-1 flex items-center text-amber-600 text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      <span>Has unfinished dependencies</span>
                    </div>
                  )}
                  
                  {/* Recurrence indicator */}
                  {showRecurrenceIndicators && 
                  task.recurrence && 
                  task.recurrence.isRecurring && (
                    <div className="mt-1 flex items-center text-indigo-600 text-xs">
                      <RefreshCw className="h-3 w-3 mr-1" />
                      <span>
                        Repeats {task.recurrence.frequency}
                        {task.recurrenceCount > 0 ? `, #${task.recurrenceCount + 1}` : ''}
                      </span>
                    </div>
                  )}
                  
                  {/* Dependencies indicator */}
                  {task.dependencies && task.dependencies.length > 0 && (
                    <div className="mt-1 flex items-center text-gray-600 text-xs">
                      <Link className="h-3 w-3 mr-1" />
                      <span>{task.dependencies.length} dependenc{task.dependencies.length === 1 ? 'y' : 'ies'}</span>
                    </div>
                  )}

                  {/* Attachments indicator */}
                  {task.attachments && task.attachments.length > 0 && (
                    <div className="mt-2 mb-2">
                      <div className="flex items-center text-xs text-indigo-700">
                        <Paperclip className="h-3 w-3 mr-1 text-indigo-500" />
                        <span>{task.attachments.length} attachment{task.attachments.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  )}

                  {/* Assigned to */}
                  {task.assignedTo && task.assignedTo.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2 mb-2">
                      {task.assignedTo.map((assigneeId) => {
                        const isCurrentUser = assigneeId === currentUser?.uid;
                        const memberName = getMemberName(assigneeId);
                        
                        if (!memberName) return null;
                        
                        return (
                          <span 
                            key={assigneeId} 
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              isCurrentUser ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            <User className="h-3 w-3 mr-1" />
                            {isCurrentUser ? 'You' : memberName}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Tags */}
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2 mb-2">
                      {task.tags.map((tag, index) => (
                        <span 
                          key={index} 
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      {task.dueDate && (
                        <div className={`flex items-center text-xs ${
                          isPastDue(task.dueDate) && task.status !== 'completed' 
                            ? 'text-red-600 font-medium' 
                            : 'text-gray-500'
                        }`}>
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDueDate(task.dueDate)}
                          {isPastDue(task.dueDate) && task.status !== 'completed' && ' (Overdue)'}
                        </div>
                      )}
                      
                      {task.priority && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityClass(task.priority)}`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                      )}
                      
                      {/* Time tracking button */}
                      {task.status !== 'completed' && (
                        <button
                          onClick={(e) => toggleTimeTracking(e, task.id)}
                          className={`ml-2 flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            trackingTasks.has(task.id)
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800 hover:bg-indigo-100 hover:text-indigo-800'
                          }`}
                        >
                          {trackingTasks.has(task.id) ? (
                            <>
                              <Square className="h-3 w-3 mr-1" />
                              <span>Stop</span>
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3 mr-1" />
                              <span>Track</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    
                    {/* Quick action button */}
                    {getNextStatus(task.status) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Check if task can be completed if next status is 'completed'
                          if (getNextStatus(task.status).id === 'completed' && !canTaskBeCompleted(task)) {
                            alert("This task has dependencies that must be completed first.");
                            return;
                          }
                          moveToNextStatus(task.id, task.status);
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
                      >
                        <ArrowRight className="h-3 w-3 mr-1" />
                        {getNextStatus(task.status).name}
                        {getNextStatus(task.status).id === 'completed' && !canTaskBeCompleted(task) && (
                          <AlertTriangle className="h-3 w-3 ml-1 text-amber-500" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center h-full">
            <AlertCircle className="h-10 w-10 text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm">No tasks in this status</p>
            <p className="text-gray-400 text-xs mt-1">Drag and drop tasks here</p>
          </div>
        )}
      </div>
      
      {/* Comments modal */}
      <TaskComments 
        taskId={activeCommentsTaskId}
        isOpen={!!activeCommentsTaskId}
        onClose={() => setActiveCommentsTaskId(null)}
      />
    </div>
  );
};

export default TaskList;