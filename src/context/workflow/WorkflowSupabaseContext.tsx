'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useWorkflowStore, Workflow, Task } from './WorkflowContext';
import { 
  getWorkflows, 
  getWorkflowById, 
  createWorkflow, 
  updateWorkflow as updateSupabaseWorkflow, 
  deleteWorkflow as deleteSupabaseWorkflow,
  createTask,
  updateTask as updateSupabaseTask,
  deleteTask as deleteSupabaseTask
} from '@/lib/supabaseUtils';

// Create a context for Supabase integration
const WorkflowSupabaseContext = createContext<null>(null);

export function WorkflowSupabaseProvider({ children }: { children: React.ReactNode }) {
  const { 
    workflows, 
    addWorkflow: addWorkflowToStore, 
    updateWorkflow: updateWorkflowInStore,
    deleteWorkflow: deleteWorkflowFromStore,
    addTask: addTaskToStore,
    updateTask: updateTaskInStore,
    deleteTask: deleteTaskFromStore
  } = useWorkflowStore();

  // Load workflows from Supabase on initial load
  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        const supabaseWorkflows = await getWorkflows();
        
        // Only load from Supabase if we don't have workflows in the store yet
        if (workflows.length === 0 && supabaseWorkflows.length > 0) {
          // For each workflow, get its tasks
          for (const workflow of supabaseWorkflows) {
            const fullWorkflow = await getWorkflowById(workflow.id);
            if (fullWorkflow) {
              addWorkflowToStore({
                title: fullWorkflow.title,
                description: fullWorkflow.description || '',
                tasks: fullWorkflow.tasks || [],
                createdBy: 'current-user',
                status: fullWorkflow.status || 'active',
              });
            }
          }
        } 
        // If we have workflows in the store but not in Supabase, sync them to Supabase
        else if (workflows.length > 0 && supabaseWorkflows.length === 0) {
          for (const workflow of workflows) {
            await createWorkflow({
              id: workflow.id,
              title: workflow.title,
              description: workflow.description,
              status: workflow.status,
              created_at: workflow.createdAt,
              updated_at: workflow.updatedAt
            });
            
            // Create tasks for this workflow
            if (workflow.tasks && workflow.tasks.length > 0) {
              for (const task of workflow.tasks) {
                await createTask({
                  id: task.id,
                  workflow_id: workflow.id,
                  title: task.title,
                  description: task.description,
                  status: task.status,
                  priority: task.priority,
                  due_date: task.dueDate
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading workflows from Supabase:', error);
      }
    };

    loadWorkflows();
  }, [workflows, addWorkflowToStore]);

  // Override the addWorkflow function to also save to Supabase
  const addWorkflow = async (workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>) => {
    // First add to local store
    const workflowId = addWorkflowToStore(workflow);
    
    // Then save to Supabase
    try {
      await createWorkflow({
        id: workflowId,
        title: workflow.title,
        description: workflow.description,
        status: workflow.status,
      });
    } catch (error) {
      console.error('Error saving workflow to Supabase:', error);
    }
    
    return workflowId;
  };

  // Override the updateWorkflow function to also update in Supabase
  const updateWorkflow = async (workflowId: string, updates: Partial<Workflow>) => {
    // First update in local store
    updateWorkflowInStore(workflowId, updates);
    
    // Then update in Supabase
    try {
      await updateSupabaseWorkflow(workflowId, {
        title: updates.title,
        description: updates.description,
        status: updates.status,
      });
    } catch (error) {
      console.error('Error updating workflow in Supabase:', error);
    }
  };

  // Override the deleteWorkflow function to also delete from Supabase
  const deleteWorkflow = async (workflowId: string) => {
    // First delete from local store
    deleteWorkflowFromStore(workflowId);
    
    // Then delete from Supabase
    try {
      await deleteSupabaseWorkflow(workflowId);
    } catch (error) {
      console.error('Error deleting workflow from Supabase:', error);
    }
  };

  // Override the addTask function to also save to Supabase
  const addTask = async (workflowId: string, task: Omit<Task, 'id' | 'workflowId' | 'createdAt' | 'updatedAt' | 'timeEntries'>) => {
    // First add to local store
    const taskId = addTaskToStore(workflowId, task);
    
    // Then save to Supabase
    try {
      await createTask({
        id: taskId,
        workflow_id: workflowId,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        due_date: task.dueDate
      });
    } catch (error) {
      console.error('Error saving task to Supabase:', error);
    }
    
    return taskId;
  };

  // Override the updateTask function to also update in Supabase
  const updateTask = async (workflowId: string, taskId: string, updates: Partial<Task>, method?: 'currentMethod' | 'aiMethod') => {
    // First update in local store
    updateTaskInStore(workflowId, taskId, updates, method);
    
    // Then update in Supabase
    try {
      await updateSupabaseTask(taskId, {
        title: updates.title,
        description: updates.description,
        status: updates.status,
        priority: updates.priority,
        due_date: updates.dueDate
      });
    } catch (error) {
      console.error('Error updating task in Supabase:', error);
    }
  };

  // Override the deleteTask function to also delete from Supabase
  const deleteTask = async (workflowId: string, taskId: string) => {
    // First delete from local store
    deleteTaskFromStore(workflowId, taskId);
    
    // Then delete from Supabase
    try {
      await deleteSupabaseTask(taskId);
    } catch (error) {
      console.error('Error deleting task from Supabase:', error);
    }
  };

  // Provide the overridden functions
  const value = {
    addWorkflow,
    updateWorkflow,
    deleteWorkflow,
    addTask,
    updateTask,
    deleteTask
  };

  return (
    <WorkflowSupabaseContext.Provider value={null}>
      {children}
    </WorkflowSupabaseContext.Provider>
  );
}

// Export a hook to use the Supabase integration
export function useWorkflowSupabase() {
  const context = useContext(WorkflowSupabaseContext);
  if (context === undefined) {
    throw new Error('useWorkflowSupabase must be used within a WorkflowSupabaseProvider');
  }
  return context;
}
