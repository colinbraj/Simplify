'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon, ChartBarIcon, ExclamationTriangleIcon, CheckCircleIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { useWorkflowStore, Task, Workflow } from '@/context/workflow/WorkflowContext';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Extend the jsPDF type definition to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export default function TaskAnalysisReport() {
  const { workflows } = useWorkflowStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const workflowId = searchParams.get('workflowId');
  
  const [taskAnalysisData, setTaskAnalysisData] = useState<Array<{
    id: string;
    name: string;
    status: string;
    bottlenecks: string;
    performance: number;
    notes: string;
  }>>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [blockedTasks, setBlockedTasks] = useState(0);
  const [avgPerformance, setAvgPerformance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  // Redirect to reports page if no workflowId is provided
  useEffect(() => {
    if (!workflowId) {
      router.push('/reports');
    }
  }, [workflowId, router]);

  // Calculate performance score based on task status, time entries, and method comparison
  const calculateTaskPerformance = (task: Task): number => {
    // Base score starts at 50
    let score = 50;
    
    // Completed tasks get a bonus
    if (task.status === 'completed') score += 30;
    else if (task.status === 'in_progress') score += 15;
    else if (task.status === 'blocked') score -= 10;
    
    // If AI method saved time compared to current method, add points
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
    
    if (currentMethodTime > 0 && aiMethodTime > 0 && aiMethodTime < currentMethodTime) {
      const improvement = ((currentMethodTime - aiMethodTime) / currentMethodTime) * 100;
      score += Math.min(Math.round(improvement / 5), 20); // Max 20 points for time improvement
    }
    
    // Cap the score between 0 and 100
    return Math.min(Math.max(score, 0), 100);
  };

  // Determine bottlenecks based on task properties
  const determineBottlenecks = (task: Task): string => {
    if (task.status === 'blocked') return 'Process blocked';
    if (task.status === 'not_started' && task.dueDate && new Date(task.dueDate) < new Date()) return 'Past due date';
    if (task.dependencies && task.dependencies.length > 0) return 'Waiting on dependencies';
    if (task.status === 'in_progress' && task.timeEntries.length === 0) return 'No time tracking';
    return 'None identified';
  };

  // Generate notes based on task analysis
  const generateTaskNotes = (task: Task, performance: number): string => {
    if (performance >= 90) return 'Process is well-optimized';
    if (performance >= 70) return 'Performing well, minor improvements possible';
    if (performance >= 50) return 'Average performance, review process';
    if (performance >= 30) return 'Needs improvement, consider process redesign';
    return 'Critical issues, requires immediate attention';
  };
  
  // Function to generate and download PDF report
  const downloadPDF = () => {
    setIsGeneratingPDF(true);
    
    try {
      // Create a new PDF document
      const doc = new jsPDF();
      const title = 'Task Analysis Report';
      const date = new Date().toLocaleDateString();
      
      // Add title
      doc.setFontSize(18);
      doc.text(title, 105, 15, { align: 'center' });
      
      // Add date
      doc.setFontSize(10);
      doc.text(`Generated on: ${date}`, 105, 22, { align: 'center' });
      
      // Add summary section
      doc.setFontSize(14);
      doc.text('Task Analysis Summary', 14, 35);
      
      if (taskAnalysisData.length > 0) {
        // Summary table
        doc.autoTable({
          startY: 40,
          head: [['Metric', 'Value']],
          body: [
            ['Total Tasks', `${taskAnalysisData.length}`],
            ['Completed Tasks', `${completedTasks}`],
            ['Blocked Tasks', `${blockedTasks}`],
            ['Average Performance', `${avgPerformance}%`]
          ],
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185] }
        });
        
        // Task analysis table
        const lastTableEndY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(14);
        doc.text('Task Analysis Details', 14, lastTableEndY);
        
        doc.autoTable({
          startY: lastTableEndY + 5,
          head: [['Task', 'Status', 'Bottlenecks', 'Performance', 'Notes']],
          body: taskAnalysisData.map(task => [
            task.name,
            task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('_', ' '),
            task.bottlenecks,
            `${task.performance}%`,
            task.notes
          ]),
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185] },
          columnStyles: {
            3: { halign: 'center' }
          }
        });
        
        // Add recommendations
        const recommendationsEndY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(14);
        doc.text('Recommendations', 14, recommendationsEndY);
        
        doc.setFontSize(10);
        doc.text('1. Improve Scheduling Process: Implement calendar integration to reduce scheduling conflicts.', 20, recommendationsEndY + 10);
        doc.text('2. Streamline Feedback Collection: Set up automated reminders for evaluators.', 20, recommendationsEndY + 18);
        doc.text('3. Approval Process Optimization: Create an escalation process for offer approvals.', 20, recommendationsEndY + 26);
      } else {
        doc.setFontSize(12);
        doc.text('No task analysis data available.', 105, 50, { align: 'center' });
      }
      
      // Save the PDF with forced PDF extension
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'task-analysis-report.pdf';
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
      
      // Process tasks for analysis
      const processedTasks = workflow.tasks.map(task => {
        const performance = calculateTaskPerformance(task);
        const bottlenecks = determineBottlenecks(task);
        const notes = generateTaskNotes(task, performance);
        
        return {
          id: task.id,
          name: task.title,
          status: task.status,
          bottlenecks,
          performance,
          notes
        };
      });
      
      setTaskAnalysisData(processedTasks);
      setCompletedTasks(processedTasks.filter(task => task.status === 'completed').length);
      setBlockedTasks(processedTasks.filter(task => task.status === 'blocked').length);
      
      // Calculate average performance
      const totalPerformance = processedTasks.reduce((sum, task) => sum + task.performance, 0);
      const avgPerf = processedTasks.length > 0 ? Math.round(totalPerformance / processedTasks.length) : 0;
      setAvgPerformance(avgPerf);
    }
    
    setIsLoading(false);
  }, [workflowId, workflows, calculateTaskPerformance, determineBottlenecks, generateTaskNotes]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <a href="/reports" className="btn btn-outline mr-4 flex items-center">
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Reports
          </a>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Task Analysis Report</h1>
            {selectedWorkflow && (
              <p className="text-gray-600 mt-1">Workflow: {selectedWorkflow.title}</p>
            )}
          </div>
        </div>
        
        {!isLoading && taskAnalysisData.length > 0 && (
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
      ) : taskAnalysisData.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Completed Workflows Found</h2>
          <p className="text-gray-600 mb-6">Complete a workflow to generate task analysis reports.</p>
          <Link href="/workflows" className="btn btn-primary">
            View Workflows
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm">Completed Tasks</p>
                  <h3 className="text-2xl font-bold text-gray-800">{completedTasks} of {taskAnalysisData.length}</h3>
                </div>
                <div className="p-2 bg-green-100 rounded-md">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm">Blocked Tasks</p>
                  <h3 className="text-2xl font-bold text-gray-800">{blockedTasks}</h3>
                </div>
                <div className="p-2 bg-red-100 rounded-md">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm">Avg. Performance</p>
                  <h3 className="text-2xl font-bold text-gray-800">{avgPerformance}%</h3>
                </div>
                <div className="p-2 bg-blue-100 rounded-md">
                  <ChartBarIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Task Performance Analysis</h2>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bottlenecks</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {taskAnalysisData.map((task, index) => (
                    <tr key={task.id}>
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
                        {task.status === 'blocked' && (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Blocked
                          </span>
                        )}
                        {task.status === 'not_started' && (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            Not Started
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.bottlenecks}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${
                                task.performance >= 80 ? 'bg-green-600' : 
                                task.performance >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${task.performance}%` }}
                            ></div>
                          </div>
                          <span className="ml-2">{task.performance}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recommendations</h2>
        <ul className="space-y-4 text-gray-700">
          <li className="flex items-start">
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-800 mr-2">1</span>
            <div>
              <h3 className="font-medium text-gray-900">Improve Scheduling Process</h3>
              <p className="mt-1">Implement calendar integration to reduce scheduling conflicts for technical interviews.</p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-800 mr-2">2</span>
            <div>
              <h3 className="font-medium text-gray-900">Streamline Feedback Collection</h3>
              <p className="mt-1">Set up automated reminders for evaluators to provide timely feedback.</p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-800 mr-2">3</span>
            <div>
              <h3 className="font-medium text-gray-900">Approval Process Optimization</h3>
              <p className="mt-1">Create an escalation process for offer approvals to prevent delays.</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
