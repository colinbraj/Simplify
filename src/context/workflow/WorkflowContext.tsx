'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define types for our workflow management system
export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TimeEntry {
  id: string;
  taskId: string;
  startTime: string;
  endTime: string | null;
  duration: number | null; // in seconds
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  workflowId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignees: string[];
  dueDate: string | null;
  startDate: string | null;
  estimatedTime: number | null; // in minutes
  actualTime: number | null; // in minutes
  dependencies: string[]; // IDs of tasks that this task depends on
  tools: string[];
  tags: string[];
  timeEntries: TimeEntry[];
  methodComparison: {
    currentMethod: {
      status: TaskStatus;
      timeEntries: TimeEntry[];
      tools: string[];
      manualTime: number | null; // in seconds
    };
    aiMethod: {
      status: TaskStatus;
      timeEntries: TimeEntry[];
      tools: string[];
      manualTime: number | null; // in seconds
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface Workflow {
  id: string;
  title: string;
  description: string;
  tasks: Task[];
  createdBy: string;
  status: 'active' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  imageData?: string; // Optional property for image data in base64 format
}

export interface WorkflowCreationState {
  currentStep: 'initial' | 'naming' | 'tasks' | 'tools' | 'users' | 'review' | 'complete';
  workflowTitle: string;
  workflowDescription: string;
  suggestedTasks: Task[];
  selectedTasks: Task[];
  chatHistory: ChatMessage[];
}

// Create a Zustand store for workflow management
interface WorkflowStore {
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  workflowCreation: WorkflowCreationState;
  
  // Workflow actions
  setCurrentWorkflow: (workflow: Workflow | null) => void;
  addWorkflow: (workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateWorkflow: (workflowId: string, updates: Partial<Workflow>) => void;
  deleteWorkflow: (workflowId: string) => void;
  
  // Task actions
  addTask: (workflowId: string, task: Omit<Task, 'id' | 'workflowId' | 'createdAt' | 'updatedAt' | 'timeEntries'>) => string;
  updateTask: (workflowId: string, taskId: string, updates: Partial<Task>, method?: 'currentMethod' | 'aiMethod') => void;
  deleteTask: (workflowId: string, taskId: string) => void;
  
  // Time tracking actions
  startTaskTimer: (workflowId: string, taskId: string, method?: 'currentMethod' | 'aiMethod', notes?: string) => string;
  stopTaskTimer: (workflowId: string, taskId: string, timeEntryId: string, method?: 'currentMethod' | 'aiMethod') => void;
  addManualTimeEntry: (workflowId: string, taskId: string, entry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  
  // Method-specific actions
  updateTaskTools: (workflowId: string, taskId: string, tools: string[], method: 'currentMethod' | 'aiMethod') => void;
  updateTaskManualTime: (workflowId: string, taskId: string, time: number | null, method: 'currentMethod' | 'aiMethod') => void;
  
  // Workflow creation actions
  updateWorkflowCreation: (updates: Partial<WorkflowCreationState>) => void;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => string;
  resetWorkflowCreation: () => void;
  completeWorkflowCreation: () => string;
}

// Initial state for workflow creation
const initialWorkflowCreationState: WorkflowCreationState = {
  currentStep: 'initial',
  workflowTitle: '',
  workflowDescription: '',
  suggestedTasks: [],
  selectedTasks: [],
  chatHistory: [
    {
      id: '1',
      role: 'assistant',
      content: "Let's create a new workflow. What workflow do you want to create?",
      timestamp: new Date().toISOString(),
    },
  ],
};

// Create the Zustand store with persistence
export const useWorkflowStore = create<WorkflowStore>()(
  persist(
    (set, get) => ({
      workflows: [],
      currentWorkflow: null,
      workflowCreation: initialWorkflowCreationState,
      
      // Workflow actions
      setCurrentWorkflow: (workflow) => set({ currentWorkflow: workflow }),
      
      addWorkflow: (workflow) => {
        const newWorkflow: Workflow = {
          ...workflow,
          id: crypto.randomUUID(),
          tasks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        set((state) => ({
          workflows: [...state.workflows, newWorkflow],
          currentWorkflow: newWorkflow,
        }));
        
        return newWorkflow.id;
      },
      
      updateWorkflow: (workflowId, updates) => {
        set((state) => ({
          workflows: state.workflows.map((workflow) =>
            workflow.id === workflowId
              ? { ...workflow, ...updates, updatedAt: new Date().toISOString() }
              : workflow
          ),
          currentWorkflow:
            state.currentWorkflow?.id === workflowId
              ? { ...state.currentWorkflow, ...updates, updatedAt: new Date().toISOString() }
              : state.currentWorkflow,
        }));
      },
      
      deleteWorkflow: (workflowId) => {
        set((state) => ({
          workflows: state.workflows.filter((workflow) => workflow.id !== workflowId),
          currentWorkflow:
            state.currentWorkflow?.id === workflowId ? null : state.currentWorkflow,
        }));
      },
      
      // Task actions
      addTask: (workflowId, task) => {
        const newTask: Task = {
          ...task,
          id: crypto.randomUUID(),
          workflowId,
          timeEntries: [],
          methodComparison: {
            currentMethod: {
              status: 'not_started',
              timeEntries: [],
              tools: [],
              manualTime: null
            },
            aiMethod: {
              status: 'not_started',
              timeEntries: [],
              tools: [],
              manualTime: null
            }
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        set((state) => ({
          workflows: state.workflows.map((workflow) =>
            workflow.id === workflowId
              ? {
                  ...workflow,
                  tasks: [...workflow.tasks, newTask],
                  updatedAt: new Date().toISOString(),
                }
              : workflow
          ),
          currentWorkflow:
            state.currentWorkflow?.id === workflowId
              ? {
                  ...state.currentWorkflow,
                  tasks: [...state.currentWorkflow.tasks, newTask],
                  updatedAt: new Date().toISOString(),
                }
              : state.currentWorkflow,
        }));
        
        return newTask.id;
      },
      
      updateTask: (workflowId, taskId, updates, method) => {
        const now = new Date().toISOString();
        
        set((state) => {
          // If a specific method is provided, update only that method's status
          if (method && updates.status) {
            return {
              workflows: state.workflows.map((workflow) =>
                workflow.id === workflowId
                  ? {
                      ...workflow,
                      tasks: workflow.tasks.map((task) =>
                        task.id === taskId
                          ? {
                              ...task,
                              ...updates,
                              methodComparison: {
                                ...task.methodComparison,
                                [method]: {
                                  ...task.methodComparison[method],
                                  status: updates.status,
                                },
                              },
                              updatedAt: now,
                            }
                          : task
                      ),
                      updatedAt: now,
                    }
                  : workflow
              ),
              currentWorkflow:
                state.currentWorkflow?.id === workflowId
                  ? {
                      ...state.currentWorkflow,
                      tasks: state.currentWorkflow.tasks.map((task) =>
                        task.id === taskId
                          ? {
                              ...task,
                              ...updates,
                              methodComparison: {
                                ...task.methodComparison,
                                [method]: {
                                  ...task.methodComparison[method],
                                  status: updates.status,
                                },
                              },
                              updatedAt: now,
                            }
                          : task
                      ),
                      updatedAt: now,
                    }
                  : state.currentWorkflow,
            };
          }
          
          // Otherwise, update the task normally
          return {
            workflows: state.workflows.map((workflow) =>
              workflow.id === workflowId
                ? {
                    ...workflow,
                    tasks: workflow.tasks.map((task) =>
                      task.id === taskId
                        ? {
                            ...task,
                            ...updates,
                            updatedAt: now,
                          }
                        : task
                    ),
                    updatedAt: now,
                  }
                : workflow
            ),
            currentWorkflow:
              state.currentWorkflow?.id === workflowId
                ? {
                    ...state.currentWorkflow,
                    tasks: state.currentWorkflow.tasks.map((task) =>
                      task.id === taskId
                        ? {
                            ...task,
                            ...updates,
                            updatedAt: now,
                          }
                        : task
                    ),
                    updatedAt: now,
                  }
                : state.currentWorkflow,
          };
        });
      },
      
      deleteTask: (workflowId, taskId) => {
        set((state) => ({
          workflows: state.workflows.map((workflow) =>
            workflow.id === workflowId
              ? {
                  ...workflow,
                  tasks: workflow.tasks.filter((task) => task.id !== taskId),
                  updatedAt: new Date().toISOString(),
                }
              : workflow
          ),
          currentWorkflow:
            state.currentWorkflow?.id === workflowId
              ? {
                  ...state.currentWorkflow,
                  tasks: state.currentWorkflow.tasks.filter(
                    (task) => task.id !== taskId
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : state.currentWorkflow,
        }));
      },
      
      // Time tracking actions
      startTaskTimer: (workflowId, taskId, method, notes = '') => {
        const now = new Date().toISOString();
        const timeEntryId = crypto.randomUUID();
        
        const newTimeEntry: TimeEntry = {
          id: timeEntryId,
          taskId,
          startTime: now,
          endTime: null,
          duration: null,
          notes,
          createdAt: now,
          updatedAt: now,
        };
        
        set((state) => {
          // If a specific method is provided, update only that method's time entries
          if (method) {
            return {
              workflows: state.workflows.map((workflow) =>
                workflow.id === workflowId
                  ? {
                      ...workflow,
                      tasks: workflow.tasks.map((task) =>
                        task.id === taskId
                          ? {
                              ...task,
                              status: task.status === 'not_started' ? 'in_progress' as TaskStatus : task.status,
                              timeEntries: [...task.timeEntries, newTimeEntry],
                              methodComparison: {
                                ...task.methodComparison,
                                [method]: {
                                  ...task.methodComparison[method],
                                  status: task.methodComparison[method].status === 'not_started' ? 'in_progress' as TaskStatus : task.methodComparison[method].status,
                                  timeEntries: [...task.methodComparison[method].timeEntries, newTimeEntry],
                                },
                              },
                              updatedAt: now,
                            }
                          : task
                      ),
                      updatedAt: now,
                    }
                  : workflow
              ),
              currentWorkflow:
                state.currentWorkflow?.id === workflowId
                  ? {
                      ...state.currentWorkflow,
                      tasks: state.currentWorkflow.tasks.map((task) =>
                        task.id === taskId
                          ? {
                              ...task,
                              status: task.status === 'not_started' ? 'in_progress' as TaskStatus : task.status,
                              timeEntries: [...task.timeEntries, newTimeEntry],
                              methodComparison: {
                                ...task.methodComparison,
                                [method]: {
                                  ...task.methodComparison[method],
                                  status: task.methodComparison[method].status === 'not_started' ? 'in_progress' as TaskStatus : task.methodComparison[method].status,
                                  timeEntries: [...task.methodComparison[method].timeEntries, newTimeEntry],
                                },
                              },
                              updatedAt: now,
                            }
                          : task
                      ),
                      updatedAt: now,
                    }
                  : state.currentWorkflow,
            };
          }
          
          // Otherwise, update the task normally (for backward compatibility)
          return {
            workflows: state.workflows.map((workflow) =>
              workflow.id === workflowId
                ? {
                    ...workflow,
                    tasks: workflow.tasks.map((task) =>
                      task.id === taskId
                        ? {
                            ...task,
                            status: task.status === 'not_started' ? 'in_progress' as TaskStatus : task.status,
                            timeEntries: [...task.timeEntries, newTimeEntry],
                            updatedAt: now,
                          }
                        : task
                    ),
                    updatedAt: now,
                  }
                : workflow
            ),
            currentWorkflow:
              state.currentWorkflow?.id === workflowId
                ? {
                    ...state.currentWorkflow,
                    tasks: state.currentWorkflow.tasks.map((task) =>
                      task.id === taskId
                        ? {
                            ...task,
                            status: task.status === 'not_started' ? 'in_progress' as TaskStatus : task.status,
                            timeEntries: [...task.timeEntries, newTimeEntry],
                            updatedAt: now,
                          }
                        : task
                    ),
                    updatedAt: now,
                  }
                : state.currentWorkflow,
          };
        });
        
        return timeEntryId;
      },
      
      stopTaskTimer: (workflowId, taskId, timeEntryId, method) => {
        const now = new Date().toISOString();
        
        set((state) => {
          // If a specific method is provided, update only that method's time entries
          if (method) {
            return {
              workflows: state.workflows.map((workflow) =>
                workflow.id === workflowId
                  ? {
                      ...workflow,
                      tasks: workflow.tasks.map((task) =>
                        task.id === taskId
                          ? {
                              ...task,
                              timeEntries: task.timeEntries.map((entry) =>
                                entry.id === timeEntryId
                                  ? {
                                      ...entry,
                                      endTime: now,
                                      duration: entry.startTime
                                        ? Math.floor(
                                            (new Date(now).getTime() -
                                              new Date(entry.startTime).getTime()) /
                                              1000
                                          )
                                        : null,
                                      updatedAt: now,
                                    }
                                  : entry
                              ),
                              methodComparison: {
                                ...task.methodComparison,
                                [method]: {
                                  ...task.methodComparison[method],
                                  timeEntries: task.methodComparison[method].timeEntries.map((entry) =>
                                    entry.id === timeEntryId
                                      ? {
                                          ...entry,
                                          endTime: now,
                                          duration: entry.startTime
                                            ? Math.floor(
                                                (new Date(now).getTime() -
                                                  new Date(entry.startTime).getTime()) /
                                                  1000
                                              )
                                            : null,
                                          updatedAt: now,
                                        }
                                      : entry
                                  ),
                                },
                              },
                              updatedAt: now,
                            }
                          : task
                      ),
                      updatedAt: now,
                    }
                  : workflow
              ),
              currentWorkflow:
                state.currentWorkflow?.id === workflowId
                  ? {
                      ...state.currentWorkflow,
                      tasks: state.currentWorkflow.tasks.map((task) =>
                        task.id === taskId
                          ? {
                              ...task,
                              timeEntries: task.timeEntries.map((entry) =>
                                entry.id === timeEntryId
                                  ? {
                                      ...entry,
                                      endTime: now,
                                      duration: entry.startTime
                                        ? Math.floor(
                                            (new Date(now).getTime() -
                                              new Date(entry.startTime).getTime()) /
                                              1000
                                          )
                                        : null,
                                      updatedAt: now,
                                    }
                                  : entry
                              ),
                              methodComparison: {
                                ...task.methodComparison,
                                [method]: {
                                  ...task.methodComparison[method],
                                  timeEntries: task.methodComparison[method].timeEntries.map((entry) =>
                                    entry.id === timeEntryId
                                      ? {
                                          ...entry,
                                          endTime: now,
                                          duration: entry.startTime
                                            ? Math.floor(
                                                (new Date(now).getTime() -
                                                  new Date(entry.startTime).getTime()) /
                                                  1000
                                              )
                                            : null,
                                          updatedAt: now,
                                        }
                                      : entry
                                  ),
                                },
                              },
                              updatedAt: now,
                            }
                          : task
                      ),
                      updatedAt: now,
                    }
                  : state.currentWorkflow,
            };
          }
          
          // Otherwise, update the task normally (for backward compatibility)
          return {
            workflows: state.workflows.map((workflow) =>
              workflow.id === workflowId
                ? {
                    ...workflow,
                    tasks: workflow.tasks.map((task) =>
                      task.id === taskId
                        ? {
                            ...task,
                            timeEntries: task.timeEntries.map((entry) =>
                              entry.id === timeEntryId
                                ? {
                                    ...entry,
                                    endTime: now,
                                    duration: entry.startTime
                                      ? Math.floor(
                                          (new Date(now).getTime() -
                                            new Date(entry.startTime).getTime()) /
                                            1000
                                        )
                                      : null,
                                    updatedAt: now,
                                  }
                                : entry
                            ),
                            updatedAt: now,
                          }
                        : task
                    ),
                    updatedAt: now,
                  }
                : workflow
            ),
            currentWorkflow:
              state.currentWorkflow?.id === workflowId
                ? {
                    ...state.currentWorkflow,
                    tasks: state.currentWorkflow.tasks.map((task) =>
                      task.id === taskId
                        ? {
                            ...task,
                            timeEntries: task.timeEntries.map((entry) =>
                              entry.id === timeEntryId
                                ? {
                                    ...entry,
                                    endTime: now,
                                    duration: entry.startTime
                                      ? Math.floor(
                                          (new Date(now).getTime() -
                                            new Date(entry.startTime).getTime()) /
                                            1000
                                        )
                                      : null,
                                    updatedAt: now,
                                  }
                                : entry
                            ),
                            updatedAt: now,
                          }
                        : task
                    ),
                    updatedAt: now,
                  }
                : state.currentWorkflow,
          };
        });
      },
      
      addManualTimeEntry: (workflowId, taskId, entry) => {
        const newTimeEntry: TimeEntry = {
          ...entry,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        set((state) => ({
          workflows: state.workflows.map((workflow) =>
            workflow.id === workflowId
              ? {
                  ...workflow,
                  tasks: workflow.tasks.map((task) =>
                    task.id === taskId
                      ? {
                          ...task,
                          timeEntries: [...task.timeEntries, newTimeEntry],
                          methodComparison: {
                            ...task.methodComparison,
                            currentMethod: {
                              ...task.methodComparison.currentMethod,
                              timeEntries: [...task.methodComparison.currentMethod.timeEntries, newTimeEntry],
                            },
                          },
                          updatedAt: new Date().toISOString(),
                        }
                      : task
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : workflow
          ),
          currentWorkflow:
            state.currentWorkflow?.id === workflowId
              ? {
                  ...state.currentWorkflow,
                  tasks: state.currentWorkflow.tasks.map((task) =>
                    task.id === taskId
                      ? {
                          ...task,
                          timeEntries: [...task.timeEntries, newTimeEntry],
                          methodComparison: {
                            ...task.methodComparison,
                            currentMethod: {
                              ...task.methodComparison.currentMethod,
                              timeEntries: [...task.methodComparison.currentMethod.timeEntries, newTimeEntry],
                            },
                          },
                          updatedAt: new Date().toISOString(),
                        }
                      : task
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : state.currentWorkflow,
        }));
      },
      
      // Update task tools for a specific method
      updateTaskTools: (workflowId, taskId, tools, method) => {
        const now = new Date().toISOString();
        
        set((state) => ({
          workflows: state.workflows.map((workflow) =>
            workflow.id === workflowId
              ? {
                  ...workflow,
                  tasks: workflow.tasks.map((task) =>
                    task.id === taskId
                      ? {
                          ...task,
                          methodComparison: {
                            ...task.methodComparison,
                            [method]: {
                              ...task.methodComparison[method],
                              tools: tools,
                            },
                          },
                          updatedAt: now,
                        }
                      : task
                  ),
                  updatedAt: now,
                }
              : workflow
          ),
          currentWorkflow:
            state.currentWorkflow?.id === workflowId
              ? {
                  ...state.currentWorkflow,
                  tasks: state.currentWorkflow.tasks.map((task) =>
                    task.id === taskId
                      ? {
                          ...task,
                          methodComparison: {
                            ...task.methodComparison,
                            [method]: {
                              ...task.methodComparison[method],
                              tools: tools,
                            },
                          },
                          updatedAt: now,
                        }
                      : task
                  ),
                  updatedAt: now,
                }
              : state.currentWorkflow,
        }));
      },
      
      // Update manual time for a specific method
      updateTaskManualTime: (workflowId, taskId, time, method) => {
        const now = new Date().toISOString();
        
        set((state) => ({
          workflows: state.workflows.map((workflow) =>
            workflow.id === workflowId
              ? {
                  ...workflow,
                  tasks: workflow.tasks.map((task) =>
                    task.id === taskId
                      ? {
                          ...task,
                          methodComparison: {
                            ...task.methodComparison,
                            [method]: {
                              ...task.methodComparison[method],
                              manualTime: time,
                            },
                          },
                          updatedAt: now,
                        }
                      : task
                  ),
                  updatedAt: now,
                }
              : workflow
          ),
          currentWorkflow:
            state.currentWorkflow?.id === workflowId
              ? {
                  ...state.currentWorkflow,
                  tasks: state.currentWorkflow.tasks.map((task) =>
                    task.id === taskId
                      ? {
                          ...task,
                          methodComparison: {
                            ...task.methodComparison,
                            [method]: {
                              ...task.methodComparison[method],
                              manualTime: time,
                            },
                          },
                          updatedAt: now,
                        }
                      : task
                  ),
                  updatedAt: now,
                }
              : state.currentWorkflow,
        }));
      },
      
      // Workflow creation actions
      updateWorkflowCreation: (updates) => {
        set((state) => ({
          workflowCreation: {
            ...state.workflowCreation,
            ...updates,
          },
        }));
      },
      
      addChatMessage: (message) => {
        const newMessage: ChatMessage = {
          ...message,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        };
        
        set((state) => ({
          workflowCreation: {
            ...state.workflowCreation,
            chatHistory: [...state.workflowCreation.chatHistory, newMessage],
          },
        }));
        
        return newMessage.id;
      },
      
      resetWorkflowCreation: () => {
        set({
          workflowCreation: initialWorkflowCreationState,
        });
      },
      
      completeWorkflowCreation: () => {
        const { workflowCreation } = get();
        const { workflowTitle, workflowDescription, suggestedTasks, selectedTasks } = workflowCreation;
        
        // Determine which tasks to use - if selectedTasks is empty, use suggestedTasks
        const tasksToAdd = selectedTasks.length > 0 ? selectedTasks : suggestedTasks;
        
        // Create a new workflow
        const workflowId = get().addWorkflow({
          title: workflowTitle,
          description: workflowDescription,
          createdBy: 'current-user', // This would be replaced with the actual user ID
          status: 'active',
          tasks: [], // Add empty tasks array to fix TypeScript error
        });
        
        // Add tasks to the workflow
        if (tasksToAdd.length > 0) {
          console.log(`Adding ${tasksToAdd.length} tasks to workflow ${workflowId}`);
          
          tasksToAdd.forEach((task) => {
            console.log(`Adding task: ${task.title}`);
            get().addTask(workflowId, {
              title: task.title,
              description: task.description,
              status: 'not_started',
              priority: task.priority || 'medium',
              assignees: task.assignees || [],
              dueDate: task.dueDate || null,
              startDate: null,
              estimatedTime: task.estimatedTime || null,
              actualTime: null,
              dependencies: task.dependencies || [],
              tools: task.tools || [],
              tags: task.tags || [],
              methodComparison: {
                currentMethod: {
                  status: 'not_started',
                  timeEntries: [],
                  tools: [],
                  manualTime: null
                },
                aiMethod: {
                  status: 'not_started',
                  timeEntries: [],
                  tools: [],
                  manualTime: null
                }
              }
            });
          });
        } else {
          console.warn('No tasks to add to the workflow');
        }
        
        // Reset workflow creation state
        get().resetWorkflowCreation();
        
        return workflowId;
      },
    }),
    {
      name: 'simplify-workflow-storage',
      partialize: (state) => ({
        workflows: state.workflows,
      }),
    }
  )
);

// Create a React context for components that need to access the workflow store
const WorkflowContext = createContext<ReturnType<typeof useWorkflowStore> | null>(null);

// Provider component
export function WorkflowProvider({ children }: { children: React.ReactNode }) {
  return (
    <WorkflowContext.Provider value={useWorkflowStore()}>
      {children}
    </WorkflowContext.Provider>
  );
}

// Custom hook to use the workflow context
export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
}
