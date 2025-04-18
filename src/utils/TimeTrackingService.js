// utils/TimeTrackingService.js
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    orderBy,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp 
  } from 'firebase/firestore';
  import { app } from '../firebase';

  import { getDoc } from 'firebase/firestore';
  
  const db = getFirestore(app);
  
  /**
   * Start tracking time for a task
   * @param {string} taskId - The ID of the task to track
   * @param {string} userId - The ID of the user tracking time
   * @param {string} notes - Optional notes about the time entry
   * @returns {Promise<string|null>} - The ID of the new time entry or null if failed
   */
  export const startTimeTracking = async (taskId, userId, notes = '') => {
    try {
      // Check if there are any active time entries for this user
      const activeEntries = await getActiveTimeEntries(userId);
      
      // If there are active entries, stop them first
      if (activeEntries.length > 0) {
        for (const entry of activeEntries) {
          await stopTimeTracking(entry.id);
        }
      }
      
      // Create a new time entry
      const timeEntryData = {
        taskId,
        userId,
        startTime: new Date(),
        endTime: null,
        duration: 0,
        notes,
        createdAt: serverTimestamp(),
        isActive: true
      };
      
      const timeEntryRef = await addDoc(collection(db, 'timeEntries'), timeEntryData);
      return timeEntryRef.id;
    } catch (error) {
      console.error('Error starting time tracking:', error);
      return null;
    }
  };
  
  /**
   * Stop tracking time for a specific time entry
   * @param {string} timeEntryId - The ID of the time entry
   * @returns {Promise<boolean>} - True if successful
   */
  export const stopTimeTracking = async (timeEntryId) => {
    try {
      const timeEntryRef = doc(db, 'timeEntries', timeEntryId);
      const endTime = new Date();
      
      // Get the current time entry
      const timeEntryDoc = await getDoc(timeEntryRef);
      if (!timeEntryDoc.exists()) {
        return false;
      }
      
      const timeEntry = timeEntryDoc.data();
      const startTime = timeEntry.startTime.toDate();
      
      // Calculate duration in seconds
      const durationInSeconds = Math.floor((endTime - startTime) / 1000);
      
      // Update the time entry
      await updateDoc(timeEntryRef, {
        endTime,
        duration: durationInSeconds,
        isActive: false
      });
      
      // Also update the task with the total time tracked
      await updateTaskTotalTime(timeEntry.taskId);
      
      return true;
    } catch (error) {
      console.error('Error stopping time tracking:', error);
      return false;
    }
  };

  /**
 * Get active time entries for a user
 * @param {string} userId - The ID of the user
 * @returns {Promise<Array>} - Array of active time entries
 */
