'use client';

import React, { useState } from 'react';
import { useWorkflowStore } from '@/context/workflow/WorkflowContext';
import { Task, TaskPriority, TaskStatus } from '@/context/workflow/WorkflowContext';

interface TaskFormProps {
  workflowId: string;
  taskId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function TaskForm({ workflowId, taskId, onSuccess, onCancel }: TaskFormProps) {
  const { addTask, updateTask, currentWorkflow } = useWorkflowStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Find the task if we're editing
  const existingTask = taskId && currentWorkflow ? 
    currentWorkflow.tasks.find(task => task.id === taskId) : 
    null;
  
  const [formData, setFormData] = useState({
    title: existingTask?.title || '',
    description: existingTask?.description || '',
    status: (existingTask?.status || 'not_started') as TaskStatus,
    priority: (existingTask?.priority || 'medium') as TaskPriority,
    assignees: existingTask?.assignees || [] as string[],
    assigneeInput: existingTask?.assignees.join(', ') || '',
    dueDate: existingTask?.dueDate || '',
    estimatedTime: existingTask?.estimatedTime || null as number | null,
    dependencies: existingTask?.dependencies || [] as string[],
    tools: existingTask?.tools || [] as string[],
    tags: existingTask?.tags || [] as string[],
    tagInput: existingTask?.tags.join(', ') || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAssigneeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Store the raw input value directly
    setFormData(prev => ({
      ...prev,
      assigneeInput: e.target.value,
      // Only split into array when saving
      assignees: e.target.value ? e.target.value.split(',').map(a => a.trim()).filter(Boolean) : []
    }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Store the raw input value directly
    setFormData(prev => ({
      ...prev,
      tagInput: e.target.value,
      // Only split into array when saving
      tags: e.target.value ? e.target.value.split(',').map(t => t.trim()).filter(Boolean) : []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const taskData = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        assignees: formData.assignees,
        dueDate: formData.dueDate || null,
        startDate: null,
        estimatedTime: formData.estimatedTime,
        actualTime: null,
        dependencies: formData.dependencies,
        tools: formData.tools,
        tags: formData.tags
      };

      let apiResponse;
      
      if (taskId && existingTask) {
        // Update existing task
        updateTask(workflowId, taskId, taskData);
        
        // Also send to API (optional, since we're using client-side state)
        apiResponse = await fetch(`/api/workflows/${workflowId}/tasks/${taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(taskData)
        });
      } else {
        // Create new task
        addTask(workflowId, {
          ...taskData,
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

        // Also send to API (optional, since we're using client-side state)
        apiResponse = await fetch(`/api/workflows/${workflowId}/tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(taskData)
        });
      }

      if (apiResponse && !apiResponse.ok) {
        throw new Error(`Failed to ${taskId ? 'update' : 'create'} task`);
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating task:', error);
      // You could add error handling UI here
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Add New Task</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Task Title*
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            >
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="assignees" className="block text-sm font-medium text-gray-700 mb-1">
              Assignees (comma separated)
            </label>
            <input
              type="text"
              id="assignees"
              name="assignees"
              value={formData.assigneeInput}
              onChange={handleAssigneeChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>

          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
            Tags (comma separated)
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tagInput}
            onChange={handleTagsChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
          />
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-primary border border-transparent rounded-md text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            {isSubmitting ? 'Adding...' : 'Add Task'}
          </button>
        </div>
      </form>
    </div>
  );
}
