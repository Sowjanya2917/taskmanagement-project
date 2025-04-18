// import React, { useState, useEffect } from 'react';
// import { X, Calendar, Tag, Plus, Users } from 'lucide-react';
// import { useAuth } from "../contexts/AuthContext"
// import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
// import { app } from "../firebase"

// const TaskForm = ({ onClose, onSubmit, task, availableTags = [] }) => {
//   const { currentUser } = useAuth();
//   const [formData, setFormData] = useState({
//     title: '',
//     description: '',
//     dueDate: '',
//     priority: 'medium',
//     tags: [],
//     assignedTo: [],
//     teamId: null
//   });
  
//   const [errors, setErrors] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [tagInput, setTagInput] = useState('');
//   const [showTagInput, setShowTagInput] = useState(false);
//   const [teamMembers, setTeamMembers] = useState([]);
//   const [userTeam, setUserTeam] = useState(null);
  
//   const db = getFirestore(app);
  
//   // Fetch team information
//   useEffect(() => {
//     if (!currentUser) return;
    
//     const fetchTeamData = async () => {
//       try {
//         // Check if user has a team
//         const userTeamDoc = await getDoc(doc(db, 'userTeams', currentUser.uid));
        
//         if (userTeamDoc.exists() && userTeamDoc.data().teamId) {
//           const teamId = userTeamDoc.data().teamId;
          
//           // Get team details
//           const teamDoc = await getDoc(doc(db, 'teams', teamId));
          
//           if (teamDoc.exists()) {
//             setUserTeam({
//               id: teamDoc.id,
//               ...teamDoc.data()
//             });
            
//             // Fetch team members
//             const q = query(
//               collection(db, 'userTeams'),
//               where('teamId', '==', teamId)
//             );
            
//             const querySnapshot = await getDocs(q);
//             const members = [];
            
//             querySnapshot.forEach((doc) => {
//               // Don't include current user in the list
//               if (doc.id !== currentUser.uid) {
//                 members.push({
//                   id: doc.id,
//                   ...doc.data()
//                 });
//               }
//             });
            
//             setTeamMembers(members);
            
//             // Update form data with team ID
//             setFormData(prevData => ({
//               ...prevData,
//               teamId: teamId
//             }));
//           }
//         }
//       } catch (error) {
//         console.error("Error fetching team data:", error);
//       }
//     };
    
//     fetchTeamData();
//   }, [currentUser, db]);
  
//   // Initialize form with task data if editing
//   useEffect(() => {
//     if (task) {
//       setFormData({
//         title: task.title || '',
//         description: task.description || '',
//         dueDate: task.dueDate ? formatDateForInput(task.dueDate) : '',
//         priority: task.priority || 'medium',
//         tags: task.tags || [],
//         assignedTo: task.assignedTo || [],
//         teamId: task.teamId || null
//       });
//     }
//   }, [task]);
  
