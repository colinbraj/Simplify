'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { WorkflowProvider, useWorkflowStore } from '@/context/workflow/WorkflowContext';
import { Task } from '@/types';
import { 
  ArrowLeftIcon, 
  ClockIcon, 
  CalendarIcon,
  UserIcon,
  CheckIcon,
  PlayIcon,
  PauseIcon,
  PlusIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import Modal from '@/components/common/Modal';
import TaskForm from '@/components/workflows/TaskForm';

function WorkflowDetail() {
  const params = useParams();
  const router = useRouter();
  const { workflows, currentWorkflow, setCurrentWorkflow, updateTask, startTaskTimer, stopTaskTimer, updateTaskTools, updateTaskManualTime, deleteTask } = useWorkflowStore();
  const [activeTimeEntries, setActiveTimeEntries] = useState<Record<string, string>>({});
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  
  // Find the workflow by ID
  useEffect(() => {
    if (params.id) {
      const workflowId = Array.isArray(params.id) ? params.id[0] : params.id;
      const workflow = workflows.find(w => w.id === workflowId);
      
      if (workflow) {
        setCurrentWorkflow(workflow);
      } else {
        // Workflow not found, redirect to workflows list
        router.push('/workflows');
      }
    }
  }, [params.id, workflows, setCurrentWorkflow, router]);

  // Initialize active time entries
  useEffect(() => {
    if (currentWorkflow) {
      const entries: Record<string, string> = {};
      
      currentWorkflow.tasks.forEach(task => {
        const activeEntryCurrent = task.methodComparison?.currentMethod?.timeEntries.find(entry => entry.endTime === null);
        const activeEntryAI = task.methodComparison?.aiMethod?.timeEntries.find(entry => entry.endTime === null);
        
        if (activeEntryCurrent) {
          entries[`current-${task.id}`] = activeEntryCurrent.id;
        }
        
        if (activeEntryAI) {
          entries[`ai-${task.id}`] = activeEntryAI.id;
        }
      });
      
      setActiveTimeEntries(entries);
    }
  }, [currentWorkflow]);

  // Handle starting a timer for a task
  const handleStartTimer = (taskId: string, method: 'currentMethod' | 'aiMethod') => {
    if (!currentWorkflow) return;
    
    const timeEntryId = startTaskTimer(currentWorkflow.id, taskId, method);
    setActiveTimeEntries(prev => ({
      ...prev,
      [`${method === 'currentMethod' ? 'current' : 'ai'}-${taskId}`]: timeEntryId,
    }));
  };

  // Handle stopping a timer for a task
  const handleStopTimer = (taskId: string, method: 'currentMethod' | 'aiMethod') => {
    const entryKey = `${method === 'currentMethod' ? 'current' : 'ai'}-${taskId}`;
    if (!currentWorkflow || !activeTimeEntries[entryKey]) return;
    
    stopTaskTimer(currentWorkflow.id, taskId, activeTimeEntries[entryKey], method);
    setActiveTimeEntries((prev) => {
      const newEntries = { ...prev };
      delete newEntries[entryKey];
      return newEntries;
    });
  };

  // Handle task status change
  const handleStatusChange = (taskId: string, status: 'not_started' | 'in_progress' | 'completed' | 'blocked', method: 'currentMethod' | 'aiMethod') => {
    if (!currentWorkflow) return;
    
    updateTask(currentWorkflow.id, taskId, { status }, method);
  };

  // Handle tools update
  const handleToolsUpdate = (taskId: string, tools: string, method: 'currentMethod' | 'aiMethod') => {
    if (!currentWorkflow) return;
    
    const toolsArray = tools.split(',').map(tool => tool.trim()).filter(Boolean);
    updateTaskTools(currentWorkflow.id, taskId, toolsArray, method);
  };

  // Handle manual time update
  const handleManualTimeUpdate = (taskId: string, timeStr: string, method: 'currentMethod' | 'aiMethod') => {
    if (!currentWorkflow) return;
    
    // Convert time string (minutes) to seconds
    const minutes = parseInt(timeStr, 10);
    const seconds = isNaN(minutes) ? null : minutes * 60;
    updateTaskManualTime(currentWorkflow.id, taskId, seconds, method);
  };

  // Handle task edit
  const [editingTask, setEditingTask] = useState<string | null>(null);
  
  const handleEditTask = (taskId: string) => {
    setEditingTask(taskId);
    setIsTaskModalOpen(true);
  };

  // Handle task delete
  const handleDeleteTask = (taskId: string) => {
    if (!currentWorkflow) return;
    
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTask(currentWorkflow.id, taskId);
    }
  };

  // Calculate workflow progress
  const calculateProgress = () => {
    if (!currentWorkflow || currentWorkflow.tasks.length === 0) return 0;
    
    const completedTasks = currentWorkflow.tasks.filter(task => {
      // Check if methodComparison exists and both methods are completed
      return task.methodComparison && 
             task.methodComparison.currentMethod && 
             task.methodComparison.aiMethod && 
             task.methodComparison.currentMethod.status === 'completed' && 
             task.methodComparison.aiMethod.status === 'completed';
    }).length;
    
    return (completedTasks / currentWorkflow.tasks.length) * 100;
  };

  // Format time duration in hours and minutes
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0m';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    
    return `${minutes}m`;
  };

  // Calculate total time spent on workflow (both methods combined)
  const calculateTotalTime = () => {
    if (!currentWorkflow) return 0;
    
    return currentWorkflow.tasks.reduce((total, task) => {
      // Current method time from timer entries
      const taskTimeCurrent = task.methodComparison?.currentMethod?.timeEntries.reduce((sum, entry) => {
        return sum + (entry.duration || 0);
      }, 0);
      
      // Current method manual time
      const manualTimeCurrent = task.methodComparison?.currentMethod?.manualTime || 0;
      
      // AI method time from timer entries
      const taskTimeAI = task.methodComparison?.aiMethod?.timeEntries.reduce((sum, entry) => {
        return sum + (entry.duration || 0);
      }, 0);
      
      // AI method manual time
      const manualTimeAI = task.methodComparison?.aiMethod?.manualTime || 0;
      
      // Sum all time sources
      return total + taskTimeCurrent + taskTimeAI + manualTimeCurrent + manualTimeAI;
    }, 0);
  };
  
  // Calculate total time for Current Method only
  const calculateTotalTimeCurrentMethod = () => {
    if (!currentWorkflow) return 0;
    
    return currentWorkflow.tasks.reduce((total, task) => {
      // Current method time from timer entries
      const taskTimeCurrent = task.methodComparison?.currentMethod?.timeEntries.reduce((sum, entry) => {
        return sum + (entry.duration || 0);
      }, 0);
      
      // Current method manual time
      const manualTimeCurrent = task.methodComparison?.currentMethod?.manualTime || 0;
      
      // Sum current method time sources
      return total + taskTimeCurrent + manualTimeCurrent;
    }, 0);
  };
  
  // Calculate total time for AI Method only
  const calculateTotalTimeAIMethod = () => {
    if (!currentWorkflow) return 0;
    
    return currentWorkflow.tasks.reduce((total, task) => {
      // AI method time from timer entries
      const taskTimeAI = task.methodComparison?.aiMethod?.timeEntries.reduce((sum, entry) => {
        return sum + (entry.duration || 0);
      }, 0);
      
      // AI method manual time
      const manualTimeAI = task.methodComparison?.aiMethod?.manualTime || 0;
      
      // Sum AI method time sources
      return total + taskTimeAI + manualTimeAI;
    }, 0);
  };

  // Open task modal
  const openTaskModal = () => {
    setIsTaskModalOpen(true);
  };

  // Close task modal
  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
  };

  // Handle task creation success
  const handleTaskCreationSuccess = () => {
    closeTaskModal();
  };
  
  // Access the workflow store
  const { workflowCreation } = useWorkflowStore();

  if (!currentWorkflow) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading workflow...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link href="/workflows" className="text-gray-600 hover:text-primary mr-3">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">{currentWorkflow.title}</h1>
        </div>
        
        <p className="text-gray-600 mb-4">{currentWorkflow.description}</p>
        
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 flex-1">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Progress</h3>
            <div className="flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                <div 
                  className="bg-primary h-2.5 rounded-full" 
                  style={{ width: `${calculateProgress()}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium">{Math.round(calculateProgress())}%</span>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 flex-1">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total time</h3>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Current Method</p>
                <p className="font-semibold flex items-center justify-center">
                  <ClockIcon className="h-4 w-4 mr-1 text-purple-500" />
                  {formatDuration(calculateTotalTimeCurrentMethod())}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">AI Method</p>
                <p className="font-semibold flex items-center justify-center">
                  <ClockIcon className="h-4 w-4 mr-1 text-blue-500" />
                  {formatDuration(calculateTotalTimeAIMethod())}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 flex-1">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Created</h3>
            <p className="text-lg font-semibold flex items-center">
              <CalendarIcon className="h-5 w-5 mr-1 text-gray-400" />
              {format(new Date(currentWorkflow.createdAt), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-6">
          <button 
            onClick={openTaskModal}
            className="btn btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            Add Task
          </button>
          
          <Link 
            href={`/workflows/${currentWorkflow.id}/report`}
            className="btn btn-outline flex items-center"
          >
            <ChartBarIcon className="h-5 w-5 mr-1" />
            Generate Report
          </Link>
        </div>
      </div>
      
      {/* Tasks */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Tasks</h2>
        </div>
        
        <div className="divide-y">
          {currentWorkflow.tasks.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>No tasks in this workflow yet</p>
              <button 
                onClick={openTaskModal}
                className="mt-2 btn btn-sm btn-primary flex items-center mx-auto"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Your First Task
              </button>
            </div>
          ) : (
            currentWorkflow.tasks.map(task => {
              const isTimerActiveCurrent = activeTimeEntries[`current-${task.id}`];
              const isTimerActiveAI = activeTimeEntries[`ai-${task.id}`];
              
              // Calculate total time spent on this task
              const totalTimeCurrent = task.methodComparison?.currentMethod?.timeEntries.reduce((sum, entry) => {
                return sum + (entry.duration || 0);
              }, 0);
              
              const totalTimeAI = task.methodComparison?.aiMethod?.timeEntries.reduce((sum, entry) => {
                return sum + (entry.duration || 0);
              }, 0);
              
              return (
                <div key={task.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start mb-2">
                    <div className={`w-3 h-3 rounded-full mt-1.5 mr-3 ${
                      task.methodComparison?.currentMethod?.status === 'completed' && task.methodComparison?.aiMethod?.status === 'completed' ? 'bg-green-500' : 
                      task.methodComparison?.currentMethod?.status === 'in_progress' || task.methodComparison?.aiMethod?.status === 'in_progress' ? 'bg-blue-500' :
                      task.methodComparison?.currentMethod?.status === 'blocked' || task.methodComparison?.aiMethod?.status === 'blocked' ? 'bg-red-500' : 'bg-gray-300'
                    }`}></div>
                    <div className="flex-1">
                      <h3 className="font-medium">{task.title}</h3>
                      {task.description && (
                        <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                      )}
                    </div>
                    <div className="ml-4 flex-shrink-0 flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        task.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      </span>
                      <button 
                        className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                        onClick={() => handleEditTask(task.id)}
                        title="Edit task"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                        onClick={() => handleDeleteTask(task.id)}
                        title="Delete task"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="ml-6 mb-3 text-sm">
                    {task.dueDate && (
                      <div className="flex items-center text-gray-600">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        <span>Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                    
                    {task.assignees.length > 0 && (
                      <div className="flex items-center text-gray-600">
                        <UserIcon className="h-4 w-4 mr-1" />
                        <span>Assignees: {task.assignees.join(', ')}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Method Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 bg-gray-50 rounded-lg overflow-hidden">
                    {/* Current Method */}
                    <div className="p-4 border-r border-gray-200">
                      <h4 className="text-center font-medium text-purple-800 mb-3">Current Method</h4>
                      
                      <div className="flex items-center text-gray-600 mb-2">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        <span>Time spent: {formatDuration(totalTimeCurrent)}</span>
                        <input 
                          type="number" 
                          className="ml-2 w-16 p-1 text-sm border rounded" 
                          placeholder="min" 
                          defaultValue={task.methodComparison?.currentMethod?.manualTime ? Math.floor(task.methodComparison.currentMethod.manualTime / 60) : ''}
                          onBlur={(e) => handleManualTimeUpdate(task.id, e.target.value, 'currentMethod')}
                        />
                      </div>
                      
                      <div className="mb-2">
                        <label className="block text-sm text-gray-600 mb-1">Tools used:</label>
                        <input 
                          type="text" 
                          className="w-full p-1 text-sm border rounded" 
                          placeholder="Enter tools separated by commas" 
                          defaultValue={task.methodComparison?.currentMethod?.tools?.join(', ') || ''}
                          onBlur={(e) => handleToolsUpdate(task.id, e.target.value, 'currentMethod')}
                        />
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {/* Status change dropdown */}
                        <div className="dropdown">
                          <button className="btn btn-sm btn-outline dropdown-toggle">
                            Change Status
                          </button>
                          <div className="dropdown-menu">
                            <button 
                              className="dropdown-item"
                              onClick={() => handleStatusChange(task.id, 'not_started', 'currentMethod')}
                            >
                              Not Started
                            </button>
                            <button 
                              className="dropdown-item"
                              onClick={() => handleStatusChange(task.id, 'in_progress', 'currentMethod')}
                            >
                              In Progress
                            </button>
                            <button 
                              className="dropdown-item"
                              onClick={() => handleStatusChange(task.id, 'completed', 'currentMethod')}
                            >
                              Completed
                            </button>
                            <button 
                              className="dropdown-item"
                              onClick={() => handleStatusChange(task.id, 'blocked', 'currentMethod')}
                            >
                              Blocked
                            </button>
                          </div>
                        </div>
                        
                        {/* Status display */}
                        <div className="text-sm text-gray-600">
                          Not Started
                          <span className="mx-1">|</span>
                          In Progress
                          <span className="mx-1">|</span>
                          Completed
                          <span className="mx-1">|</span>
                          Blocked
                        </div>
                        
                        {/* Timer control button */}
                        {isTimerActiveCurrent ? (
                          <button 
                            className="btn btn-sm btn-danger flex items-center"
                            onClick={() => handleStopTimer(task.id, 'currentMethod')}
                          >
                            <PauseIcon className="h-4 w-4 mr-1" />
                            Stop Timer
                          </button>
                        ) : (
                          <button 
                            className="btn btn-sm btn-success flex items-center"
                            onClick={() => handleStartTimer(task.id, 'currentMethod')}
                            disabled={task.methodComparison?.currentMethod?.status === 'completed'}
                          >
                            <PlayIcon className="h-4 w-4 mr-1" />
                            Start Timer
                          </button>
                        )}
                        
                        {/* Mark as complete button */}
                        {task.methodComparison?.currentMethod?.status !== 'completed' && (
                          <button 
                            className="btn btn-sm btn-primary flex items-center"
                            onClick={() => handleStatusChange(task.id, 'completed', 'currentMethod')}
                          >
                            <CheckIcon className="h-4 w-4 mr-1" />
                            Mark Complete
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* AI Method */}
                    <div className="p-4">
                      <h4 className="text-center font-medium text-purple-800 mb-3">AI Method</h4>
                      
                      <div className="flex items-center text-gray-600 mb-2">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        <span>Time spent: {formatDuration(totalTimeAI)}</span>
                        <input 
                          type="number" 
                          className="ml-2 w-16 p-1 text-sm border rounded" 
                          placeholder="min" 
                          defaultValue={task.methodComparison?.aiMethod?.manualTime ? Math.floor(task.methodComparison.aiMethod.manualTime / 60) : ''}
                          onBlur={(e) => handleManualTimeUpdate(task.id, e.target.value, 'aiMethod')}
                        />
                      </div>
                      
                      <div className="mb-2">
                        <label className="block text-sm text-gray-600 mb-1">Tools used:</label>
                        <input 
                          type="text" 
                          className="w-full p-1 text-sm border rounded" 
                          placeholder="Enter tools separated by commas" 
                          defaultValue={task.methodComparison?.aiMethod?.tools?.join(', ') || ''}
                          onBlur={(e) => handleToolsUpdate(task.id, e.target.value, 'aiMethod')}
                        />
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {/* Status change dropdown */}
                        <div className="dropdown">
                          <button className="btn btn-sm btn-outline dropdown-toggle">
                            Change Status
                          </button>
                          <div className="dropdown-menu">
                            <button 
                              className="dropdown-item"
                              onClick={() => handleStatusChange(task.id, 'not_started', 'aiMethod')}
                            >
                              Not Started
                            </button>
                            <button 
                              className="dropdown-item"
                              onClick={() => handleStatusChange(task.id, 'in_progress', 'aiMethod')}
                            >
                              In Progress
                            </button>
                            <button 
                              className="dropdown-item"
                              onClick={() => handleStatusChange(task.id, 'completed', 'aiMethod')}
                            >
                              Completed
                            </button>
                            <button 
                              className="dropdown-item"
                              onClick={() => handleStatusChange(task.id, 'blocked', 'aiMethod')}
                            >
                              Blocked
                            </button>
                          </div>
                        </div>
                        
                        {/* Status display */}
                        <div className="text-sm text-gray-600">
                          Not Started
                          <span className="mx-1">|</span>
                          In Progress
                          <span className="mx-1">|</span>
                          Completed
                          <span className="mx-1">|</span>
                          Blocked
                        </div>
                        
                        {/* Timer control button */}
                        {isTimerActiveAI ? (
                          <button 
                            className="btn btn-sm btn-danger flex items-center"
                            onClick={() => handleStopTimer(task.id, 'aiMethod')}
                          >
                            <PauseIcon className="h-4 w-4 mr-1" />
                            Stop Timer
                          </button>
                        ) : (
                          <button 
                            className="btn btn-sm btn-success flex items-center"
                            onClick={() => handleStartTimer(task.id, 'aiMethod')}
                            disabled={task.methodComparison?.aiMethod?.status === 'completed'}
                          >
                            <PlayIcon className="h-4 w-4 mr-1" />
                            Start Timer
                          </button>
                        )}
                        
                        {/* Mark as complete button */}
                        {task.methodComparison?.aiMethod?.status !== 'completed' && (
                          <button 
                            className="btn btn-sm btn-primary flex items-center"
                            onClick={() => handleStatusChange(task.id, 'completed', 'aiMethod')}
                          >
                            <CheckIcon className="h-4 w-4 mr-1" />
                            Mark Complete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Task Creation/Edit Modal */}
      <Modal 
        isOpen={isTaskModalOpen}
        onClose={closeTaskModal}
        title={editingTask ? "Edit Task" : "Add New Task"}
        size="lg"
      >
        <TaskForm
          workflowId={currentWorkflow.id}
          taskId={editingTask || undefined}
          onSuccess={handleTaskCreationSuccess}
          onCancel={() => {
            setEditingTask(null);
            closeTaskModal();
          }}
        />
      </Modal>
    </div>
  );
}

export default function WorkflowDetailPage() {
  return (
    <WorkflowProvider>
      <WorkflowDetail />
    </WorkflowProvider>
  );
}
