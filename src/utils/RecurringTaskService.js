// utils/RecurringTaskService.js
import { 
    getFirestore, 
    collection, 
    getDocs, 
    query, 
    where, 
    addDoc,
    updateDoc,
    doc, 
    getDoc,
    serverTimestamp 
  } from 'firebase/firestore';
  import { app } from '../firebase';
  
  const db = getFirestore(app);
  
  /**
   * Creates the next occurrence of a recurring task
   * @param {Object} task - The original task object
   * @returns {Promise<string|null>} - The new task ID or null if not created
   */
  export const createNextRecurrence = async (task) => {
    try {
      // First check if task is recurring
      if (!task.recurrence || !task.recurrence.isRecurring) {
        return null;
      }
      
      // Check if task has reached its end conditions
      if (hasReachedEndCondition(task)) {
        console.log(`Task ${task.id} has reached its end condition. No new instance created.`);
        return null;
      }
      
      // Calculate next due date based on recurrence pattern
      const nextDueDate = calculateNextDueDate(task);
      if (!nextDueDate) {
        console.log(`Could not calculate next due date for task ${task.id}`);
        return null;
      }
      
      // Create a new task based on the original one
      const newTaskData = {
        title: task.title,
        description: task.description,
        priority: task.priority,
        tags: task.tags || [],
        userId: task.userId,
        createdBy: task.createdBy, 
        teamId: task.teamId || null,
        assignedTo: task.assignedTo || [],
        attachments: task.attachments || [],
        status: 'not-started',
        dependencies: task.dependencies || [],
        dueDate: nextDueDate,
        recurrence: task.recurrence,
        createdAt: serverTimestamp(),
        parentTaskId: task.id, // Reference to the original task
        recurrenceCount: (task.recurrenceCount || 0) + 1
      };
      
      // Add the new task to Firestore
      const newTaskRef = await addDoc(collection(db, 'tasks'), newTaskData);
      console.log(`Created recurring task: ${newTaskRef.id}`);
      
      // Update the original task to record that a new instance was created
      await updateDoc(doc(db, 'tasks', task.id), {
        hasNextRecurrence: true,
        nextRecurrenceId: newTaskRef.id,
        lastRecurrenceDate: new Date()
      });
      
      return newTaskRef.id;
    } catch (error) {
      console.error('Error creating recurring task:', error);
      return null;
    }
  };
  
  /**
   * Checks if a recurring task has reached its end condition
   * @param {Object} task - The task to check
   * @returns {boolean} - True if the task should not recur anymore
   */
  const hasReachedEndCondition = (task) => {
    if (!task.recurrence || !task.recurrence.isRecurring) {
      return true;
    }
    
    // Check if number of occurrences limit is reached
    if (task.recurrence.endAfter !== null) {
      if ((task.recurrenceCount || 0) >= task.recurrence.endAfter) {
        return true;
      }
    }
    
    // Check if end date is reached
    if (task.recurrence.endDate) {
      const endDate = task.recurrence.endDate instanceof Date 
        ? task.recurrence.endDate 
        : new Date(task.recurrence.endDate);
        
      const now = new Date();
      if (now >= endDate) {
        return true;
      }
    }
    
    return false;
  };
  
  /**
   * Calculates the next due date based on recurrence pattern
   * @param {Object} task - The task with recurrence info
   * @returns {Date|null} - The next due date or null if invalid
   */
  const calculateNextDueDate = (task) => {
    if (!task.dueDate || !task.recurrence) {
      return null;
    }
    
    const { frequency, interval } = task.recurrence;
    const currentDueDate = task.dueDate instanceof Date 
      ? task.dueDate 
      : new Date(task.dueDate);
    
    const nextDueDate = new Date(currentDueDate);
    
    switch (frequency) {
      case 'daily':
        nextDueDate.setDate(nextDueDate.getDate() + interval);
        break;
        
      case 'weekly':
        nextDueDate.setDate(nextDueDate.getDate() + (interval * 7));
        break;
        
      case 'monthly':
        // Move forward by the specified number of months
        nextDueDate.setMonth(nextDueDate.getMonth() + interval);
        
        // Handle edge cases for months with fewer days
        const originalDay = currentDueDate.getDate();
        const newMonth = nextDueDate.getMonth();
        const lastDayOfMonth = new Date(nextDueDate.getFullYear(), newMonth + 1, 0).getDate();
        
        if (originalDay > lastDayOfMonth) {
          nextDueDate.setDate(lastDayOfMonth);
        }
        break;
        
      case 'yearly':
        nextDueDate.setFullYear(nextDueDate.getFullYear() + interval);
        break;
        
      default:
        return null;
    }
    
    return nextDueDate;
  };
  
  /**
   * Process all completed recurring tasks and create new instances where appropriate
   * This function would typically be called on a schedule (e.g., daily)
   */
  export const processRecurringTasks = async () => {
    try {
      // Find all completed tasks with recurrence
      const completedRecurringTasksQuery = query(
        collection(db, 'tasks'),
        where('status', '==', 'completed'),
        where('recurrence.isRecurring', '==', true)
      );
      
      const tasksSnapshot = await getDocs(completedRecurringTasksQuery);
      let newTasksCreated = 0;
      
      // Process each completed recurring task
      for (const taskDoc of tasksSnapshot.docs) {
        const task = {
          id: taskDoc.id,
          ...taskDoc.data(),
          // Ensure date objects are properly converted
          dueDate: taskDoc.data().dueDate?.toDate ? taskDoc.data().dueDate.toDate() : taskDoc.data().dueDate,
          recurrence: {
            ...taskDoc.data().recurrence,
            endDate: taskDoc.data().recurrence?.endDate?.toDate 
              ? taskDoc.data().recurrence.endDate.toDate() 
              : taskDoc.data().recurrence?.endDate
          }
        };
        
        // Skip if this task already has a next recurrence created
        if (task.hasNextRecurrence) {
          continue;
        }
        
        // Create the next occurrence
        const newTaskId = await createNextRecurrence(task);
        if (newTaskId) {
          newTasksCreated++;
        }
      }
      
      console.log(`Processed recurring tasks: ${newTasksCreated} new tasks created`);
      return newTasksCreated;
    } catch (error) {
      console.error('Error processing recurring tasks:', error);
      return 0;
    }
  };
  
  /**
   * Check if a task can be started based on its dependencies
   * @param {string} taskId - The ID of the task to check
   * @returns {Promise<boolean>} - True if all dependencies are completed
   */
  export const canTaskBeStarted = async (taskId) => {
    try {
      const taskDoc = await getDoc(doc(db, 'tasks', taskId));
      if (!taskDoc.exists()) {
        return false;
      }
      
      const task = taskDoc.data();
      
      // If no dependencies, task can be started
      if (!task.dependencies || task.dependencies.length === 0) {
        return true;
      }
      
      // Check each dependency
      const dependenciesCompleted = await Promise.all(
        task.dependencies.map(async (dependency) => {
          const depDoc = await getDoc(doc(db, 'tasks', dependency.id));
          if (!depDoc.exists()) {
            return false; // Dependency doesn't exist
          }
          
          return depDoc.data().status === 'completed';
        })
      );
      
      // All dependencies must be completed
      return dependenciesCompleted.every(completed => completed === true);
    } catch (error) {
      console.error(`Error checking if task ${taskId} can be started:`, error);
      return false;
    }
  };
  
  /**
   * Update tasks with dependency status
   * This marks tasks as ready to start when all dependencies are completed
   */
  export const updateDependencyStatuses = async () => {
    try {
      // Find all non-completed tasks that have dependencies
      const tasksWithDependenciesQuery = query(
        collection(db, 'tasks'),
        where('status', '!=', 'completed')
      );
      
      const tasksSnapshot = await getDocs(tasksWithDependenciesQuery);
      let tasksUpdated = 0;
      
      for (const taskDoc of tasksSnapshot.docs) {
        const task = taskDoc.data();
        
        // Skip tasks without dependencies
        if (!task.dependencies || task.dependencies.length === 0) {
          continue;
        }
        
        const canStart = await canTaskBeStarted(taskDoc.id);
        
        // Update the task's dependenciesMet status if it's changed
        if (task.dependenciesMet !== canStart) {
          await updateDoc(doc(db, 'tasks', taskDoc.id), {
            dependenciesMet: canStart
          });
          tasksUpdated++;
        }
      }
      
      console.log(`Updated dependency status for ${tasksUpdated} tasks`);
      return tasksUpdated;
    } catch (error) {
      console.error('Error updating dependency statuses:', error);
      return 0;
    }
  };