'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DocumentChartBarIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import WorkflowSelector from '@/components/reports/WorkflowSelector';
import { Workflow } from '@/context/workflow/WorkflowContext';

export default function ReportsPage() {
  const router = useRouter();
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [reportType, setReportType] = useState<string>('');

  const handleReportClick = (type: string) => {
    setReportType(type);
    setIsSelectorOpen(true);
  };

  const handleWorkflowSelect = (workflow: Workflow) => {
    setIsSelectorOpen(false);
    // Navigate to the selected report with the workflow ID as a query parameter
    router.push(`/reports/${reportType}?workflowId=${workflow.id}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <Link href="/dashboard" className="btn btn-outline mr-4 flex items-center">
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Workflow Efficiency Report */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <DocumentChartBarIcon className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Workflow Efficiency</h3>
                <p className="text-gray-600 mb-4">
                  Analyze task completion rates and time efficiency across workflows
                </p>
              </div>
            </div>
            <button 
              onClick={() => handleReportClick('workflow-efficiency')} 
              className="btn btn-primary w-full"
            >
              View Report
            </button>
          </div>
        </div>

        {/* Time Tracking Report */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <DocumentChartBarIcon className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Time Tracking</h3>
                <p className="text-gray-600 mb-4">
                  Compare time spent on tasks between current and AI methods
                </p>
              </div>
            </div>
            <button 
              onClick={() => handleReportClick('time-tracking')} 
              className="btn btn-primary w-full"
            >
              View Report
            </button>
          </div>
        </div>

        {/* Task Analysis Report */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <DocumentChartBarIcon className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Task Analysis</h3>
                <p className="text-gray-600 mb-4">
                  Detailed breakdown of task performance and bottlenecks
                </p>
              </div>
            </div>
            <button 
              onClick={() => handleReportClick('task-analysis')} 
              className="btn btn-primary w-full"
            >
              View Report
            </button>
          </div>
        </div>
      </div>

      {/* Workflow Selector Modal */}
      <WorkflowSelector 
        isOpen={isSelectorOpen} 
        onClose={() => setIsSelectorOpen(false)} 
        onSelect={handleWorkflowSelect} 
      />
    </div>
  );
}
