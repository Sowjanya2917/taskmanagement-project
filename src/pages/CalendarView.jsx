import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

const CalendarView = ({ tasks, onTaskClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [monthYear, setMonthYear] = useState('');
  
  // Priority colors for visual indication
  const priorityColors = {
    high: 'bg-red-100 border-red-300',
    medium: 'bg-yellow-100 border-yellow-300',
    low: 'bg-green-100 border-green-300'
  };
  
  // Update calendar when currentDate changes
  useEffect(() => {
    generateCalendarDays();
    
    // Set month and year display
    setMonthYear(
      currentDate.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      })
    );
  }, [currentDate, tasks]);
  
  // Generate days for the calendar
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDayOfMonth = new Date(year, month, 1);
    const dayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Last day of the month
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    
    // Generate array of days
    const days = [];
    
    // Add days from previous month to fill the first week
    const daysFromPrevMonth = dayOfWeek;
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthDays - i);
      days.push({ 
        date,
        isCurrentMonth: false
      });
    }
    
    // Add days from current month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true
      });
    }
    
    // Add days from next month to complete the last week
    const remainingDays = 42 - days.length; // 6 rows of 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false
      });
    }
    
    setCalendarDays(days);
  };
  
  // Navigate to previous month
  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  // Navigate to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // Check if a task is on a specific day
  const getTasksForDay = (date) => {
    if (!tasks) return [];
    
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      
      const taskDate = new Date(task.dueDate);
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
    });
  };
  
  // Format date to display
  const formatDate = (date) => {
    return date.getDate();
  };
  
  // Check if date is today
  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };
  
  // Handle task click
  const handleTaskClick = (e, task) => {
    e.stopPropagation();
    if (onTaskClick) {
      onTaskClick(task);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      {/* Calendar header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">{monthYear}</h2>
        
        <div className="flex space-x-2">
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100"
          >
            Today
          </button>
          
          <button
            onClick={goToPrevMonth}
            className="p-1 rounded-md hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          
          <button
            onClick={goToNextMonth}
            className="p-1 rounded-md hover:bg-gray-100"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
          <div key={index} className="h-8 flex items-center justify-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {calendarDays.map((day, index) => {
          const dayTasks = getTasksForDay(day.date);
          const hasTask = dayTasks.length > 0;
          
          return (
            <div 
              key={index} 
              className={`min-h-20 border rounded-md p-1 ${
                day.isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-500'
              } ${
                isToday(day.date) ? 'border-indigo-500 border-2' : 'border-gray-200'
              }`}
            >
              <div className="text-right text-sm font-medium p-1">
                {formatDate(day.date)}
              </div>
              
              <div className="mt-1 overflow-y-auto max-h-20">
                {dayTasks.slice(0, 3).map((task, taskIndex) => (
                  <div
                    key={taskIndex}
                    onClick={(e) => handleTaskClick(e, task)}
                    className={`mb-1 px-2 py-1 text-xs rounded cursor-pointer border-l-2 truncate ${
                      priorityColors[task.priority] || 'bg-gray-100 border-gray-300'
                    } hover:bg-opacity-80`}
                  >
                    {task.title}
                  </div>
                ))}
                
                {dayTasks.length > 3 && (
                  <div 
                    className="text-xs text-center text-gray-500 mt-1 cursor-pointer hover:text-indigo-600"
                    onClick={(e) => handleTaskClick(e, dayTasks[3])}
                  >
                    +{dayTasks.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;