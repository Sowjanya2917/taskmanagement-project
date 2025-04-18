// components/TimeTrackingPanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Edit, Trash2, Plus, Clock, Save, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  startTimeTracking, 
  stopTimeTracking, 
  getTimeEntriesForTask, 
  deleteTimeEntry, 
  editTimeEntry, 
  formatDuration,
  getActiveTimeEntries
} from '../utils/TimeTrackingService';

const TimeTrackingPanel = ({ taskId }) => {
  const { currentUser } = useAuth();
  const [timeEntries, setTimeEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeEntryId, setActiveEntryId] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isEditing, setIsEditing] = useState(null);
  const [editNotes, setEditNotes] = useState('');
  const [newEntryNotes, setNewEntryNotes] = useState('');
  const timerRef = useRef(null);
  
  // Fetch time entries for this task
  useEffect(() => {
    const fetchTimeEntries = async () => {
      if (!taskId || !currentUser) return;
      
      setLoading(true);
      
      try {
        // Get all time entries for this task
        const entries = await getTimeEntriesForTask(taskId);
        setTimeEntries(entries);
        
        // Check if there's an active entry
        const activeEntries = entries.filter(entry => entry.isActive);
        
        if (activeEntries.length > 0) {
          const activeEntry = activeEntries[0];
          setActiveEntryId(activeEntry.id);
          
          // Calculate elapsed time
          const startTime = activeEntry.startTime;
          const now = new Date();
          const elapsed = Math.floor((now - startTime) / 1000);
          setElapsedTime(elapsed);
          
          // Start the timer
          startTimer();
        }
      } catch (error) {
        console.error('Error fetching time entries:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTimeEntries();
    
    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [taskId, currentUser]);
  
  // Start timer function
  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
  };
  
  // Start time tracking
  const handleStartTracking = async () => {
    if (!taskId || !currentUser) return;
    
    try {
      const entryId = await startTimeTracking(taskId, currentUser.uid, newEntryNotes);
      
      if (entryId) {
        setActiveEntryId(entryId);
        setElapsedTime(0);
        startTimer();
        
        // Update the time entries list
        const entries = await getTimeEntriesForTask(taskId);
        setTimeEntries(entries);
        
        // Clear the notes input
        setNewEntryNotes('');
      }
    } catch (error) {
      console.error('Error starting time tracking:', error);
    }
  };
  
  // Stop time tracking
  const handleStopTracking = async () => {
    if (!activeEntryId) return;
    
    try {
      const success = await stopTimeTracking(activeEntryId);
      
      if (success) {
        // Clear the timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        setActiveEntryId(null);
        setElapsedTime(0);
        
        // Update the time entries list
        const entries = await getTimeEntriesForTask(taskId);
        setTimeEntries(entries);
      }
    } catch (error) {
      console.error('Error stopping time tracking:', error);
    }
  };
  
  // Handle deleting a time entry
  const handleDeleteEntry = async (entryId) => {
    if (!entryId) return;
    
    try {
      const success = await deleteTimeEntry(entryId, taskId);
      
      if (success) {
        // Update the time entries list
        const entries = await getTimeEntriesForTask(taskId);
        setTimeEntries(entries);
      }
    } catch (error) {
      console.error('Error deleting time entry:', error);
    }
  };
  
  // Start editing an entry
  const handleStartEditing = (entry) => {
    setIsEditing(entry.id);
    setEditNotes(entry.notes || '');
  };
  
  // Save edited entry
  const handleSaveEdit = async (entryId) => {
    if (!entryId) return;
    
    try {
      const success = await editTimeEntry(entryId, {
        notes: editNotes
      });
      
      if (success) {
        setIsEditing(null);
        
        // Update the time entries list
        const entries = await getTimeEntriesForTask(taskId);
        setTimeEntries(entries);
      }
    } catch (error) {
      console.error('Error editing time entry:', error);
    }
  };
  
  // Format date for display
  const formatDateTime = (date) => {
    if (!date) return '';
    
    return date.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Calculate total time
  const totalTime = timeEntries.reduce((total, entry) => {
    return total + (entry.duration || 0);
  }, 0);
  
  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 border-b bg-gray-50">
        <h3 className="font-medium flex items-center">
          <Clock className="h-4 w-4 mr-1 text-indigo-600" />
          Time Tracking
        </h3>
      </div>
      
      <div className="p-4">
        {/* Time tracking stats */}
        <div className="mb-4 py-3 px-4 bg-indigo-50 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Total Time Tracked</p>
              <p className="text-lg font-semibold text-indigo-700">{formatDuration(totalTime)}</p>
            </div>
            
            {activeEntryId ? (
              <div className="flex flex-col items-end">
                <p className="text-sm text-gray-600">Current Session</p>
                <p className="text-lg font-semibold text-green-600">{formatDuration(elapsedTime)}</p>
              </div>
            ) : null}
          </div>
        </div>
        
        {/* Start/stop tracking controls */}
        <div className="mb-6">
          {activeEntryId ? (
            <div>
              <div className="flex items-center">
                <button 
                  onClick={handleStopTracking}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 flex items-center"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop Tracking
                </button>
                <span className="ml-2 text-sm text-gray-500">
                  Started {timeEntries.find(e => e.id === activeEntryId)?.startTime.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex">
                <input
                  type="text"
                  value={newEntryNotes}
                  onChange={(e) => setNewEntryNotes(e.target.value)}
                  placeholder="What are you working on? (optional)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button 
                  onClick={handleStartTracking}
                  className="px-4 py-2 bg-green-600 text-white rounded-r-md hover:bg-green-700 flex items-center"
                >
                  <Play className="h-4 w-4 mr-1" />
                  Start
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Time entries list */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Time Entries</h4>
          
          {loading ? (
            <div className="py-4 text-center">
              <svg className="animate-spin h-5 w-5 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : timeEntries.length === 0 ? (
            <div className="py-4 text-center text-gray-500">
              No time entries yet
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {timeEntries.map(entry => (
                <div key={entry.id} className={`p-3 border rounded-md ${entry.isActive ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium">
                        {formatDuration(entry.isActive ? elapsedTime : entry.duration)}
                        {entry.isActive && <span className="ml-2 text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">Active</span>}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDateTime(entry.startTime)} 
                        {entry.endTime ? ` to ${formatDateTime(entry.endTime)}` : ''}
                      </div>
                    </div>
                    
                    <div className="flex space-x-1">
                      {!entry.isActive && (
                        <>
                          <button 
                            onClick={() => handleStartEditing(entry)}
                            className="p-1 text-gray-500 hover:text-indigo-600"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="p-1 text-gray-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {isEditing === entry.id ? (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                      <div className="flex justify-end mt-1 space-x-2">
                        <button 
                          onClick={() => setIsEditing(null)}
                          className="px-2 py-1 text-xs text-gray-700"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => handleSaveEdit(entry.id)}
                          className="px-2 py-1 text-xs bg-indigo-600 text-white rounded"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : entry.notes ? (
                    <div className="mt-1 text-sm text-gray-700">{entry.notes}</div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimeTrackingPanel;