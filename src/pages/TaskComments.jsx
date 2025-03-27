import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2 } from 'lucide-react';
import { useAuth } from "../contexts/AuthContext"
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  doc,
  deleteDoc
} from 'firebase/firestore';
import { app } from "../firebase"

const TaskComments = ({ taskId, isOpen, onClose, embedded = false }) => {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const db = getFirestore(app);
  
  // Fetch comments when the component mounts or taskId changes
  useEffect(() => {
    if (!taskId || !isOpen) return;
    
    setIsLoading(true);
    
    // Set up real-time listener for comments
    const q = query(
      collection(db, 'comments'),
      where('taskId', '==', taskId),
      orderBy('createdAt', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const commentsList = [];
      querySnapshot.forEach((doc) => {
        commentsList.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        });
      });
      
      setComments(commentsList);
      setIsLoading(false);
    }, (error) => {
      console.error("Error in comments listener:", error);
      setIsLoading(false);
    });
    
    // Clean up listener on unmount
    return () => unsubscribe();
  }, [taskId, isOpen, db]);
  
  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const commentDate = new Date(date);
    const commentDay = new Date(commentDate.getFullYear(), commentDate.getMonth(), commentDate.getDate());
    
    // If it's today, show the time
    if (commentDay.getTime() === today.getTime()) {
      return `Today at ${commentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // If it's yesterday, show "Yesterday"
    if (commentDay.getTime() === yesterday.getTime()) {
      return `Yesterday at ${commentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Otherwise, show the full date
    return commentDate.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Add a new comment
  const addComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim() || !taskId || !currentUser) return;
    
    setIsSubmitting(true);
    
    try {
      // Create comment in Firestore
      await addDoc(collection(db, 'comments'), {
        taskId,
        userId: currentUser.uid,
        userName: currentUser.displayName || 'User',
        userEmail: currentUser.email,
        text: newComment.trim(),
        createdAt: serverTimestamp()
      });
      
      // Clear the input
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Delete a comment
  const deleteComment = async (commentId) => {
    if (!commentId) return;
    
    try {
      await deleteDoc(doc(db, 'comments', commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };
  
  // Handle clicking outside the modal to close it
  const handleClickOutside = (e) => {
    if (!embedded && e.target.classList.contains('modal-backdrop')) {
      onClose();
    }
  };
  
  if (!isOpen) return null;
  
  // If embedded is true, we're using this in the TaskDetailView
  if (embedded) {
    return (
      <div className="flex flex-col h-full">
        {/* Comments list */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div className="font-medium text-indigo-800">{comment.userName || comment.userEmail}</div>
                    
                    {/* Only show delete button for the comment author */}
                    {currentUser && currentUser.uid === comment.userId && (
                      <button 
                        onClick={() => deleteComment(comment.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-1">{formatDate(comment.createdAt)}</div>
                  <div className="text-gray-700 whitespace-pre-wrap">{comment.text}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
              <MessageSquare className="h-12 w-12 mb-2 text-gray-300" />
              <p>No comments yet</p>
              <p className="text-sm">Be the first to add a comment</p>
            </div>
          )}
        </div>
        
        {/* New comment form */}
        <div className="border-t p-4">
          <form onSubmit={addComment} className="flex items-end">
            <div className="flex-1 mr-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none overflow-hidden"
                rows={2}
                disabled={isSubmitting}
              />
            </div>
            <button
              type="submit"
              className={`p-2 rounded-lg ${
                newComment.trim() && !isSubmitting 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!newComment.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }
  
  // Standard modal version
  return (
    <div 
      className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 modal-backdrop"
      onClick={handleClickOutside}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 flex flex-col h-[80vh]" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-indigo-50">
          <h3 className="text-lg font-medium text-indigo-900 flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Comments
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            &times;
          </button>
        </div>
        
        {/* Comments list */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div className="font-medium text-indigo-800">{comment.userName || comment.userEmail}</div>
                    
                    {/* Only show delete button for the comment author */}
                    {currentUser && currentUser.uid === comment.userId && (
                      <button 
                        onClick={() => deleteComment(comment.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-1">{formatDate(comment.createdAt)}</div>
                  <div className="text-gray-700 whitespace-pre-wrap">{comment.text}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
              <MessageSquare className="h-12 w-12 mb-2 text-gray-300" />
              <p>No comments yet</p>
              <p className="text-sm">Be the first to add a comment</p>
            </div>
          )}
        </div>
        
        {/* New comment form */}
        <div className="border-t p-4">
          <form onSubmit={addComment} className="flex items-end">
            <div className="flex-1 mr-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none overflow-hidden"
                rows={2}
                disabled={isSubmitting}
              />
            </div>
            <button
              type="submit"
              className={`p-2 rounded-lg ${
                newComment.trim() && !isSubmitting 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!newComment.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskComments;