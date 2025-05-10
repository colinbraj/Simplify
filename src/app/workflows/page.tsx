'use client';

import React from 'react';
import Link from 'next/link';
import { WorkflowProvider, useWorkflowStore } from '@/context/workflow/WorkflowContext';
import { PlusIcon, ClockIcon, CheckCircleIcon, ArchiveBoxIcon, TrashIcon, HomeIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

function WorkflowsList() {
  const { workflows, deleteWorkflow } = useWorkflowStore();

  // Function to handle workflow deletion
  const handleDeleteWorkflow = (e: React.MouseEvent, workflowId: string, workflowTitle: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm(`Are you sure you want to delete the workflow "${workflowTitle}"?`)) {
      deleteWorkflow(workflowId);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <Link href="/dashboard" className="btn btn-outline mr-4 flex items-center">
            <HomeIcon className="h-5 w-5 mr-2" />
            Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Workflows</h1>
        </div>
        <Link href="/workflows/create" className="btn btn-primary flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Workflow
        </Link>
      </div>

      {workflows.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <PlusIcon className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No workflows yet</h2>
          <p className="text-gray-600 mb-6">
            Create your first workflow to start managing your tasks efficiently.
          </p>
          <Link href="/workflows/create" className="btn btn-primary">
            Create Your First Workflow
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((workflow) => {
            // Calculate workflow stats
            const totalTasks = workflow.tasks.length;
            const completedTasks = workflow.tasks.filter(
              (task) => task.status === 'completed'
            ).length;
            const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
            
            // Status badge styling
            const statusStyles = {
              active: 'bg-green-100 text-green-800',
              completed: 'bg-blue-100 text-blue-800',
              archived: 'bg-gray-100 text-gray-800',
            };

            return (
              <Link 
                href={`/workflows/${workflow.id}`} 
                key={workflow.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow relative group"
              >
                {/* Delete button - appears on hover */}
                <button
                  onClick={(e) => handleDeleteWorkflow(e, workflow.id, workflow.title)}
                  className="absolute top-2 right-2 p-2 rounded-full bg-white shadow-md text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  title="Delete workflow"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-800 line-clamp-1">
                      {workflow.title}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[workflow.status]}`}>
                      {workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1)}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {workflow.description}
                  </p>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      <span>{completedTasks}/{totalTasks} tasks</span>
                    </div>
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      <span>{format(new Date(workflow.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
          
          {/* Create new workflow card */}
          <Link 
            href="/workflows/create"
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border-2 border-dashed border-gray-300 flex items-center justify-center p-6"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <PlusIcon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                Create New Workflow
              </h3>
              <p className="text-gray-500 text-sm">
                Add a new workflow to your project
              </p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

export default function WorkflowsPage() {
  return (
    <WorkflowProvider>
      <WorkflowsList />
    </WorkflowProvider>
  );
}
