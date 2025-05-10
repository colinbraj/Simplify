'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { WorkflowProvider, useWorkflowStore } from '@/context/workflow/WorkflowContext';
import ReportGenerator from '@/components/reports/ReportGenerator';
import ReportVisualizations from '@/components/reports/ReportVisualizations';
import { ArrowLeftIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

function WorkflowReport() {
  const params = useParams();
  const router = useRouter();
  const { workflows, currentWorkflow, setCurrentWorkflow } = useWorkflowStore();
  
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
          <Link href={`/workflows/${currentWorkflow.id}`} className="text-gray-600 hover:text-primary mr-3">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">
            {currentWorkflow.title} - Report
          </h1>
        </div>
        
        <p className="text-gray-600 mb-6">
          Comprehensive report and analysis for your workflow.
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-8">
        {/* Workflow Summary */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <DocumentTextIcon className="h-6 w-6 text-primary mr-2" />
            <h2 className="text-xl font-semibold text-gray-800">Workflow Summary</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
              <p className="text-lg font-semibold text-gray-800 capitalize">
                {currentWorkflow.status}
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Tasks</h3>
              <p className="text-lg font-semibold text-gray-800">
                {currentWorkflow.tasks.length} total / {currentWorkflow.tasks.filter(t => t.status === 'completed').length} completed
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Completion</h3>
              <p className="text-lg font-semibold text-gray-800">
                {currentWorkflow.tasks.length > 0 
                  ? Math.round((currentWorkflow.tasks.filter(t => t.status === 'completed').length / currentWorkflow.tasks.length) * 100) 
                  : 0}%
              </p>
            </div>
          </div>
        </div>
        
        {/* Visualizations */}
        <ReportVisualizations workflow={currentWorkflow} />
        
        {/* AI Report Generator */}
        <ReportGenerator workflow={currentWorkflow} />
      </div>
    </div>
  );
}

export default function WorkflowReportPage() {
  return (
    <WorkflowProvider>
      <WorkflowReport />
    </WorkflowProvider>
  );
}