//   // Format date for the input field
//   const formatDateForInput = (date) => {
//     if (!date) return '';
//     const d = new Date(date);
//     return d.toISOString().split('T')[0];
//   };
  
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({
//       ...formData,
//       [name]: value
//     });
    
//     // Clear error when user types
//     if (errors[name]) {
//       setErrors({
//         ...errors,
//         [name]: ''
//       });
//     }
//   };
  
//   // Handle tag input
//   const handleTagInputChange = (e) => {
//     setTagInput(e.target.value);
//   };

//   // Add a tag
//   const addTag = () => {
//     const trimmedTag = tagInput.trim();
//     if (trimmedTag && !formData.tags.includes(trimmedTag)) {
//       setFormData({
//         ...formData,
//         tags: [...formData.tags, trimmedTag]
//       });
//       setTagInput('');
//     }
//   };

//   // Add tag when Enter is pressed
//   const handleTagKeyDown = (e) => {
//     if (e.key === 'Enter') {
//       e.preventDefault();
//       addTag();
//     }
//   };

//   // Remove a tag
//   const removeTag = (tagToRemove) => {
//     setFormData({
//       ...formData,
//       tags: formData.tags.filter(tag => tag !== tagToRemove)
//     });
//   };

//   // Add an existing tag
//   const addExistingTag = (tag) => {
//     if (!formData.tags.includes(tag)) {
//       setFormData({
//         ...formData,
//         tags: [...formData.tags, tag]
//       });
//     }
//   };
  
//   // Toggle task assignment to a team member
//   const toggleAssignment = (memberId) => {
//     if (formData.assignedTo.includes(memberId)) {
//       // Remove member
//       setFormData({
//         ...formData,
//         assignedTo: formData.assignedTo.filter(id => id !== memberId)
//       });
//     } else {
//       // Add member
//       setFormData({
//         ...formData,
//         assignedTo: [...formData.assignedTo, memberId]
//       });
//     }
//   };
  
//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     // Validation
//     const newErrors = {};
//     if (!formData.title.trim()) {
//       newErrors.title = 'Title is required';
//     }
    
//     if (Object.keys(newErrors).length > 0) {
//       setErrors(newErrors);
//       return;
//     }
    
//     setLoading(true);
    
//     // Process date for Firestore
//     const processedData = {
//       ...formData,
//       dueDate: formData.dueDate ? new Date(formData.dueDate) : null
//     };
    
//     try {
//       const success = await onSubmit(processedData);
//       if (success) {
//         onClose();
//       }
//     } catch (error) {
//       console.error('Error saving task:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle click outside to close modal
//   const handleClickOutside = (e) => {
//     if (e.target.classList.contains('modal-backdrop')) {
//       onClose();
//     }
//   };
  
//   return (
//     <div 
//       className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 modal-backdrop"
//       onClick={handleClickOutside}
//     >
//       <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
//         <div className="flex justify-between items-center px-6 py-4 bg-indigo-50 border-b">
//           <h3 className="text-lg font-medium text-indigo-900">
//             {task ? 'Edit Task' : 'Create New Task'}
//           </h3>
//           <button
//             onClick={onClose}
//             className="text-gray-500 hover:text-gray-700 focus:outline-none"
//           >
//             <X className="h-5 w-5" />
//           </button>
//         </div>
        
//         <form onSubmit={handleSubmit} className="px-6 py-4">
//           <div className="space-y-4">
//             {/* Title field */}
//             <div>
//               <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
//                 Task Title *
//               </label>
//               <input
//                 type="text"
//                 id="title"
//                 name="title"
//                 value={formData.title}
//                 onChange={handleChange}
//                 className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
//                   errors.title ? 'border-red-500' : 'border-gray-300'
//                 }`}
//                 placeholder="What needs to be done?"
//                 disabled={loading}
//               />
//               {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
//             </div>
            
//             {/* Description field */}
//             <div>
//               <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
//                 Description
//               </label>
//               <textarea
//                 id="description"
//                 name="description"
//                 value={formData.description}
//                 onChange={handleChange}
//                 rows={3}
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
//                 placeholder="Add details about this task..."
//                 disabled={loading}
//               />
//             </div>
            
//             {/* Due date field */}
//             <div>
//               <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
//                 Due Date
//               </label>
//               <div className="relative">
//                 <input
//                   type="date"
//                   id="dueDate"
//                   name="dueDate"
//                   value={formData.dueDate}
//                   onChange={handleChange}
//                   className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
//                   disabled={loading}
//                 />
//                 <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
//               </div>
//             </div>
            
//             {/* Tags field */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Tags
//               </label>
              
//               {/* Display selected tags */}
//               <div className="flex flex-wrap gap-2 mb-2">
//                 {formData.tags.map((tag, index) => (
//                   <span 
//                     key={index} 
//                     className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
//                   >
//                     {tag}
//                     <button 
//                       type="button" 
//                       onClick={() => removeTag(tag)}
//                       className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-indigo-200 text-indigo-500 hover:bg-indigo-300"
//                     >
//                       <X className="h-3 w-3" />
//                     </button>
//                   </span>
//                 ))}
//               </div>
              
//               {/* Tag input */}
//               {showTagInput ? (
//                 <div className="flex items-center">
//                   <div className="relative flex-grow">
//                     <input
//                       type="text"
//                       value={tagInput}
//                       onChange={handleTagInputChange}
//                       onKeyDown={handleTagKeyDown}
//                       placeholder="Add tag and press Enter"
//                       className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
//                       disabled={loading}
//                     />
//                     <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
//                   </div>
//                   <button
//                     type="button"
//                     onClick={addTag}
//                     className="ml-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//                   >
//                     Add
//                   </button>
//                 </div>
//               ) : (
//                 <button
//                   type="button"
//                   onClick={() => setShowTagInput(true)}
//                   className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//                 >
//                   <Plus className="h-4 w-4 mr-2" />
//                   Add Tag
//                 </button>
//               )}
              
//               {/* Suggested tags */}
//               {availableTags.length > 0 && (
//                 <div className="mt-2">
//                   <p className="text-xs text-gray-500 mb-1">Suggested tags:</p>
//                   <div className="flex flex-wrap gap-1">
//                     {availableTags
//                       .filter(tag => !formData.tags.includes(tag))
//                       .map((tag, index) => (
//                         <button
//                           key={index}
//                           type="button"
//                           onClick={() => addExistingTag(tag)}
//                           className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
//                         >
//                           {tag}
//                         </button>
//                       ))}
//                   </div>
//                 </div>
//               )}
//             </div>
            
//             {/* Team assignment section */}
//             {userTeam && teamMembers.length > 0 && (
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   <div className="flex items-center">
//                     <Users className="h-4 w-4 mr-1" />
//                     Assign to Team Members
//                   </div>
//                 </label>
                
//                 <div className="space-y-2 mt-2">
//                   {teamMembers.map(member => (
//                     <div 
//                       key={member.id}
//                       className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${
//                         formData.assignedTo.includes(member.id) 
//                           ? 'bg-indigo-50 border border-indigo-200' 
//                           : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
//                       }`}
//                       onClick={() => toggleAssignment(member.id)}
//                     >
//                       <div>
//                         <div className="text-sm font-medium">{member.name || member.email}</div>
//                         {member.name && <div className="text-xs text-gray-500">{member.email}</div>}
//                       </div>
                      
//                       <div className={`h-4 w-4 rounded-full ${
//                         formData.assignedTo.includes(member.id) 
//                           ? 'bg-indigo-600' 
//                           : 'bg-gray-300'
//                       }`}>
//                         {formData.assignedTo.includes(member.id) && (
//                           <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white">
//                             <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//                           </svg>
//                         )}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
            
//             {/* Priority selection */}
//             <div>
//               <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
//                 Priority
//               </label>
//               <div className="grid grid-cols-3 gap-3">
//                 <button
//                   type="button"
//                   onClick={() => setFormData({ ...formData, priority: 'low' })}
//                   className={`py-2 px-4 rounded-md text-sm font-medium border ${
//                     formData.priority === 'low'
//                       ? 'bg-green-50 border-green-500 text-green-700'
//                       : 'border-gray-300 text-gray-700 hover:bg-gray-50'
//                   }`}
//                   disabled={loading}
//                 >
//                   Low
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => setFormData({ ...formData, priority: 'medium' })}
//                   className={`py-2 px-4 rounded-md text-sm font-medium border ${
//                     formData.priority === 'medium'
//                       ? 'bg-yellow-50 border-yellow-500 text-yellow-700'
//                       : 'border-gray-300 text-gray-700 hover:bg-gray-50'
//                   }`}
//                   disabled={loading}
//                 >
//                   Medium
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => setFormData({ ...formData, priority: 'high' })}
//                   className={`py-2 px-4 rounded-md text-sm font-medium border ${
//                     formData.priority === 'high'
//                       ? 'bg-red-50 border-red-500 text-red-700'
//                       : 'border-gray-300 text-gray-700 hover:bg-gray-50'
//                   }`}
//                   disabled={loading}
//                 >
//                   High
//                 </button>
//               </div>
//             </div>
//           </div>
          