export const getActiveTimeEntries = async (userId) => {
    try {
      // Check if userId is valid before querying
      if (!userId) {
        console.warn('getActiveTimeEntries called with invalid userId');
        return [];
      }
      
      const q = query(
        collection(db, 'timeEntries'),
        where('userId', '==', userId),
        where('isActive', '==', true)
      );
      
      const timeEntriesSnapshot = await getDocs(q);
      const timeEntries = [];
      
      timeEntriesSnapshot.forEach(doc => {
        timeEntries.push({
          id: doc.id,
          ...doc.data(),
          startTime: doc.data().startTime?.toDate()
        });
      });
      
      return timeEntries;
    } catch (error) {
      console.error('Error getting active time entries:', error);
      return [];
    }
  };
  
  /**
   * Get all time entries for a task
   * @param {string} taskId - The ID of the task
   * @returns {Promise<Array>} - Array of time entries
   */
  export const getTimeEntriesForTask = async (taskId) => {
    try {
      const q = query(
        collection(db, 'timeEntries'),
        where('taskId', '==', taskId),
        orderBy('startTime', 'desc')
      );
      
      const timeEntriesSnapshot = await getDocs(q);
      const timeEntries = [];
      
      timeEntriesSnapshot.forEach(doc => {
        timeEntries.push({
          id: doc.id,
          ...doc.data(),
          startTime: doc.data().startTime?.toDate(),
          endTime: doc.data().endTime?.toDate()
        });
      });
      
      return timeEntries;
    } catch (error) {
      console.error('Error getting time entries:', error);
      return [];
    }
  };
  
  
  
  /**
   * Delete a time entry
   * @param {string} timeEntryId - The ID of the time entry
   * @param {string} taskId - The ID of the associated task
   * @returns {Promise<boolean>} - True if successful
   */
  export const deleteTimeEntry = async (timeEntryId, taskId) => {
    try {
      await deleteDoc(doc(db, 'timeEntries', timeEntryId));
      
      // Update the task's total time
      await updateTaskTotalTime(taskId);
      
      return true;
    } catch (error) {
      console.error('Error deleting time entry:', error);
      return false;
    }
  };
  
  /**
   * Edit a time entry
   * @param {string} timeEntryId - The ID of the time entry
   * @param {Object} updatedData - The data to update
   * @returns {Promise<boolean>} - True if successful
   */
  export const editTimeEntry = async (timeEntryId, updatedData) => {
    try {
      const timeEntryRef = doc(db, 'timeEntries', timeEntryId);
      
      // Get the current time entry
      const timeEntryDoc = await getDoc(timeEntryRef);
      if (!timeEntryDoc.exists()) {
        return false;
      }
      
      const timeEntry = timeEntryDoc.data();
      const taskId = timeEntry.taskId;
      
      // If start or end times are updated, recalculate duration
      let newData = { ...updatedData };
      
      if (updatedData.startTime || updatedData.endTime) {
        const startTime = updatedData.startTime || timeEntry.startTime.toDate();
        const endTime = updatedData.endTime || timeEntry.endTime?.toDate();
        
        if (endTime) {
          // Calculate new duration in seconds
          const durationInSeconds = Math.floor((endTime - startTime) / 1000);
          newData.duration = durationInSeconds;
        }
      }
      
      // Update the time entry
      await updateDoc(timeEntryRef, newData);
      
      // Update the task's total time
      await updateTaskTotalTime(taskId);
      
      return true;
    } catch (error) {
      console.error('Error editing time entry:', error);
      return false;
    }
  };
  
  /**
   * Update the total time tracked for a task
   * @param {string} taskId - The ID of the task
   * @returns {Promise<boolean>} - True if successful
   */
  export const updateTaskTotalTime = async (taskId) => {
    try {
      // Get all time entries for the task
      const timeEntries = await getTimeEntriesForTask(taskId);
      
      // Calculate total duration in seconds
      const totalSeconds = timeEntries.reduce((total, entry) => {
        return total + (entry.duration || 0);
      }, 0);
      
      // Update the task with the total time
      await updateDoc(doc(db, 'tasks', taskId), {
        totalTimeTracked: totalSeconds,
        lastTimeUpdate: new Date()
      });
      
      return true;
    } catch (error) {
      console.error('Error updating task total time:', error);
      return false;
    }
  };
  
  /**
   * Format seconds into a human-readable duration string (HH:MM:SS)
   * @param {number} seconds - Duration in seconds
   * @returns {string} - Formatted duration
   */
  export const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return '--:--:--';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };
  
  /**
   * Get time tracking summary for a user
   * @param {string} userId - The ID of the user
   * @param {Date} startDate - Start date for the summary period
   * @param {Date} endDate - End date for the summary period
   * @returns {Promise<Object>} - Summary of time tracked
   */
  export const getTimeTrackingSummary = async (userId, startDate, endDate) => {
    try {
      // Query to get all time entries for the user in the given period
      const q = query(
        collection(db, 'timeEntries'),
        where('userId', '==', userId),
        where('startTime', '>=', startDate),
        where('startTime', '<=', endDate)
      );
      
      const timeEntriesSnapshot = await getDocs(q);
      
      // Initialize summary object
      const summary = {
        totalDuration: 0,
        entriesCount: 0,
        tasksTracked: new Set(),
        byDay: {},
        byTask: {}
      };
      
      // Process each time entry
      timeEntriesSnapshot.forEach(doc => {
        const entry = doc.data();
        const duration = entry.duration || 0;
        
        // Add to total duration
        summary.totalDuration += duration;
        summary.entriesCount++;
        
        // Add to tasks tracked
        summary.tasksTracked.add(entry.taskId);
        
        // Group by day
        const day = entry.startTime.toDate().toDateString();
        if (!summary.byDay[day]) {
          summary.byDay[day] = 0;
        }
        summary.byDay[day] += duration;
        
        // Group by task
        if (!summary.byTask[entry.taskId]) {
          summary.byTask[entry.taskId] = 0;
        }
        summary.byTask[entry.taskId] += duration;
      });
      
      // Convert the Set to array length
      summary.tasksTracked = summary.tasksTracked.size;
      
      return summary;
    } catch (error) {
      console.error('Error getting time tracking summary:', error);
      return {
        totalDuration: 0,
        entriesCount: 0,
        tasksTracked: 0,
        byDay: {},
        byTask: {}
      };
    }
  };