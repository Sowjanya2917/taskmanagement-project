import React, { useState, useEffect } from 'react';
import { useAuth } from "../contexts/AuthContext"
import Navbar from "../components/Navbar"
import TaskForm from './TaskForm';
import TaskList from './TaskList';
import CalendarView from './CalendarView';
import TaskDetailView from './TaskDetailView';
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, deleteDoc, query, where, onSnapshot } from 'firebase/firestore';
import { app } from '../firebase';
import { Plus, Filter, ListFilter, Calendar as CalendarIcon, Tag } from 'lucide-react';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('board'); // 'board' or 'calendar'
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [originStatus, setOriginStatus] = useState(null);
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [detailViewTaskId, setDetailViewTaskId] = useState(null);
  
  const db = getFirestore(app);
  
  // Task statuses
  const statuses = [
    { id: 'not-started', name: 'Not Started' },
    { id: 'in-progress', name: 'In Progress' },
    { id: 'review', name: 'Review' },
    { id: 'completed', name: 'Completed' }
  ];

  // Set up real-time listener for tasks
  useEffect(() => {
    if (!currentUser) return;
    
    setIsLoading(true);
    
    // Real-time listener for tasks
    const q = query(
      collection(db, 'tasks'), 
      where('userId', '==', currentUser.uid)
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const taskList = [];
      const tagSet = new Set();
      
      querySnapshot.forEach((doc) => {
        const taskData = doc.data();
        
        // Add tags to the set
        if (taskData.tags && Array.isArray(taskData.tags)) {
          taskData.tags.forEach(tag => tagSet.add(tag));
        }
        
        taskList.push({
          id: doc.id,
          ...taskData,
          dueDate: taskData.dueDate?.toDate() || null
        });
      });
      
      setTasks(taskList);
      setAvailableTags(Array.from(tagSet));
      setIsLoading(false);
    }, (error) => {
      console.error("Error in tasks listener:", error);
      setIsLoading(false);
    });
    
    // Clean up listener on unmount
    return () => unsubscribe();
  }, [currentUser, db]);

  // Add a new task to Firestore
  const addTask = async (task) => {
    try {
      const taskData = {
        ...task,
        userId: currentUser.uid,
        createdAt: new Date(),
        status: 'not-started' // Default status
      };
      
      await addDoc(collection(db, 'tasks'), taskData);
      setIsFormOpen(false);
      return true;
    } catch (error) {
      console.error('Error adding task:', error);
      return false;
    }
  };

  // Update an existing task
  const updateTask = async (taskId, updatedData) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, updatedData);
      
      setTaskToEdit(null);
      setIsFormOpen(false);
      return true;
    } catch (error) {
      console.error('Error updating task:', error);
      return false;
    }
  };

  // Update task status
  const updateTaskStatus = async (taskId, newStatus) => {
    return updateTask(taskId, { status: newStatus });
  };

  // Delete a task
  const deleteTask = async (taskId) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  };

  // Edit task handler
  const handleEditTask = (task) => {
    setTaskToEdit(task);
    setIsFormOpen(true);
    setDetailViewTaskId(null); // Close detail view if open
  };

  // View task details
  const handleViewTaskDetails = (taskId) => {
    setDetailViewTaskId(taskId);
  };

  // Filter tasks based on current filter and tags
  const getFilteredTasks = () => {
    let filteredTasks = tasks;
    
    // Filter by status if not 'all'
    if (filter !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.status === filter);
    }
    
    // Filter by selected tag if any
    if (selectedTag) {
      filteredTasks = filteredTasks.filter(task => 
        task.tags && task.tags.includes(selectedTag)
      );
    }
    
    return filteredTasks;
  };

  // Drag and drop handlers
  const handleDragStart = (e, taskId, status) => {
    setDraggedTaskId(taskId);
    setOriginStatus(status);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, statusId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Highlight drop area
    const dropZone = e.currentTarget;
    dropZone.classList.add('bg-indigo-50', 'border-indigo-200');
  };

  const handleDragLeave = (e) => {
    // Remove highlight from drop area
    const dropZone = e.currentTarget;
    dropZone.classList.remove('bg-indigo-50', 'border-indigo-200');
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    
    // Remove highlight from drop area
    const dropZone = e.currentTarget;
    dropZone.classList.remove('bg-indigo-50', 'border-indigo-200');
    
    const taskId = e.dataTransfer.getData('text/plain');
    
    // Don't do anything if dropping in the same status
    if (originStatus === targetStatus) {
      return;
    }
    
    // Update task status in Firestore
    await updateTaskStatus(taskId, targetStatus);
  };

  // Handle calendar task click
  const handleCalendarTaskClick = (task) => {
    setDetailViewTaskId(task.id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Task Dashboard</h1>
            <p className="text-gray-600">
              Manage your tasks and track your progress
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
            {/* View toggle */}
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                onClick={() => setViewMode('board')}
                className={`px-4 py-2 text-sm font-medium rounded-l-lg focus:z-10 focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                  viewMode === 'board'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                <ListFilter className="h-4 w-4 inline-block mr-2" />
                Board
              </button>
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 text-sm font-medium rounded-r-lg focus:z-10 focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                  viewMode === 'calendar'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                <CalendarIcon className="h-4 w-4 inline-block mr-2" />
                Calendar
              </button>
            </div>
            
            {/* Filters */}
            <div className="flex space-x-2">
              {/* Status filter */}
              <div className="relative">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
                >
                  <option value="all">All Statuses</option>
                  {statuses.map(status => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              </div>
              
              {/* Tag filter */}
              <div className="relative">
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
                >
                  <option value="">All Tags</option>
                  {availableTags.map(tag => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              </div>
            </div>
            
            {/* New task button */}
            <button
              onClick={() => {
                setTaskToEdit(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </button>
          </div>
        </div>
        
        {/* Task views */}
        {viewMode === 'board' ? (
          // Board view (Kanban)
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {statuses.map(status => (
              <TaskList
                key={status.id}
                status={status}
                tasks={tasks.filter(task => {
                  // Apply tag filter if selected
                  if (selectedTag && (!task.tags || !task.tags.includes(selectedTag))) {
                    return false;
                  }
                  return task.status === status.id;
                })}
                onUpdateStatus={updateTaskStatus}
                onEditTask={handleEditTask}
                onDeleteTask={deleteTask}
                onViewDetails={handleViewTaskDetails}
                statuses={statuses}
                isLoading={isLoading}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              />
            ))}
          </div>
        ) : (
          // Calendar view
          <CalendarView 
            tasks={getFilteredTasks()}
            onTaskClick={handleCalendarTaskClick}
          />
        )}
      </div>
      
      {/* Task creation/edit modal */}
      {isFormOpen && (
        <TaskForm
          onClose={() => {
            setIsFormOpen(false);
            setTaskToEdit(null);
          }}
          onSubmit={taskToEdit ? 
            (data) => updateTask(taskToEdit.id, data) : 
            addTask
          }
          task={taskToEdit}
          availableTags={availableTags}
        />
      )}
      
      {/* Task detail view */}
      {detailViewTaskId && (
        <TaskDetailView
          taskId={detailViewTaskId}
          onClose={() => setDetailViewTaskId(null)}
          onEdit={(task) => {
            setTaskToEdit(task);
            setIsFormOpen(true);
            setDetailViewTaskId(null);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;