//           <div className="mt-6 flex justify-end space-x-3">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//               disabled={loading}
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
//                 loading ? 'opacity-70 cursor-not-allowed' : ''
//               }`}
//               disabled={loading}
//             >
//               {loading ? (
//                 <>
//                   <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                   </svg>
//                   Saving...
//                 </>
//               ) : task ? 'Update Task' : 'Create Task'}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default TaskForm;
import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Tag, Plus, Users, File, Upload, FileText, Image, FileSpreadsheet, Presentation } from 'lucide-react';
import { useAuth } from "../contexts/AuthContext"
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from "../firebase"

const TaskForm = ({ onClose, onSubmit, task, availableTags = [] }) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    tags: [],
    assignedTo: [],
    teamId: null,
    attachments: []
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [userTeam, setUserTeam] = useState(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  
  const db = getFirestore(app);
  const storage = getStorage(app);
  
  // Allowed file types
  const allowedFileTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', // Images
    'application/pdf', // PDF
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // XLSX
  ];
  
  // Fetch team information
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchTeamData = async () => {
      try {
        // Check if user has a team
        const userTeamDoc = await getDoc(doc(db, 'userTeams', currentUser.uid));
        
        if (userTeamDoc.exists() && userTeamDoc.data().teamId) {
          const teamId = userTeamDoc.data().teamId;
          
          // Get team details
          const teamDoc = await getDoc(doc(db, 'teams', teamId));
          
          if (teamDoc.exists()) {
            setUserTeam({
              id: teamDoc.id,
              ...teamDoc.data()
            });
            
            // Fetch team members
            const q = query(
              collection(db, 'userTeams'),
              where('teamId', '==', teamId)
            );
            
            const querySnapshot = await getDocs(q);
            const members = [];
            
            querySnapshot.forEach((doc) => {
              // Don't include current user in the list
              if (doc.id !== currentUser.uid) {
                members.push({
                  id: doc.id,
                  ...doc.data()
                });
              }
            });
            
            setTeamMembers(members);
            
            // Update form data with team ID
            setFormData(prevData => ({
              ...prevData,
              teamId: teamId
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching team data:", error);
      }
    };
    
    fetchTeamData();
  }, [currentUser, db]);
  
  // Initialize form with task data if editing
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        dueDate: task.dueDate ? formatDateForInput(task.dueDate) : '',
        priority: task.priority || 'medium',
        tags: task.tags || [],
        assignedTo: task.assignedTo || [],
        teamId: task.teamId || null,
        attachments: task.attachments || []
      });
    }
  }, [task]);
  
  // Format date for the input field
  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  // Handle tag input
  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };

  // Add a tag
  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, trimmedTag]
      });
      setTagInput('');
    }
  };

  // Add tag when Enter is pressed
  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  // Remove a tag
  const removeTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  // Add an existing tag
  const addExistingTag = (tag) => {
    if (!formData.tags.includes(tag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag]
      });
    }
  };
  
  // Toggle task assignment to a team member
  const toggleAssignment = (memberId) => {
    if (formData.assignedTo.includes(memberId)) {
      // Remove member
      setFormData({
        ...formData,
        assignedTo: formData.assignedTo.filter(id => id !== memberId)
      });
    } else {
      // Add member
      setFormData({
        ...formData,
        assignedTo: [...formData.assignedTo, memberId]
      });
    }
  };
  
  // Get file icon based on type
  const getFileIcon = (fileType) => {
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
  
 // Handle file selection
const handleFileSelect = async (e) => {
  const files = Array.from(e.target.files);
  
  if (files.length === 0) return;
  
  setUploadingFiles(true);
  setUploadProgress(0);
  
  try {
    const newAttachments = [];
    let completedUploads = 0;
    
    for (const file of files) {
      // Validate file type
      if (!allowedFileTypes.includes(file.type)) {
        console.error(`File type ${file.type} not allowed`);
        continue;
      }
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        console.error(`File ${file.name} exceeds 10MB limit`);
        continue;
      }
      
      // Create a reference to the file in Firebase Storage
      const storageRef = ref(storage, `task-attachments/${currentUser.uid}/${Date.now()}_${file.name}`);
      
      // Upload file
      await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Add to attachments
      newAttachments.push({
        name: file.name,
        type: file.type,
        url: downloadURL,
        size: file.size,
        uploadedAt: new Date()
      });
      
      // If this is an update to an existing task, create notification
      if (task && task.id) {
        // Import the notification service
        const { createAttachmentNotification } = await import('../utils/NotificationService');
        
        // Create notification
        await createAttachmentNotification(
          task,
          file.name,
          currentUser.uid,
          currentUser.displayName || currentUser.email
        );
      }
      
      // Update progress
      completedUploads++;
      setUploadProgress(Math.round((completedUploads / files.length) * 100));
    }
    
    // Update form data with new attachments
    setFormData(prevData => ({
      ...prevData,
      attachments: [...prevData.attachments, ...newAttachments]
    }));
    
  } catch (error) {
    console.error("Error uploading files:", error);
  } finally {
    setUploadingFiles(false);
    setUploadProgress(0);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }
};
  
  // Remove attachment
  const removeAttachment = (index) => {
    setFormData(prevData => ({
      ...prevData,
      attachments: prevData.attachments.filter((_, i) => i !== index)
    }));
  };
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setLoading(true);
    
    // Process date for Firestore
    const processedData = {
      ...formData,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : null
    };
    
    try {
      const success = await onSubmit(processedData);
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle click outside to close modal
  const handleClickOutside = (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      onClose();
    }
  };
  
  return (
    <div 
      className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 modal-backdrop"
      onClick={handleClickOutside}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center px-6 py-4 bg-indigo-600 border-b">
          <h3 className="text-lg font-medium text-white">
            {task ? 'Edit Task' : 'Create New Task'}
          </h3>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="px-6 py-4 max-h-[80vh] overflow-y-auto">
          <div className="space-y-4">
            {/* Title field */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Task Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="What needs to be done?"
                disabled={loading}
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>
            
            {/* Description field */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Add details about this task..."
                disabled={loading}
              />
            </div>
            
            {/* Due date field */}
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  disabled={loading}
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>
            
            {/* File upload section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attachments
              </label>
              
              {/* Display current attachments */}
              {formData.attachments.length > 0 && (
                <div className="mb-3">
                  <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
                    {formData.attachments.map((file, index) => (
                      <li key={index} className="px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100">
                        <div className="flex items-center">
                          {getFileIcon(file.type)}
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900 truncate max-w-xs">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <a 
                            href={file.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 mr-2"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Upload progress */}
              {uploadingFiles && (
                <div className="mb-3">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-indigo-600 h-2.5 rounded-full" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Uploading: {uploadProgress}%</p>
                </div>
              )}
              
              {/* File input */}
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                    >
                      <span>Upload files</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        multiple
                        onChange={handleFileSelect}
                        disabled={loading || uploadingFiles}
                        ref={fileInputRef}
                        accept=".jpg,.jpeg,.png,.gif,.pdf,.docx,.pptx,.xlsx"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF up to 10MB, or PDF, DOCX, PPTX, XLSX
                  </p>
                </div>
              </div>
            </div>
            
            {/* Tags field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              
              {/* Display selected tags */}
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag, index) => (
                  <span 
                    key={index} 
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                  >
                    {tag}
                    <button 
                      type="button" 
                      onClick={() => removeTag(tag)}
                      className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-indigo-200 text-indigo-500 hover:bg-indigo-300"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              
              {/* Tag input */}
              {showTagInput ? (
                <div className="flex items-center">
                  <div className="relative flex-grow">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={handleTagInputChange}
                      onKeyDown={handleTagKeyDown}
                      placeholder="Add tag and press Enter"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      disabled={loading}
                    />
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                  <button
                    type="button"
                    onClick={addTag}
                    className="ml-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowTagInput(true)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tag
                </button>
              )}
              
              {/* Suggested tags */}
              {availableTags.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Suggested tags:</p>
                  <div className="flex flex-wrap gap-1">
                    {availableTags
                      .filter(tag => !formData.tags.includes(tag))
                      .map((tag, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => addExistingTag(tag)}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
                        >
                          {tag}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Team assignment section */}
            {userTeam && teamMembers.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    Assign to Team Members
                  </div>
                </label>
                
                <div className="space-y-2 mt-2">
                  {teamMembers.map(member => (
                    <div 
                      key={member.id}
                      className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${
                        formData.assignedTo.includes(member.id) 
                          ? 'bg-indigo-50 border border-indigo-200' 
                          : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => toggleAssignment(member.id)}
                    >
                      <div>
                        <div className="text-sm font-medium">{member.name || member.email}</div>
                        {member.name && <div className="text-xs text-gray-500">{member.email}</div>}
                      </div>
                      
                      <div className={`h-4 w-4 rounded-full ${
                        formData.assignedTo.includes(member.id) 
                          ? 'bg-indigo-600' 
                          : 'bg-gray-300'
                      }`}>
                        {formData.assignedTo.includes(member.id) && (
                          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white">
                            <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Priority selection */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: 'low' })}
                  className={`py-2 px-4 rounded-md text-sm font-medium border ${
                    formData.priority === 'low'
                      ? 'bg-green-50 border-green-500 text-green-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  disabled={loading}
                >
                  Low
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: 'medium' })}
                  className={`py-2 px-4 rounded-md text-sm font-medium border ${
                    formData.priority === 'medium'
                      ? 'bg-yellow-50 border-yellow-500 text-yellow-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  disabled={loading}
                >
                  Medium
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: 'high' })}
                  className={`py-2 px-4 rounded-md text-sm font-medium border ${
                    formData.priority === 'high'
                      ? 'bg-red-50 border-red-500 text-red-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  disabled={loading}
                >
                  High
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;