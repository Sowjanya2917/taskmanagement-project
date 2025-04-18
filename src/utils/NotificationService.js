import { getFirestore, collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { app } from '../firebase';

const db = getFirestore(app);

// Create and send deadline reminders for tasks
export const checkTaskDeadlines = async () => {
  try {
    // Get all active tasks (not completed)
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('status', '!=', 'completed')
    );
    
    const taskSnapshot = await getDocs(tasksQuery);
    const now = new Date();
    
    // Process each task
    for (const taskDoc of taskSnapshot.docs) {
      const task = {
        id: taskDoc.id,
        ...taskDoc.data()
      };
      
      // Skip tasks without due dates
      if (!task.dueDate) continue;
      
      const dueDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
      const timeDiff = dueDate.getTime() - now.getTime();
      const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
      const daysDiff = Math.floor(hoursDiff / 24);
      
      // Determine notification type based on time remaining
      let notificationType = null;
      let notificationMessage = null;
      
      if (hoursDiff <= 1 && hoursDiff > 0) {
        // Due in 1 hour
        notificationType = 'deadline-1hour';
        notificationMessage = `Task "${task.title}" is due in 1 hour`;
      } else if (daysDiff === 1) {
        // Due tomorrow
        notificationType = 'deadline-1day';
        notificationMessage = `Task "${task.title}" is due tomorrow`;
      } else if (daysDiff === 5) {
        // Due in 5 days
        notificationType = 'deadline-5days';
        notificationMessage = `Task "${task.title}" is due in 5 days`;
      } else if (timeDiff < 0 && timeDiff > -86400000) {
        // Overdue (less than 24 hours)
        notificationType = 'deadline-overdue';
        notificationMessage = `Task "${task.title}" is overdue`;
      }
      
      // If notification is needed, create it
      if (notificationType && notificationMessage) {
        // Determine recipients (task creator and assignees)
        const recipients = [task.userId];
        
        if (task.assignedTo && Array.isArray(task.assignedTo)) {
          // Add assigned users (avoiding duplicates)
          task.assignedTo.forEach(userId => {
            if (!recipients.includes(userId)) {
              recipients.push(userId);
            }
          });
        }
        
        // Check if we already sent this notification
        const existingNotificationsQuery = query(
          collection(db, 'notifications'),
          where('taskId', '==', task.id),
          where('type', '==', notificationType)
        );
        
        const existingNotifications = await getDocs(existingNotificationsQuery);
        
        // Only create notification if it doesn't exist
        if (existingNotifications.empty) {
          await addDoc(collection(db, 'notifications'), {
            type: notificationType,
            message: notificationMessage,
            taskId: task.id,
            recipients: recipients,
            createdAt: serverTimestamp(),
            readBy: []
          });
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error checking task deadlines:", error);
    return false;
  }
};

// Create team-wide notification for task completion
export const createTaskCompletionNotification = async (task, userId) => {
  try {
    // Determine recipients (all team members)
    const recipients = [];
    
    // If task has a team ID, notify all team members
    if (task.teamId) {
      const teamMembersQuery = query(
        collection(db, 'userTeams'),
        where('teamId', '==', task.teamId)
      );
      
      const teamMembersSnapshot = await getDocs(teamMembersQuery);
      
      teamMembersSnapshot.forEach(doc => {
        recipients.push(doc.id);
      });
    } else {
      // Otherwise, just notify the task creator
      recipients.push(task.userId);
    }
    
    // Add notification
    await addDoc(collection(db, 'notifications'), {
      type: 'task-completed',
      message: `Task "${task.title}" has been completed`,
      taskId: task.id,
      completedBy: userId,
      recipients: recipients,
      createdAt: serverTimestamp(),
      readBy: []
    });
    
    return true;
  } catch (error) {
    console.error("Error creating task completion notification:", error);
    return false;
  }
};

// Create notification for new comment
export const createCommentNotification = async (comment, taskId, taskTitle) => {
  try {
    // Get the task to determine recipients
    const taskDoc = await getFirestore().doc(`tasks/${taskId}`).get();
    
    if (!taskDoc.exists) {
      console.error("Task not found");
      return false;
    }
    
    const task = taskDoc.data();
    const recipients = [];
    
    // Add task creator
    recipients.push(task.userId);
    
    // Add task assignees
    if (task.assignedTo && Array.isArray(task.assignedTo)) {
      task.assignedTo.forEach(userId => {
        if (!recipients.includes(userId)) {
          recipients.push(userId);
        }
      });
    }
    
    // Remove comment author from recipients to avoid self-notification
    const filteredRecipients = recipients.filter(userId => userId !== comment.userId);
    
    // Create notification
    await addDoc(collection(db, 'notifications'), {
      type: 'new-comment',
      message: `${comment.userName || comment.userEmail} commented on task "${taskTitle}"`,
      taskId: taskId,
      commentId: comment.id,
      commenterId: comment.userId,
      recipients: filteredRecipients,
      createdAt: serverTimestamp(),
      readBy: []
    });
    
    return true;
  } catch (error) {
    console.error("Error creating comment notification:", error);
    return false;
  }
};

// Create notification for file attachment
export const createAttachmentNotification = async (task, fileName, userId, userName) => {
  try {
    const recipients = [];
    
    // Add task creator
    if (task.userId !== userId) {
      recipients.push(task.userId);
    }
    
    // Add task assignees
    if (task.assignedTo && Array.isArray(task.assignedTo)) {
      task.assignedTo.forEach(assigneeId => {
        if (assigneeId !== userId && !recipients.includes(assigneeId)) {
          recipients.push(assigneeId);
        }
      });
    }
    
    // If no recipients, don't create notification
    if (recipients.length === 0) {
      return true;
    }
    
    // Create notification
    await addDoc(collection(db, 'notifications'), {
      type: 'new-attachment',
      message: `${userName} added file "${fileName}" to task "${task.title}"`,
      taskId: task.id,
      uploaderId: userId,
      recipients: recipients,
      createdAt: serverTimestamp(),
      readBy: []
    });
    
    return true;
  } catch (error) {
    console.error("Error creating attachment notification:", error);
    return false;
  }
};

// Create notification for task assignment
export const createAssignmentNotification = async (task, assigneeId, assignerName) => {
  try {
    // Create notification for the assignee
    await addDoc(collection(db, 'notifications'), {
      type: 'task-assigned',
      message: `${assignerName} assigned you to task "${task.title}"`,
      taskId: task.id,
      recipients: [assigneeId],
      createdAt: serverTimestamp(),
      readBy: []
    });
    
    return true;
  } catch (error) {
    console.error("Error creating assignment notification:", error);
    return false;
  }
};