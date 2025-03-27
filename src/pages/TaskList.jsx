import React, { useState } from 'react';
import { MoreVertical, Clock, ArrowRight, Edit, Trash, AlertCircle, Tag, MessageSquare } from 'lucide-react';
import TaskComments from './TaskComments';

const TaskList = ({ 
  status, 
  tasks, 
  onUpdateStatus, 
  onEditTask, 
  onDeleteTask, 
  statuses,
  isLoading,
  onDragStart,
  onDragOver,
  onDrop
}) => {
  const [activeCommentsTaskId, setActiveCommentsTaskId] = useState(null);
  
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
  
  // Move task to the next status
  const moveToNextStatus = async (taskId, currentStatusId) => {
    const nextStatus = getNextStatus(currentStatusId);
    if (nextStatus) {
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
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li 
                key={task.id} 
                className="p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow cursor-move"
                draggable
                onDragStart={(e) => onDragStart(e, task.id, task.status)}
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
                  
                  <div className="relative">
                    <button 
                      onClick={() => toggleDropdown(task.id)} 
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
                            onClick={() => {
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
                          onClick={() => {
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
                          onClick={() => {
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
                
                {task.description && (
                  <p className="text-sm text-gray-600 mt-1 mb-2 line-clamp-2">
                    {task.description}
                  </p>
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
                
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-2">
                    {task.dueDate && (
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDueDate(task.dueDate)}
                      </div>
                    )}
                    
                    {task.priority && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityClass(task.priority)}`}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      </span>
                    )}
                    
                    {/* Comments button */}
                    <button
                      onClick={(e) => openComments(task.id, e)}
                      className="flex items-center text-xs text-indigo-600 hover:text-indigo-800"
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Comments
                    </button>
                  </div>
                  
                  {/* Quick action button */}
                  {getNextStatus(task.status) && (
                    <button
                      onClick={() => moveToNextStatus(task.id, task.status)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
                    >
                      <ArrowRight className="h-3 w-3 mr-1" />
                      {getNextStatus(task.status).name}
                    </button>
                  )}
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