'use client';

import React from 'react';
import { Workflow, Task } from '@/context/workflow/WorkflowContext';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { format, parseISO } from 'date-fns';

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title
);

interface ReportVisualizationsProps {
  workflow: Workflow;
}

export default function ReportVisualizations({ workflow }: ReportVisualizationsProps) {
  // Task status distribution data
  const taskStatusData = {
    labels: ['Not Started', 'In Progress', 'Completed', 'Blocked'],
    datasets: [
      {
        label: 'Task Status',
        data: [
          workflow.tasks.filter(task => task.status === 'not_started').length,
          workflow.tasks.filter(task => task.status === 'in_progress').length,
          workflow.tasks.filter(task => task.status === 'completed').length,
          workflow.tasks.filter(task => task.status === 'blocked').length,
        ],
        backgroundColor: [
          'rgba(156, 163, 175, 0.6)', // gray
          'rgba(59, 130, 246, 0.6)',  // blue
          'rgba(16, 185, 129, 0.6)',  // green
          'rgba(239, 68, 68, 0.6)',   // red
        ],
        borderColor: [
          'rgba(156, 163, 175, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Time spent per task data
  const taskTimeData = {
    labels: workflow.tasks.map(task => task.title),
    datasets: [
      {
        label: 'Time Spent (hours)',
        data: workflow.tasks.map(task => {
          const totalSeconds = task.timeEntries.reduce(
            (sum, entry) => sum + (entry.duration || 0),
            0
          );
          return +(totalSeconds / 3600).toFixed(2); // Convert to hours and fix to 2 decimal places
        }),
        backgroundColor: 'rgba(79, 70, 229, 0.6)', // indigo
        borderColor: 'rgba(79, 70, 229, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Time tracking over time data
  const generateTimeTrackingData = () => {
    // Collect all time entries
    const allTimeEntries = workflow.tasks.flatMap(task => 
      task.timeEntries.map(entry => ({
        ...entry,
        taskTitle: task.title,
      }))
    );
    
    // Sort by start time
    allTimeEntries.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    
    // Group by day
    const dailyTimeMap: Record<string, number> = {};
    
    allTimeEntries.forEach(entry => {
      if (entry.duration) {
        const date = format(new Date(entry.startTime), 'yyyy-MM-dd');
        
        if (!dailyTimeMap[date]) {
          dailyTimeMap[date] = 0;
        }
        
        dailyTimeMap[date] += entry.duration;
      }
    });
    
    // Convert to array and sort by date
    const dailyTime = Object.entries(dailyTimeMap)
      .map(([date, seconds]) => ({
        date,
        hours: +(seconds / 3600).toFixed(2),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return {
      labels: dailyTime.map(item => format(parseISO(item.date), 'MMM d')),
      datasets: [
        {
          label: 'Daily Time Spent (hours)',
          data: dailyTime.map(item => item.hours),
          borderColor: 'rgba(14, 165, 233, 1)', // sky blue
          backgroundColor: 'rgba(14, 165, 233, 0.2)',
          tension: 0.4,
          fill: true,
        },
      ],
    };
  };

  const timeTrackingData = generateTimeTrackingData();

  // Task priority distribution data
  const taskPriorityData = {
    labels: ['Low', 'Medium', 'High', 'Urgent'],
    datasets: [
      {
        label: 'Task Priority',
        data: [
          workflow.tasks.filter(task => task.priority === 'low').length,
          workflow.tasks.filter(task => task.priority === 'medium').length,
          workflow.tasks.filter(task => task.priority === 'high').length,
          workflow.tasks.filter(task => task.priority === 'urgent').length,
        ],
        backgroundColor: [
          'rgba(156, 163, 175, 0.6)', // gray
          'rgba(250, 204, 21, 0.6)',  // yellow
          'rgba(249, 115, 22, 0.6)',  // orange
          'rgba(239, 68, 68, 0.6)',   // red
        ],
        borderColor: [
          'rgba(156, 163, 175, 1)',
          'rgba(250, 204, 21, 1)',
          'rgba(249, 115, 22, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Workflow Visualizations</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Task Status Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Task Status Distribution</h3>
          <div className="h-64">
            <Pie 
              data={taskStatusData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </div>
        </div>
        
        {/* Task Priority Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Task Priority Distribution</h3>
          <div className="h-64">
            <Pie 
              data={taskPriorityData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </div>
        </div>
        
        {/* Time Spent per Task */}
        <div className="bg-white rounded-lg shadow-md p-6 col-span-1 md:col-span-2">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Time Spent per Task (hours)</h3>
          <div className="h-80">
            <Bar 
              data={taskTimeData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Hours',
                    },
                  },
                  x: {
                    ticks: {
                      maxRotation: 45,
                      minRotation: 45,
                    },
                  },
                },
              }}
            />
          </div>
        </div>
        
        {/* Time Tracking Over Time */}
        <div className="bg-white rounded-lg shadow-md p-6 col-span-1 md:col-span-2">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Daily Time Tracking (hours)</h3>
          <div className="h-80">
            <Line 
              data={timeTrackingData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Hours',
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
