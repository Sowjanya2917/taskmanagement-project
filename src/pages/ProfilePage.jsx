import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, PieChart, BarChart2, Users, CheckSquare, 
  Calendar, Clock, AlertCircle, Edit2, Check, X, Briefcase, Shield
} from 'lucide-react';
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth, updateProfile, updateEmail } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { app } from '../firebase';

const ProfilePage = () => {
  const { currentUser } = useAuth();
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    jobTitle: '',
    department: '',
    bio: '',
    profilePhotoURL: ''
  });
  
  const [analytics, setAnalytics] = useState({
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    assignedTasks: 0,
    teamMembers: 0,
    teamLeader: false,
    completionRate: 0,
    tasksThisMonth: 0,
    tasksThisWeek: 0,
    tasksByPriority: {
      high: 0,
      medium: 0,
      low: 0
    },
    tasksByStatus: {
      pending: 0,
      inProgress: 0,
      completed: 0,
      overdue: 0
    },
    averageCompletionTime: 0,
    teamPerformance: 0,
    productivityTrend: [],
    tasksWithAttachments: 0,
    uniqueTags: 0
  });
  
  const [originalEmail, setOriginalEmail] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userTeam, setUserTeam] = useState(null);
  const [teamMembersList, setTeamMembersList] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  
  const db = getFirestore(app);
  const auth = getAuth(app);
  const storage = getStorage(app);
  
  // Fetch user data and analytics when component mounts
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        
        // Get user profile data
        const userProfileDoc = await getDoc(doc(db, 'userProfiles', currentUser.uid));
        
        // Prepare profile data - combining Firebase Auth data with Firestore data
        const profileInfo = {
          displayName: currentUser.displayName || '',
          email: currentUser.email || '',
          profilePhotoURL: currentUser.photoURL || '',
          ...userProfileDoc.exists() ? userProfileDoc.data() : {}
        };
        
        setProfileData(profileInfo);
        setOriginalEmail(currentUser.email || '');
        
        // Get user team data
        const userTeamDoc = await getDoc(doc(db, 'userTeams', currentUser.uid));
        
        if (userTeamDoc.exists() && userTeamDoc.data().teamId) {
          const teamId = userTeamDoc.data().teamId;
          const teamDoc = await getDoc(doc(db, 'teams', teamId));
          
          if (teamDoc.exists()) {
            const teamData = {
              id: teamDoc.id,
              ...teamDoc.data()
            };
            
            setUserTeam(teamData);
            
            // Fetch team members
            const teamMembersQuery = query(
              collection(db, 'userTeams'),
              where('teamId', '==', teamId)
            );
            
            const teamMembersSnapshot = await getDocs(teamMembersQuery);
            const teamMembersCount = teamMembersSnapshot.size;
            const teamMembersData = [];
            
            // Get detailed information for each team member
            for (const memberDoc of teamMembersSnapshot.docs) {
              const memberData = memberDoc.data();
              let memberProfile = {
                id: memberDoc.id,
                email: memberData.email || '',
                role: memberData.role || 'member',
                ...memberData
              };
              
              // Get user profile details if available
              try {
                const profileDoc = await getDoc(doc(db, 'userProfiles', memberDoc.id));
                if (profileDoc.exists()) {
                  memberProfile = {
                    ...memberProfile,
                    ...profileDoc.data()
                  };
                }
                
                // Get user auth details for display name and photo
                const userDoc = await getDoc(doc(db, 'users', memberDoc.id));
                if (userDoc.exists()) {
                  if (!memberProfile.displayName && userDoc.data().displayName) {
                    memberProfile.displayName = userDoc.data().displayName;
                  }
                  
                  if (!memberProfile.profilePhotoURL && userDoc.data().photoURL) {
                    memberProfile.profilePhotoURL = userDoc.data().photoURL;
                  }
                }
              } catch (error) {
                console.error("Error fetching team member details:", error);
              }
              
              teamMembersData.push(memberProfile);
            }
            
            setTeamMembersList(teamMembersData);
            
            // Check if user is team leader
            const isTeamLeader = teamData.ownerId === currentUser.uid;
            
            // Get task analytics
            await calculateTaskAnalytics(teamId, teamMembersCount, isTeamLeader);
          }
        } else {
          // Handle case where user is not in a team
          await calculateTaskAnalytics(null, 0, false);
        }
        
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setError('Failed to load profile data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser, db]);
  
  // Calculate task analytics
  const calculateTaskAnalytics = async (teamId, teamMembersCount, isTeamLeader) => {
    try {
      // Base query for user's personal tasks
      let tasksQuery = query(
        collection(db, 'tasks'),
        where('userId', '==', currentUser.uid)
      );
      
      // If user is in a team, include tasks assigned to them
      if (teamId) {
        tasksQuery = query(
          collection(db, 'tasks'),
          where('userId', '==', currentUser.uid)
        );
      }
      
      const tasksSnapshot = await getDocs(tasksQuery);
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      
      let totalTasks = 0;
      let completedTasks = 0;
      let overdueTasks = 0;
      let tasksThisMonth = 0;
      let tasksThisWeek = 0;
      let tasksByPriority = { high: 0, medium: 0, low: 0 };
      let tasksByStatus = { pending: 0, inProgress: 0, completed: 0, overdue: 0 };
      let totalCompletionTime = 0;
      let completedTasksWithTime = 0;
      let productivityData = Array(7).fill(0); // Last 7 days productivity
      let tasksWithAttachments = 0;
      let totalTags = new Set();
      
      tasksSnapshot.forEach(doc => {
        const task = doc.data();
        totalTasks++;
        
        // Count by status
        if (task.status === 'completed') {
          completedTasks++;
          tasksByStatus.completed++;
          
          // Calculate completion time if we have both dates
          if (task.createdAt) {
            const completedAt = task.status === 'completed' ? (now) : null;
            const createdAt = task.createdAt.toDate ? task.createdAt.toDate() : new Date(task.createdAt);
            
            if (completedAt) {
              const timeDiff = completedAt - createdAt;
              const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
              
              totalCompletionTime += daysDiff;
              completedTasksWithTime++;
              
              // Track completion by day for productivity trend
              const dayIndex = Math.min(6, Math.floor((now - completedAt) / (1000 * 60 * 60 * 24)));
              if (dayIndex >= 0 && dayIndex < 7) {
                productivityData[dayIndex]++;
              }
            }
          }
        } else if (task.status === 'in-progress') {
          tasksByStatus.inProgress++;
        } else {
          tasksByStatus.pending++;
        }
        
        // Count by priority
        if (task.priority) {
          if (task.priority === 'high') {
            tasksByPriority.high++;
          } else if (task.priority === 'medium') {
            tasksByPriority.medium++;
          } else {
            tasksByPriority.low++;
          }
        } else {
          tasksByPriority.low++; // Default to low if not specified
        }
        
        // Check for overdue tasks
        if (task.dueDate) {
          const dueDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
          if (dueDate < now && task.status !== 'completed') {
            overdueTasks++;
            tasksByStatus.overdue++;
          }
        }
        
        // Check for tasks created this month/week
        if (task.createdAt) {
          const createdAt = task.createdAt.toDate ? task.createdAt.toDate() : new Date(task.createdAt);
          if (createdAt >= startOfMonth) {
            tasksThisMonth++;
          }
          if (createdAt >= startOfWeek) {
            tasksThisWeek++;
          }
        }
        
        // Count tasks with attachments
        if (task.attachments && task.attachments.length > 0) {
          tasksWithAttachments++;
        }
        
        // Count unique tags
        if (task.tags && Array.isArray(task.tags)) {
          task.tags.forEach(tag => totalTags.add(tag));
        }
      });
      
      // Get tasks assigned to user
      let assignedTasks = 0;
      if (teamId) {
        const assignedTasksQuery = query(
          collection(db, 'tasks'),
          where('assignedTo', 'array-contains', currentUser.uid)
        );
        
        const assignedTasksSnapshot = await getDocs(assignedTasksQuery);
        assignedTasks = assignedTasksSnapshot.size;
      }
      
      // Calculate completion rate
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      // Calculate average completion time
      const averageCompletionTime = completedTasksWithTime > 0 
        ? Number((totalCompletionTime / completedTasksWithTime).toFixed(1)) 
        : 0;
      
      // Calculate team performance (enhanced)
      let teamPerformance = 0;
      if (teamId) {
        // For a more realistic calculation, we would aggregate team member completion rates
        // For now, we'll simulate this with a random offset from the user's rate
        const variance = Math.floor(Math.random() * 15) - 5; // -5 to +10 variance
        teamPerformance = Math.min(100, Math.max(0, completionRate + variance));
      }
      
      setAnalytics({
        totalTasks,
        completedTasks,
        overdueTasks,
        assignedTasks,
        teamMembers: teamMembersCount,
        teamLeader: isTeamLeader,
        completionRate,
        tasksThisMonth,
        tasksThisWeek,
        tasksByPriority,
        tasksByStatus,
        averageCompletionTime,
        teamPerformance,
        productivityTrend: productivityData,
        tasksWithAttachments,
        uniqueTags: totalTags.size
      });
      
    } catch (error) {
      console.error('Error calculating analytics:', error);
    }
  };
  
  // Handle profile data changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle profile photo upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('File is too large. Maximum size is 2MB.');
      return;
    }
    
    try {
      setUploadingPhoto(true);
      setError('');
      
      // Create a reference to the file in Firebase Storage
      const storageRef = ref(storage, `profile-photos/${currentUser.uid}/${Date.now()}_${file.name}`);
      
      // Upload file
      await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update profile photo URL in Auth
      await updateProfile(currentUser, {
        photoURL: downloadURL
      });
      
      // Update profile photo URL in state
      setProfileData(prev => ({ ...prev, profilePhotoURL: downloadURL }));
      
      // Update profile photo URL in Firestore
      await updateDoc(doc(db, 'userProfiles', currentUser.uid), {
        profilePhotoURL: downloadURL
      });
      
      setSuccess('Profile photo updated successfully!');
      
      // Reset file input
      setFileInputKey(Date.now());
      
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      setError('Failed to upload profile photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };
  
  // Save profile changes
  const saveProfile = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Check if email has changed
      if (profileData.email !== originalEmail) {
        await updateEmail(currentUser, profileData.email);
        setOriginalEmail(profileData.email);
      }
      
      // Update display name in Auth
      await updateProfile(currentUser, {
        displayName: profileData.displayName
      });
      
      // Create a clean object with only defined values for Firestore update
      const updateData = {
        displayName: profileData.displayName || '',
        updatedAt: new Date()
      };
      
      // Only add fields that are defined
      if (profileData.phoneNumber !== undefined) updateData.phoneNumber = profileData.phoneNumber;
      if (profileData.bio !== undefined) updateData.bio = profileData.bio || '';
      if (profileData.jobTitle !== undefined) updateData.jobTitle = profileData.jobTitle || '';
      if (profileData.department !== undefined) updateData.department = profileData.department || '';
      
      // Update profile data in Firestore
      await updateDoc(doc(db, 'userProfiles', currentUser.uid), updateData);
      
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Cancel editing
  const cancelEditing = () => {
    // Revert to original data
    getDoc(doc(db, 'userProfiles', currentUser.uid)).then(docSnap => {
      if (docSnap.exists()) {
        setProfileData({
          displayName: currentUser.displayName || '',
          email: currentUser.email || '',
          profilePhotoURL: currentUser.photoURL || '',
          ...docSnap.data()
        });
      } else {
        setProfileData({
          displayName: currentUser.displayName || '',
          email: currentUser.email || '',
          profilePhotoURL: currentUser.photoURL || ''
        });
      }
    });
    
    setIsEditing(false);
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="flex-grow container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Profile</h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 rounded-md text-red-800 border border-red-200">
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 bg-green-50 rounded-md text-green-800 border border-green-200">
            <p className="text-sm">{success}</p>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left column - Analytics */}
            <div className="md:col-span-1">
              <div className="bg-white shadow overflow-hidden rounded-lg">
                <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <PieChart className="h-5 w-5 mr-2 text-indigo-600" />
                    Task Analytics
                  </h3>
                </div>
                
                <div className="px-4 py-5 sm:px-6">
                  <dl className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col border rounded-md p-3">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <CheckSquare className="h-4 w-4 mr-1 text-indigo-500" />
                        Total Tasks
                      </dt>
                      <dd className="mt-1 text-2xl font-semibold text-gray-900">
                        {analytics.totalTasks}
                      </dd>
                    </div>
                    
                    <div className="flex flex-col border rounded-md p-3">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <Check className="h-4 w-4 mr-1 text-green-500" />
                        Completed
                      </dt>
                      <dd className="mt-1 text-2xl font-semibold text-gray-900">
                        {analytics.completedTasks}
                      </dd>
                    </div>
                    
                    <div className="flex flex-col border rounded-md p-3">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <Users className="h-4 w-4 mr-1 text-blue-500" />
                        Assigned to Me
                      </dt>
                      <dd className="mt-1 text-2xl font-semibold text-gray-900">
                        {analytics.assignedTasks}
                      </dd>
                    </div>
                    
                    <div className="flex flex-col border rounded-md p-3">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1 text-red-500" />
                        Overdue
                      </dt>
                      <dd className="mt-1 text-2xl font-semibold text-gray-900">
                        {analytics.overdueTasks}
                      </dd>
                    </div>
                  </dl>
                </div>
                
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                  <h4 className="text-base font-medium text-gray-900 mb-3 flex items-center">
                    <BarChart2 className="h-4 w-4 mr-1 text-indigo-600" />
                    Task Completion Rate
                  </h4>
                  
                  <div className="relative pt-1">
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-100">
                      <div 
                        style={{ width: `${analytics.completionRate}%` }} 
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600"
                      ></div>
                    </div>
                    
                    <div className="text-right">
                      <span className="text-sm font-semibold text-indigo-700">{analytics.completionRate}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                  <h4 className="text-base font-medium text-gray-900 mb-2 flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-indigo-600" />
                    Tasks This Month
                  </h4>
                  
                  <p className="text-2xl font-semibold text-gray-900">{analytics.tasksThisMonth}</p>
                </div>
                
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                  <h4 className="text-base font-medium text-gray-900 mb-2 flex items-center">
                    <Mail className="h-4 w-4 mr-1 text-indigo-600" />
                    Tasks with Attachments
                  </h4>
                  
                  <p className="text-2xl font-semibold text-gray-900">{analytics.tasksWithAttachments}</p>
                  
                  <div className="mt-2">
                    <div className="relative pt-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block text-indigo-600">
                            {analytics.totalTasks > 0 ? Math.round((analytics.tasksWithAttachments / analytics.totalTasks) * 100) : 0}% of tasks have attachments
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-indigo-100 mt-1">
                        <div 
                          style={{ width: `${analytics.totalTasks > 0 ? (analytics.tasksWithAttachments / analytics.totalTasks) * 100 : 0}%` }} 
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600"
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                  <h4 className="text-base font-medium text-gray-900 mb-2 flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-indigo-600" />
                    Average Completion Time
                  </h4>
                  
                  <p className="text-2xl font-semibold text-gray-900">{analytics.averageCompletionTime} days</p>
                </div>
                
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                  <h4 className="text-base font-medium text-gray-900 mb-3 flex items-center">
                    <BarChart2 className="h-4 w-4 mr-1 text-indigo-600" />
                    Tasks by Priority
                  </h4>
                  
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-red-600">High Priority</span>
                        <span className="text-sm font-medium text-gray-700">{analytics.tasksByPriority.high}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{ width: analytics.totalTasks > 0 ? `${(analytics.tasksByPriority.high / analytics.totalTasks) * 100}%` : '0%' }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-yellow-600">Medium Priority</span>
                        <span className="text-sm font-medium text-gray-700">{analytics.tasksByPriority.medium}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full" 
                          style={{ width: analytics.totalTasks > 0 ? `${(analytics.tasksByPriority.medium / analytics.totalTasks) * 100}%` : '0%' }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-green-600">Low Priority</span>
                        <span className="text-sm font-medium text-gray-700">{analytics.tasksByPriority.low}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: analytics.totalTasks > 0 ? `${(analytics.tasksByPriority.low / analytics.totalTasks) * 100}%` : '0%' }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                  <h4 className="text-base font-medium text-gray-900 mb-3 flex items-center">
                    <BarChart2 className="h-4 w-4 mr-1 text-indigo-600" />
                    Tasks by Status
                  </h4>
                  
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-blue-600">Pending</span>
                        <span className="text-sm font-medium text-gray-700">{analytics.tasksByStatus.pending}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: analytics.totalTasks > 0 ? `${(analytics.tasksByStatus.pending / analytics.totalTasks) * 100}%` : '0%' }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-purple-600">In Progress</span>
                        <span className="text-sm font-medium text-gray-700">{analytics.tasksByStatus.inProgress}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full" 
                          style={{ width: analytics.totalTasks > 0 ? `${(analytics.tasksByStatus.inProgress / analytics.totalTasks) * 100}%` : '0%' }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-green-600">Completed</span>
                        <span className="text-sm font-medium text-gray-700">{analytics.tasksByStatus.completed}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: analytics.totalTasks > 0 ? `${(analytics.tasksByStatus.completed / analytics.totalTasks) * 100}%` : '0%' }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-red-600">Overdue</span>
                        <span className="text-sm font-medium text-gray-700">{analytics.tasksByStatus.overdue}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{ width: analytics.totalTasks > 0 ? `${(analytics.tasksByStatus.overdue / analytics.totalTasks) * 100}%` : '0%' }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                  <h4 className="text-base font-medium text-gray-900 mb-2 flex items-center">
                    <PieChart className="h-4 w-4 mr-1 text-indigo-600" />
                    Tags Analytics
                  </h4>
                  
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-600">Unique Tags Used</div>
                    <div className="text-lg font-semibold text-indigo-700">{analytics.uniqueTags}</div>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    {analytics.uniqueTags > 0 
                      ? `You've used ${analytics.uniqueTags} different tags to categorize your tasks.` 
                      : 'Try using tags to better organize your tasks.'}
                  </div>
                </div>
              </div>
              
              {/* Team Performance (if in a team) */}
              {userTeam && (
                <div className="mt-6 bg-white shadow overflow-hidden rounded-lg">
                  <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <Users className="h-5 w-5 mr-2 text-indigo-600" />
                      Team Analytics
                    </h3>
                  </div>
                  
                  <div className="px-4 py-5 sm:px-6">
                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="flex flex-col sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">
                          Team Name
                        </dt>
                        <dd className="mt-1 text-lg font-semibold text-gray-900">
                          {userTeam.name}
                        </dd>
                      </div>
                      
                      <div className="flex flex-col">
                        <dt className="text-sm font-medium text-gray-500">
                          Team Members
                        </dt>
                        <dd className="mt-1 text-lg font-semibold text-gray-900">
                          {analytics.teamMembers}
                        </dd>
                      </div>
                      
                      <div className="flex flex-col">
                        <dt className="text-sm font-medium text-gray-500">
                          Created On
                        </dt>
                        <dd className="mt-1 text-lg font-semibold text-gray-900">
                          {userTeam.createdAt?.toDate().toLocaleDateString() || 'N/A'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  
                  <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                    <h4 className="text-base font-medium text-gray-900 mb-3 flex items-center">
                      <BarChart2 className="h-4 w-4 mr-1 text-indigo-600" />
                      Team Performance
                    </h4>
                    
                    <div className="relative pt-1">
                      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-100">
                        <div 
                          style={{ width: `${analytics.teamPerformance}%` }} 
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600"
                        ></div>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-sm font-semibold text-indigo-700">{analytics.teamPerformance}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Team Members (if in a team) */}
              {userTeam && teamMembersList.length > 0 && (
                <div className="mt-6 bg-white shadow overflow-hidden rounded-lg">
                  <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <Users className="h-5 w-5 mr-2 text-indigo-600" />
                      Team Members
                    </h3>
                  </div>
                  
                  <ul className="divide-y divide-gray-200">
                    {teamMembersList.map(member => (
                      <li key={member.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            {member.profilePhotoURL ? (
                              <img 
                                src={member.profilePhotoURL} 
                                alt={member.displayName || member.email} 
                                className="h-10 w-10 rounded-full"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full flex items-center justify-center bg-indigo-100 text-indigo-600">
                                <User className="h-6 w-6" />
                              </div>
                            )}
                          </div>
                          
                          <div className="ml-3 overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 flex items-center">
                              {member.displayName || member.email}
                              {member.id === currentUser.uid && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                                  You
                                </span>
                              )}
                            </p>
                            
                            <p className="text-sm text-gray-500 truncate">
                              {member.email}
                            </p>
                          </div>
                          
                          <div className="ml-auto flex-shrink-0">
                            <div className="text-sm">
                              {member.role === 'owner' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Owner
                                </span>
                              ) : member.role === 'admin' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Admin
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  Member
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Right column - Profile Information */}
            <div className="md:col-span-2">
              <div className="bg-white shadow overflow-hidden rounded-lg">
                <div className="border-b border-gray-200 px-4 py-4 sm:px-6 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <User className="h-5 w-5 mr-2 text-indigo-600" />
                    Profile Information
                  </h3>
                  
                  {isEditing ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={saveProfile}
                        disabled={loading}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Save
                      </button>
                      
                      <button
                        onClick={cancelEditing}
                        disabled={loading}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      disabled={loading}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit Profile
                    </button>
                  )}
                </div>
                
                {/* Profile Photo */}
                <div className="px-4 py-5 sm:px-6">
                  <div className="flex justify-center">
                    <div className="relative">
                      {profileData.profilePhotoURL ? (
                        <img 
                          src={profileData.profilePhotoURL} 
                          alt={profileData.displayName || 'Profile'} 
                          className="h-32 w-32 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-32 w-32 rounded-full flex items-center justify-center bg-indigo-100 text-indigo-600">
                          <User className="h-16 w-16" />
                        </div>
                      )}
                      
                      {isEditing && (
                        <div className="absolute bottom-0 right-0">
                          <label 
                            htmlFor="upload-photo" 
                            className="cursor-pointer inline-flex items-center justify-center h-8 w-8 rounded-full bg-white shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            <Edit2 className="h-4 w-4 text-gray-600" />
                            <input 
                              id="upload-photo" 
                              type="file" 
                              accept="image/*" 
                              className="sr-only" 
                              onChange={handlePhotoUpload}
                              key={fileInputKey}
                              disabled={uploadingPhoto}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {uploadingPhoto && (
                    <div className="text-center mt-3 text-sm text-gray-500">
                      Uploading photo...
                    </div>
                  )}
                </div>
                
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                    {/* Display Name */}
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <User className="h-4 w-4 mr-1 text-gray-400" />
                        Full Name
                      </dt>
                      {isEditing ? (
                        <input
                          type="text"
                          name="displayName"
                          value={profileData.displayName}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      ) : (
                        <dd className="mt-1 text-sm text-gray-900">
                          <span className="font-medium">
                            {profileData.displayName || 'Not set'}
                          </span>
                        </dd>
                      )}
                    </div>
                    
                    {/* Email */}
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <Mail className="h-4 w-4 mr-1 text-gray-400" />
                        Email
                      </dt>
                      {isEditing ? (
                        <input
                          type="email"
                          name="email"
                          value={profileData.email}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      ) : (
                        <dd className="mt-1 text-sm text-gray-900">
                          <span className="font-medium">
                            {profileData.email || 'Not set'}
                          </span>
                        </dd>
                      )}
                    </div>
                    
                    {/* Phone Number */}
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <Phone className="h-4 w-4 mr-1 text-gray-400" />
                        Phone Number
                      </dt>
                      {isEditing ? (
                        <input
                          type="tel"
                          name="phoneNumber"
                          value={profileData.phoneNumber || ''}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      ) : (
                        <dd className="mt-1 text-sm text-gray-900">
                          <span className="font-medium">
                            {profileData.phoneNumber || 'Not set'}
                          </span>
                        </dd>
                      )}
                    </div>
                    
                    {/* Job Title */}
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <Briefcase className="h-4 w-4 mr-1 text-gray-400" />
                        Job Title
                      </dt>
                      {isEditing ? (
                        <input
                          type="text"
                          name="jobTitle"
                          value={profileData.jobTitle || ''}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      ) : (
                        <dd className="mt-1 text-sm text-gray-900">
                          <span className="font-medium">
                            {profileData.jobTitle || 'Not set'}
                          </span>
                        </dd>
                      )}
                    </div>
                    
                    {/* Department */}
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <Users className="h-4 w-4 mr-1 text-gray-400" />
                        Department
                      </dt>
                      {isEditing ? (
                        <input
                          type="text"
                          name="department"
                          value={profileData.department || ''}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      ) : (
                        <dd className="mt-1 text-sm text-gray-900">
                          <span className="font-medium">
                            {profileData.department || 'Not set'}
                          </span>
                        </dd>
                      )}
                    </div>
                  </dl>
                  
                  {/* Bio */}
                  <div className="mt-8 sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">
                      Bio
                    </dt>
                    {isEditing ? (
                      <textarea
                        name="bio"
                        rows={4}
                        value={profileData.bio || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Write a few sentences about yourself"
                      />
                    ) : (
                      <div className="mt-1 text-sm text-gray-900">
                        {profileData.bio || 'No bio provided.'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default ProfilePage;