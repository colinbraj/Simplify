'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon, ClockIcon, ExclamationTriangleIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { useWorkflowStore, Task, Workflow } from '@/context/workflow/WorkflowContext';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Extend the jsPDF type definition to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export default function TimeTrackingReport() {
  const { workflows } = useWorkflowStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const workflowId = searchParams.get('workflowId');
  
  const [taskTimeData, setTaskTimeData] = useState<Array<{
    id: string;
    name: string;
    currentMethod: number;
    aiMethod: number;
    timeSaved: number;
    percentImprovement: number;
  }>>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [totals, setTotals] = useState({
    currentMethod: 0,
    aiMethod: 0,
    timeSaved: 0
  });
  const [totalPercentImprovement, setTotalPercentImprovement] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  // Redirect to reports page if no workflowId is provided
  useEffect(() => {
    if (!workflowId) {
      router.push('/reports');
    }
  }, [workflowId, router]);

  // Function to generate and download PDF report
  const downloadPDF = () => {
    setIsGeneratingPDF(true);
    
    try {
      // Create a new PDF document
      const doc = new jsPDF();
      const title = 'Time Tracking Report';
      const date = new Date().toLocaleDateString();
      
      // Add title
      doc.setFontSize(18);
      doc.text(title, 105, 15, { align: 'center' });
      
      // Add date
      doc.setFontSize(10);
      doc.text(`Generated on: ${date}`, 105, 22, { align: 'center' });
      
      // Add summary section
      doc.setFontSize(14);
      doc.text('Time Tracking Summary', 14, 35);
      
      if (taskTimeData.length > 0) {
        // Summary table
        doc.autoTable({
          startY: 40,
          head: [['Metric', 'Value']],
          body: [
            ['Current Method Total', `${totals.currentMethod} min`],
            ['AI Method Total', `${totals.aiMethod} min`],
            ['Time Saved', `${totals.timeSaved} min`],
            ['Overall Improvement', `${totalPercentImprovement}%`]
          ],
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185] }
        });
        
        // Task comparison table
        const lastTableEndY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(14);
        doc.text('Time Comparison by Task', 14, lastTableEndY);
        
        doc.autoTable({
          startY: lastTableEndY + 5,
          head: [['Task', 'Current Method', 'AI Method', 'Time Saved', 'Improvement']],
          body: taskTimeData.map(task => [
            task.name,
            `${task.currentMethod} min`,
            `${task.aiMethod} min`,
            `${task.timeSaved} min`,
            `${task.percentImprovement}%`
          ]),
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185] }
        });
        
        // Add key insights
        const insightsEndY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(14);
        doc.text('Key Insights', 14, insightsEndY);
        
        doc.setFontSize(10);
        doc.text('1. AI-assisted methods consistently save time across all recruitment tasks.', 20, insightsEndY + 10);
        doc.text('2. The most significant time savings are in the resume screening process.', 20, insightsEndY + 18);
        doc.text('3. Overall time efficiency has improved by ' + totalPercentImprovement + '%.', 20, insightsEndY + 26);
      } else {
        doc.setFontSize(12);
        doc.text('No time tracking data available.', 105, 50, { align: 'center' });
      }
      
      // Save the PDF with forced PDF extension
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'time-tracking-report.pdf';
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
      
      // Process tasks from the selected workflow
      const processedTasks = workflow.tasks.map(task => {
        // Calculate current method time (in minutes)
        const currentMethodTime = Math.round((
          task.methodComparison?.currentMethod?.timeEntries.reduce((sum, entry) => {
            return sum + (entry.duration || 0);
          }, 0) || 0
        ) / 60) + Math.round((task.methodComparison?.currentMethod?.manualTime || 0) / 60);
        
        // Calculate AI method time (in minutes)
        const aiMethodTime = Math.round((
          task.methodComparison?.aiMethod?.timeEntries.reduce((sum, entry) => {
            return sum + (entry.duration || 0);
          }, 0) || 0
        ) / 60) + Math.round((task.methodComparison?.aiMethod?.manualTime || 0) / 60);
        
        // Calculate time saved and improvement percentage
        const timeSaved = Math.max(0, currentMethodTime - aiMethodTime);
        const percentImprovement = currentMethodTime > 0 ? 
          Math.round((timeSaved / currentMethodTime) * 100) : 0;
        
        return {
          id: task.id,
          name: task.title,
          currentMethod: currentMethodTime,
          aiMethod: aiMethodTime,
          timeSaved,
          percentImprovement
        };
      });
      
      setTaskTimeData(processedTasks);
      
      // Calculate totals
      const calculatedTotals = processedTasks.reduce((acc, task) => {
        return {
          currentMethod: acc.currentMethod + task.currentMethod,
          aiMethod: acc.aiMethod + task.aiMethod,
          timeSaved: acc.timeSaved + task.timeSaved
        };
      }, { currentMethod: 0, aiMethod: 0, timeSaved: 0 });
      
      setTotals(calculatedTotals);
      
      // Calculate total percentage improvement
      const calcTotalPercentImprovement = calculatedTotals.currentMethod > 0 ?
        Math.round((calculatedTotals.timeSaved / calculatedTotals.currentMethod) * 100) : 0;
      
      setTotalPercentImprovement(calcTotalPercentImprovement);
    }
    
    setIsLoading(false);
  }, [workflowId, workflows]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <a href="/reports" className="btn btn-outline mr-4 flex items-center">
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Reports
          </a>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Time Tracking Report</h1>
            {selectedWorkflow && (
              <p className="text-gray-600 mt-1">Workflow: {selectedWorkflow.title}</p>
            )}
          </div>
        </div>
        
        {!isLoading && taskTimeData.length > 0 && (
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
      ) : taskTimeData.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Time Tracking Data Found</h2>
          <p className="text-gray-600 mb-6">Complete tasks with time tracking to generate reports.</p>
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
                  <p className="text-gray-500 text-sm">Current Method</p>
                  <h3 className="text-2xl font-bold text-gray-800">{totals.currentMethod} min</h3>
                </div>
                <div className="p-2 bg-blue-100 rounded-md">
                  <ClockIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm">AI Method</p>
                  <h3 className="text-2xl font-bold text-gray-800">{totals.aiMethod} min</h3>
                </div>
                <div className="p-2 bg-green-100 rounded-md">
                  <ClockIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm">Time Saved</p>
                  <h3 className="text-2xl font-bold text-green-600">
                    {totals.timeSaved} min ({totalPercentImprovement}%)
                  </h3>
                </div>
                <div className="p-2 bg-green-100 rounded-md">
                  <ClockIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Time Comparison by Task</h2>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Saved</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Improvement</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {taskTimeData.map((task) => (
                    <tr key={task.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.currentMethod} min</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.aiMethod} min</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{task.timeSaved} min</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-green-600 h-2.5 rounded-full" 
                              style={{ width: `${task.percentImprovement}%` }}
                            ></div>
                          </div>
                          <span className="ml-2">{task.percentImprovement}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Key Insights</h2>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start">
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-100 text-green-800 mr-2">1</span>
            <span>The AI method reduces time spent on resume reviews by more than 50%.</span>
          </li>
          <li className="flex items-start">
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-100 text-green-800 mr-2">2</span>
            <span>Technical interviews show significant time savings while maintaining quality.</span>
          </li>
          <li className="flex items-start">
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-100 text-green-800 mr-2">3</span>
            <span>Overall, the AI method saves approximately {totalPercentImprovement}% of time across all recruitment tasks.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
