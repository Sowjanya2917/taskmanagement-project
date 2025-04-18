import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  PieChart, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  Users, 
  ArrowUp, 
  ArrowDown,
  Briefcase,
  Tag
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc,
  doc 
} from 'firebase/firestore';
import { app } from '../firebase';

// Task Status Colors for Charts
const statusColors = {
  'not-started': '#CBD5E1', // gray-300
  'in-progress': '#93C5FD', // blue-300
  'review': '#C4B5FD', // purple-300 
  'completed': '#86EFAC'  // green-300
};

// Priority Colors for Charts
const priorityColors = {
  'low': '#86EFAC',    // green-300
  'medium': '#FCD34D', // yellow-300
  'high': '#FCA5A5'    // red-300
};

const AnalyticsPage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [taskStats, setTaskStats] = useState({
    total: 0,
    completed: 0,
    overdue: 0,
    upcomingDue: 0,
    statusDistribution: {},
    priorityDistribution: {},
    tagDistribution: {},
    completionTrend: [],
    userPerformance: []
  });
  const [userTeam, setUserTeam] = useState(null);
  const [timeRange, setTimeRange] = useState('month'); // 'week', 'month', 'quarter', 'year'
  
  const db = getFirestore(app);
  
  // Fetch analytics data
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchAnalyticsData = async () => {
      setLoading(true);
      
      try {
        // Check if user has a team
        const userTeamDoc = await getDoc(doc(db, 'userTeams', currentUser.uid));
        const teamId = userTeamDoc.exists() ? userTeamDoc.data().teamId : null;
        
        if (teamId) {
          // Get team details
          const teamDoc = await getDoc(doc(db, 'teams', teamId));
          if (teamDoc.exists()) {
            setUserTeam({
              id: teamId,
              ...teamDoc.data()
            });
          }
        }
        
        // Construct task query based on whether user is in a team
        let tasksQuery;
        if (teamId) {
          tasksQuery = query(
            collection(db, 'tasks'),
            where('teamId', '==', teamId)
          );
        } else {
          tasksQuery = query(
            collection(db, 'tasks'),
            where('userId', '==', currentUser.uid)
          );
        }
        
        // Fetch tasks
        const taskSnapshot = await getDocs(tasksQuery);
        const tasks = taskSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          dueDate: doc.data().dueDate?.toDate() || null
        }));
        
        // Calculate task statistics
        const now = new Date();
        
        // Basic stats
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.status === 'completed').length;
        const overdueTasks = tasks.filter(task => 
          task.dueDate && 
          task.dueDate < now && 
          task.status !== 'completed'
        ).length;
        
        // Calculate upcoming tasks due in next 7 days
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const upcomingDueTasks = tasks.filter(task => 
          task.dueDate && 
          task.dueDate > now && 
          task.dueDate < nextWeek && 
          task.status !== 'completed'
        ).length;
        
        // Status distribution
        const statusDist = {};
        tasks.forEach(task => {
          statusDist[task.status] = (statusDist[task.status] || 0) + 1;
        });
        
        // Priority distribution
        const priorityDist = {};
        tasks.forEach(task => {
          if (task.priority) {
            priorityDist[task.priority] = (priorityDist[task.priority] || 0) + 1;
          }
        });
        
        // Tag distribution
        const tagDist = {};
        tasks.forEach(task => {
          if (task.tags && Array.isArray(task.tags)) {
            task.tags.forEach(tag => {
              tagDist[tag] = (tagDist[tag] || 0) + 1;
            });
          }
        });
        
        // Completion trend (by week)
        // For demo purposes, create mock data that looks realistic
        const completionTrend = [
          { period: 'Week 1', completed: Math.floor(Math.random() * 15) + 5 },
          { period: 'Week 2', completed: Math.floor(Math.random() * 15) + 5 },
          { period: 'Week 3', completed: Math.floor(Math.random() * 15) + 5 },
          { period: 'Week 4', completed: Math.floor(Math.random() * 15) + 5 },
        ];
        
        // User performance
        let userPerformance = [];
        
        if (teamId) {
          // Get all team members
          const teamMembersQuery = query(
            collection(db, 'userTeams'),
            where('teamId', '==', teamId)
          );
          
          const teamMembersSnapshot = await getDocs(teamMembersQuery);
          const teamMembers = teamMembersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // For each team member, calculate tasks stats
          for (const member of teamMembers) {
            const memberTasksQuery = query(
              collection(db, 'tasks'),
              where('assignedTo', 'array-contains', member.id)
            );
            
            const memberTasksSnapshot = await getDocs(memberTasksQuery);
            const memberTasks = memberTasksSnapshot.docs.map(doc => ({
              ...doc.data(),
              dueDate: doc.data().dueDate?.toDate() || null
            }));
            
            // Calculate member stats
            const totalMemberTasks = memberTasks.length;
            const completedMemberTasks = memberTasks.filter(task => task.status === 'completed').length;
            const completionRate = totalMemberTasks > 0 ? (completedMemberTasks / totalMemberTasks) * 100 : 0;
            
            // Calculate on-time completion rate
            let onTimeCompletions = 0;
            memberTasks.forEach(task => {
              if (
                task.status === 'completed' && 
                task.dueDate && 
                new Date(task.completedAt || task.updatedAt) <= task.dueDate
              ) {
                onTimeCompletions++;
              }
            });
            
            const onTimeRate = completedMemberTasks > 0 ? (onTimeCompletions / completedMemberTasks) * 100 : 0;
            
            userPerformance.push({
              userId: member.id,
              name: member.name || member.email,
              email: member.email,
              tasksTotal: totalMemberTasks,
              tasksCompleted: completedMemberTasks,
              completionRate: completionRate,
              onTimeRate: onTimeRate
            });
          }
          
          // Sort by completion rate (descending)
          userPerformance.sort((a, b) => b.completionRate - a.completionRate);
        }
        
        // Set all analytics data
        setTaskStats({
          total: totalTasks,
          completed: completedTasks,
          overdue: overdueTasks,
          upcomingDue: upcomingDueTasks,
          statusDistribution: statusDist,
          priorityDistribution: priorityDist,
          tagDistribution: tagDist,
          completionTrend,
          userPerformance
        });
        
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, [currentUser, db, timeRange]);
  
  // Format percentage
  const formatPercentage = (value) => {
    return `${Math.round(value)}%`;
  };
  
  // Get percentage change class (for showing increases/decreases)
  const getChangeClass = (value) => {
    if (value > 0) return "text-green-600";
    if (value < 0) return "text-red-600";
    return "text-gray-600";
  };
  
  // Get percentage change icon
  const getChangeIcon = (value) => {
    if (value > 0) return <ArrowUp className="h-3 w-3" />;
    if (value < 0) return <ArrowDown className="h-3 w-3" />;
    return null;
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <BarChart2 className="h-6 w-6 mr-2 text-indigo-600" />
              Task Analytics
            </h1>
            <p className="text-gray-600">
              {userTeam ? `Team: ${userTeam.name}` : 'Performance overview and insights'}
            </p>
          </div>
          
          {/* Time range selector */}
          <div className="inline-flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => setTimeRange('week')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg focus:z-10 focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                timeRange === 'week'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('month')}
              className={`px-4 py-2 text-sm font-medium focus:z-10 focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                timeRange === 'month'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-t border-b border-gray-300'
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('quarter')}
              className={`px-4 py-2 text-sm font-medium focus:z-10 focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                timeRange === 'quarter'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-t border-b border-gray-300'
              }`}
            >
              Quarter
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('year')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg focus:z-10 focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                timeRange === 'year'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Year
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <svg className="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-sm font-medium text-gray-500">Total Tasks</h2>
                    <p className="text-2xl font-bold text-gray-900">{taskStats.total}</p>
                    <div className="flex items-center text-xs mt-1">
                      <span className={getChangeClass(5)}>
                        {getChangeIcon(5)}
                        <span className="ml-1">5% from last {timeRange}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 text-green-600">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-sm font-medium text-gray-500">Completed Tasks</h2>
                    <p className="text-2xl font-bold text-gray-900">{taskStats.completed}</p>
                    <div className="flex items-center text-xs mt-1">
                      <span className={getChangeClass(12)}>
                        {getChangeIcon(12)}
                        <span className="ml-1">12% from last {timeRange}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-red-100 text-red-600">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-sm font-medium text-gray-500">Overdue Tasks</h2>
                    <p className="text-2xl font-bold text-gray-900">{taskStats.overdue}</p>
                    <div className="flex items-center text-xs mt-1">
                      <span className={getChangeClass(-8)}>
                        {getChangeIcon(-8)}
                        <span className="ml-1">8% from last {timeRange}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-sm font-medium text-gray-500">Due This Week</h2>
                    <p className="text-2xl font-bold text-gray-900">{taskStats.upcomingDue}</p>
                    <div className="flex items-center text-xs mt-1">
                      <span className={getChangeClass(15)}>
                        {getChangeIcon(15)}
                        <span className="ml-1">15% from last {timeRange}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Task Status Distribution */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Task Status Distribution</h3>
                <div className="h-64 flex items-center justify-center">
                  {/* We'll use a React component for the chart */}
                  <TaskStatusDistributionChart data={taskStats.statusDistribution} />
                </div>
              </div>
              
              {/* Task Priority Distribution */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Task Priority Distribution</h3>
                <div className="h-64 flex items-center justify-center">
                  {/* We'll use a React component for the chart */}
                  <TaskPriorityDistributionChart data={taskStats.priorityDistribution} />
                </div>
              </div>
              
              
              
              {/* Popular Tags */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Popular Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(taskStats.tagDistribution)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 12)
                    .map(([tag, count]) => (
                      <div key={tag} className="flex items-center bg-indigo-50 px-3 py-1 rounded-full">
                        <Tag className="h-4 w-4 text-indigo-600 mr-1" />
                        <span className="text-sm text-indigo-800 mr-1">{tag}</span>
                        <span className="text-xs bg-indigo-100 text-indigo-800 rounded-full px-2">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
            
            {/* Team Performance (only show if user is in a team) */}
            {userTeam && taskStats.userPerformance.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-indigo-600" />
                  Team Performance
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Team Member
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Assigned Tasks
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Completed
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Completion Rate
                        </th>
                        
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {taskStats.userPerformance.map((user) => (
                        <tr key={user.userId} className={user.userId === currentUser.uid ? 'bg-indigo-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-600 font-medium">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.name}
                                  {user.userId === currentUser.uid && (
                                    <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                                      You
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{user.tasksTotal}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{user.tasksCompleted}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full mr-2">
                                <div 
                                  className="h-2 bg-indigo-600 rounded-full" 
                                  style={{ width: `${user.completionRate}%` }}
                                ></div>
                              </div>
                              <div className="text-sm text-gray-900">{formatPercentage(user.completionRate)}</div>
                            </div>
                          </td>
                          
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Productivity Insights */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Productivity Insights</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Time Management</h4>
                  <p className="text-blue-700">
                    {taskStats.overdue > 3 
                      ? "You have several overdue tasks. Consider focusing on these before taking on new work."
                      : "You're keeping up well with deadlines. Great job managing your time effectively!"}
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Task Completion</h4>
                  <p className="text-green-700">
                    {taskStats.total > 0 && (taskStats.completed / taskStats.total) > 0.7
                      ? "Excellent task completion rate! You've finished more than 70% of your tasks."
                      : "Consider breaking down larger tasks into smaller, manageable pieces to improve completion rates."}
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="font-medium text-purple-800 mb-2">Work Distribution</h4>
                  <p className="text-purple-700">
                    {Object.keys(taskStats.priorityDistribution).includes('high') && 
                     taskStats.priorityDistribution['high'] > (taskStats.total * 0.4)
                      ? "You have a high proportion of high-priority tasks. Consider delegating or rescheduling some tasks."
                      : "Your workload has a healthy balance of priorities, which is great for maintaining steady productivity."}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

// Chart Components
const TaskStatusDistributionChart = ({ data }) => {
  // For a real implementation, use a charting library like Recharts
  // Here we'll create a simple bar chart visualization
  const statuses = {
    'not-started': 'Not Started',
    'in-progress': 'In Progress',
    'review': 'Review',
    'completed': 'Completed'
  };
  
  const total = Object.values(data).reduce((sum, count) => sum + count, 0);
  
  return (
    <div className="w-full h-full flex flex-col justify-center">
      {Object.entries(statuses).map(([statusId, statusName]) => {
        const count = data[statusId] || 0;
        const percentage = total > 0 ? (count / total) * 100 : 0;
        
        return (
          <div key={statusId} className="mb-4">
            <div className="flex justify-between mb-1">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: statusColors[statusId] }}
                ></div>
                <span className="text-sm text-gray-700">{statusName}</span>
              </div>
              <span className="text-sm text-gray-700">{count} ({Math.round(percentage)}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="h-2.5 rounded-full" 
                style={{ 
                  width: `${percentage}%`,
                  backgroundColor: statusColors[statusId] 
                }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const TaskPriorityDistributionChart = ({ data }) => {
  // For a real implementation, use a charting library like Recharts
  const priorities = {
    'low': 'Low',
    'medium': 'Medium',
    'high': 'High'
  };
  
  const total = Object.values(data).reduce((sum, count) => sum + count, 0);
  
  return (
    <div className="w-full h-full flex flex-col justify-center">
      {Object.entries(priorities).map(([priorityId, priorityName]) => {
        const count = data[priorityId] || 0;
        const percentage = total > 0 ? (count / total) * 100 : 0;
        
        return (
          <div key={priorityId} className="mb-4">
            <div className="flex justify-between mb-1">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: priorityColors[priorityId] }}
                ></div>
                <span className="text-sm text-gray-700">{priorityName}</span>
              </div>
              <span className="text-sm text-gray-700">{count} ({Math.round(percentage)}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="h-2.5 rounded-full" 
                style={{ 
                  width: `${percentage}%`,
                  backgroundColor: priorityColors[priorityId] 
                }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const CompletionTrendChart = ({ data }) => {
  // For a real implementation, use a charting library like Recharts
  const maxValue = Math.max(...data.map(item => item.completed));
  
  return (
    <div className="w-full h-full flex items-end justify-between">
      {data.map((item, index) => {
        const height = (item.completed / maxValue) * 100;
        
        return (
          <div key={index} className="flex flex-col items-center">
            <div 
              className="w-12 bg-indigo-400 rounded-t-md" 
              style={{ height: `${height}%` }}
            ></div>
            <div className="mt-2 text-xs text-gray-600">{item.period}</div>
            <div className="text-sm font-medium text-gray-800">{item.completed}</div>
          </div>
        );
      })}
    </div>
  );
};

export default AnalyticsPage;