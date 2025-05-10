'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon, ChartBarIcon, ExclamationTriangleIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { useWorkflowStore, Workflow, Task } from '@/context/workflow/WorkflowContext';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Extend the jsPDF type definition to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export default function WorkflowEfficiencyReport() {
  const { workflows } = useWorkflowStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const workflowId = searchParams.get('workflowId');
  
  const [workflowData, setWorkflowData] = useState<Array<{
    id: string;
    name: string;
    completionRate: number;
    timeEfficiency: number;
    tasks: Array<{
      name: string;
      status: string;
      timeEfficiency: number;
    }>;
  }>>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  // Redirect to reports page if no workflowId is provided
  useEffect(() => {
    if (!workflowId) {
      router.push('/reports');
    }
  }, [workflowId, router]);

  // Calculate time efficiency based on current method vs AI method time
  const calculateTimeEfficiency = (task: Task): number => {
    const currentMethodTime = (
      task.methodComparison?.currentMethod?.timeEntries.reduce((sum, entry) => {
        return sum + (entry.duration || 0);
      }, 0) || 0
    ) + (task.methodComparison?.currentMethod?.manualTime || 0);
    
    const aiMethodTime = (
      task.methodComparison?.aiMethod?.timeEntries.reduce((sum, entry) => {
        return sum + (entry.duration || 0);
      }, 0) || 0
    ) + (task.methodComparison?.aiMethod?.manualTime || 0);
    
    // If both methods have time tracked, calculate efficiency
    if (currentMethodTime > 0 && aiMethodTime > 0) {
      const improvement = ((currentMethodTime - aiMethodTime) / currentMethodTime) * 100;
      // Convert improvement to efficiency score (0-100)
      return Math.min(Math.round(improvement * 1.5) + 50, 100); // Base 50 + improvement bonus
    }
    
    // Default efficiency if we can't calculate
    return 50;
  };

  // Function to generate and download PDF report
  const downloadPDF = () => {
    setIsGeneratingPDF(true);
    
    try {
      // Create a new PDF document
      const doc = new jsPDF();
      const title = 'Workflow Efficiency Report';
      const date = new Date().toLocaleDateString();
      
      // Add title
      doc.setFontSize(18);
      doc.text(title, 105, 15, { align: 'center' });
      
      // Add date
      doc.setFontSize(10);
      doc.text(`Generated on: ${date}`, 105, 22, { align: 'center' });
      
      // Add workflow overview table
      doc.setFontSize(14);
      doc.text('Workflow Overview', 14, 35);
      
      const filteredWorkflows = workflowData.filter(workflow => 
        workflow.name.toLowerCase().includes('recruitment')
      );
      
      if (filteredWorkflows.length > 0) {
        // Workflow table
        doc.autoTable({
          startY: 40,
          head: [['Workflow', 'Completion Rate', 'Time Efficiency']],
          body: filteredWorkflows.map(workflow => [
            workflow.name,
            `${workflow.completionRate}%`,
            `${workflow.timeEfficiency}%`
          ]),
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185] }
        });
        
        // Task details table
        const lastTableEndY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(14);
        doc.text('Task Details', 14, lastTableEndY);
        
        const allTasks = filteredWorkflows.flatMap(workflow => workflow.tasks);
        
        doc.autoTable({
          startY: lastTableEndY + 5,
          head: [['Task', 'Status', 'Time Efficiency']],
          body: allTasks.map(task => [
            task.name,
            task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('_', ' '),
            `${task.timeEfficiency}%`
          ]),
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185] }
        });
        
        // Add insights
        const insightsEndY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(14);
        doc.text('Insights', 14, insightsEndY);
        
        doc.setFontSize(10);
        doc.text('1. Recruitment workflow shows good time efficiency but could improve on task completion rate.', 20, insightsEndY + 10);
        doc.text('2. Onboarding has the highest completion rate, indicating well-defined processes.', 20, insightsEndY + 18);
        doc.text('3. Project Planning shows room for improvement in both completion rate and time efficiency.', 20, insightsEndY + 26);
      } else {
        doc.setFontSize(12);
        doc.text('No workflow data available.', 105, 50, { align: 'center' });
      }
      
      // Save the PDF with forced PDF extension
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'workflow-efficiency-report.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  useEffect(() => {
    if (!workflowId || !workflows.length) return;
    
    // Find the selected workflow
    const workflow = workflows.find(w => w.id === workflowId);
    
    if (workflow) {
      setSelectedWorkflow(workflow);
      
      // Process the selected workflow
      // Calculate task completion rate
      const totalTasks = workflow.tasks.length;
      const completedTasks = workflow.tasks.filter(task => task.status === 'completed').length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      // Calculate average time efficiency across all tasks
      const taskEfficiencies = workflow.tasks.map(task => calculateTimeEfficiency(task));
      const avgTimeEfficiency = taskEfficiencies.length > 0 ?
        Math.round(taskEfficiencies.reduce((sum, eff) => sum + eff, 0) / taskEfficiencies.length) : 0;
      
      // Process task data for detailed view
      const taskData = workflow.tasks.map(task => ({
        name: task.title,
        status: task.status,
        timeEfficiency: calculateTimeEfficiency(task)
      }));
      
      const processedData = [{
        id: workflow.id,
        name: workflow.title,
        completionRate,
        timeEfficiency: avgTimeEfficiency,
        tasks: taskData
      }];
      
      setWorkflowData(processedData);
    }
    
    setIsLoading(false);
  }, [workflowId, workflows, calculateTimeEfficiency]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <a href="/reports" className="btn btn-outline mr-4 flex items-center">
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Reports
          </a>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Workflow Efficiency Report</h1>
            {selectedWorkflow && (
              <p className="text-gray-600 mt-1">Workflow: {selectedWorkflow.title}</p>
            )}
          </div>
        </div>
        
        {!isLoading && workflowData.length > 0 && (
          <button 
            onClick={downloadPDF} 
            disabled={isGeneratingPDF}
            className="btn btn-primary flex items-center"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            {isGeneratingPDF ? 'Generating PDF...' : 'Download PDF'}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : workflowData.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Workflows Found</h2>
          <p className="text-gray-600 mb-6">Create workflows to generate efficiency reports.</p>
          <Link href="/workflows" className="btn btn-primary">
            View Workflows
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Overview</h2>
              <p className="text-gray-600">Analysis of task completion rates and time efficiency across workflows</p>
            </div>
            <ChartBarIcon className="h-10 w-10 text-primary" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Workflow</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Efficiency</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {workflowData.map((workflow) => (
                  <tr key={workflow.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{workflow.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${workflow.completionRate}%` }}
                          ></div>
                        </div>
                        <span className="ml-2">{workflow.completionRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-green-600 h-2.5 rounded-full" 
                            style={{ width: `${workflow.timeEfficiency}%` }}
                          ></div>
                        </div>
                        <span className="ml-2">{workflow.timeEfficiency}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Task Details Section */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Task Details</h3>
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Efficiency</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {workflowData
                  .flatMap(workflow => workflow.tasks)
                  .map((task, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {task.status === 'completed' && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Completed
                        </span>
                      )}
                      {task.status === 'in_progress' && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          In Progress
                        </span>
                      )}
                      {task.status === 'not_started' && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Not Started
                        </span>
                      )}
                      {task.status === 'blocked' && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Blocked
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-green-600 h-2.5 rounded-full" 
                            style={{ width: `${task.timeEfficiency}%` }}
                          ></div>
                        </div>
                        <span className="ml-2">{task.timeEfficiency}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Insights</h2>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start">
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-800 mr-2">1</span>
            <span>Recruitment workflow shows good time efficiency but could improve on task completion rate.</span>
          </li>
          <li className="flex items-start">
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-800 mr-2">2</span>
            <span>Onboarding has the highest completion rate, indicating well-defined processes.</span>
          </li>
          <li className="flex items-start">
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-800 mr-2">3</span>
            <span>Project Planning shows room for improvement in both completion rate and time efficiency.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
