'use client';

import React, { useState, useEffect } from 'react';
import { Workflow, Task, TimeEntry } from '@/context/workflow/WorkflowContext';
import { generateWorkflowAnalysis } from '@/lib/claude/api';
import { getClaudeConfig } from '@/lib/claude/config';
import { format } from 'date-fns';
import { 
  DocumentTextIcon, 
  ClockIcon, 
  ChartBarIcon,
  ExclamationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface ReportGeneratorProps {
  workflow: Workflow;
}

export default function ReportGenerator({ workflow }: ReportGeneratorProps) {
  const [report, setReport] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const claudeConfig = getClaudeConfig();

  // Prepare workflow data for analysis
  const prepareWorkflowData = () => {
    // Calculate task completion rates
    const totalTasks = workflow.tasks.length;
    const completedTasks = workflow.tasks.filter(task => task.status === 'completed').length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    // Calculate time metrics including both timer entries and manual time
    const taskTimeData = workflow.tasks.map(task => {
      // Timer entries time
      const timerTime = task.timeEntries.reduce((sum, entry) => {
        return sum + (entry.duration || 0);
      }, 0);
      
      // Method-specific time (both timer entries and manual time)
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
      
      // Total time is the sum of both methods
      const totalTime = currentMethodTime + aiMethodTime;
      
      return {
        id: task.id,
        title: task.title,
        status: task.status,
        totalTimeSeconds: totalTime,
        totalTimeHours: totalTime / 3600,
        currentMethodTimeSeconds: currentMethodTime,
        currentMethodTimeHours: currentMethodTime / 3600,
        aiMethodTimeSeconds: aiMethodTime,
        aiMethodTimeHours: aiMethodTime / 3600,
        timeEntries: task.timeEntries.length,
        hasManualTime: !!(task.methodComparison?.currentMethod?.manualTime || task.methodComparison?.aiMethod?.manualTime),
        currentMethodTools: task.methodComparison?.currentMethod?.tools || [],
        aiMethodTools: task.methodComparison?.aiMethod?.tools || [],
      };
    });
    
    // Calculate workflow duration
    const startDate = new Date(workflow.createdAt);
    const endDate = workflow.status === 'completed' 
      ? new Date(workflow.updatedAt) 
      : new Date();
    const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      id: workflow.id,
      title: workflow.title,
      description: workflow.description,
      status: workflow.status,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
      totalTasks,
      completedTasks,
      completionRate,
      durationDays,
      tasks: taskTimeData,
    };
  };

  // Prepare time tracking data for analysis
  const prepareTimeTrackingData = () => {
    // Collect all time entries
    const allTimeEntries: Array<TimeEntry & { taskTitle: string; entryType: string }> = [];
    
    // Add regular time entries
    workflow.tasks.forEach(task => {
      // Add timer entries
      task.timeEntries.forEach(entry => {
        allTimeEntries.push({
          ...entry,
          taskTitle: task.title,
          entryType: 'timer'
        });
      });
      
      // Add method-specific timer entries
      if (task.methodComparison?.currentMethod?.timeEntries) {
        task.methodComparison.currentMethod.timeEntries.forEach(entry => {
          allTimeEntries.push({
            ...entry,
            taskTitle: task.title,
            entryType: 'current_method_timer'
          });
        });
      }
      
      if (task.methodComparison?.aiMethod?.timeEntries) {
        task.methodComparison.aiMethod.timeEntries.forEach(entry => {
          allTimeEntries.push({
            ...entry,
            taskTitle: task.title,
            entryType: 'ai_method_timer'
          });
        });
      }
      
      // Add manual time entries (create synthetic entries for reporting)
      const today = new Date().toISOString();
      
      if (task.methodComparison?.currentMethod?.manualTime) {
        allTimeEntries.push({
          id: `manual-current-${task.id}`,
          taskTitle: task.title,
          startTime: today,
          endTime: today,
          duration: task.methodComparison.currentMethod.manualTime,
          notes: 'Manually entered time',
          createdAt: today,
          updatedAt: today,
          entryType: 'current_method_manual'
        } as TimeEntry & { taskTitle: string; entryType: string });
      }
      
      if (task.methodComparison?.aiMethod?.manualTime) {
        allTimeEntries.push({
          id: `manual-ai-${task.id}`,
          taskTitle: task.title,
          startTime: today,
          endTime: today,
          duration: task.methodComparison.aiMethod.manualTime,
          notes: 'Manually entered time',
          createdAt: today,
          updatedAt: today,
          entryType: 'ai_method_manual'
        } as TimeEntry & { taskTitle: string; entryType: string });
      }
    });
    
    // Sort by start time
    allTimeEntries.sort((a, b) => {
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
    
    // Calculate daily time spent
    const dailyTimeMap: Record<string, number> = {};
    
    allTimeEntries.forEach(entry => {
      if (entry.duration) {
        const date = format(new Date(entry.startTime), 'yyyy-MM-dd');
        
        if (!dailyTimeMap[date]) {
          dailyTimeMap[date] = 0;
        }
        
        dailyTimeMap[date] += entry.duration;
      }
    });
    
    const dailyTime = Object.entries(dailyTimeMap).map(([date, seconds]) => ({
      date,
      seconds,
      hours: seconds / 3600,
    }));
    
    // Calculate method-specific totals
    const currentMethodTotalSeconds = allTimeEntries
      .filter(entry => entry.entryType === 'current_method_timer' || entry.entryType === 'current_method_manual')
      .reduce((sum, entry) => sum + (entry.duration || 0), 0);
      
    const aiMethodTotalSeconds = allTimeEntries
      .filter(entry => entry.entryType === 'ai_method_timer' || entry.entryType === 'ai_method_manual')
      .reduce((sum, entry) => sum + (entry.duration || 0), 0);
    
    // Calculate total time (all entries)
    const totalTimeSeconds = allTimeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
    
    return {
      timeEntries: allTimeEntries,
      dailyTime,
      totalTimeSeconds,
      totalTimeHours: totalTimeSeconds / 3600,
      currentMethodTotalSeconds,
      currentMethodTotalHours: currentMethodTotalSeconds / 3600,
      aiMethodTotalSeconds,
      aiMethodTotalHours: aiMethodTotalSeconds / 3600,
      manualTimeEntries: allTimeEntries.filter(entry => entry.entryType.includes('manual')).length,
      timerTimeEntries: allTimeEntries.filter(entry => entry.entryType.includes('timer')).length,
    };
  };

  // Check if API key is properly configured
  useEffect(() => {
    // Verify API key on component mount
    if (!claudeConfig.apiKey) {
      console.warn('Claude API key not found in environment variables or local storage');
      setError('Claude API key is not configured. The key is defined in .env but may not be accessible. Please check the server logs.');
    } else {
      console.log('Claude API key is configured');
      setError(null);
    }
  }, [claudeConfig.apiKey]);

  // Generate the report using Claude API
  const generateReport = async () => {
    if (!claudeConfig.apiKey) {
      setError('Claude API key is not configured. The key is defined in .env but may not be accessible. Please restart the application or check server logs.');
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const workflowData = prepareWorkflowData();
      const timeTrackingData = prepareTimeTrackingData();
      
      console.log('Generating workflow analysis with API key available:', !!claudeConfig.apiKey);
      
      const analysis = await generateWorkflowAnalysis(
        workflowData,
        timeTrackingData,
        claudeConfig.apiKey
      );
      
      setReport(analysis);
    } catch (err) {
      console.error('Error generating report:', err);
      if (err instanceof Error) {
        setError(`Failed to generate report: ${err.message}. Please check console for details.`);
      } else {
        setError('Failed to generate report. Please try again later.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Workflow Report</h2>
        <p className="text-gray-600">
          Generate a comprehensive report with AI-powered insights for your workflow.
        </p>
      </div>
      
      <div className="p-6">
        {!report && !isGenerating && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <DocumentTextIcon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Generate Workflow Report</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Our AI will analyze your workflow data and provide insights, recommendations, and visualizations.
            </p>
            
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 flex items-start">
                <ExclamationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}
            
            <button 
              className="btn btn-primary"
              onClick={generateReport}
              disabled={isGenerating}
            >
              Generate Report
            </button>
          </div>
        )}
        
        {isGenerating && (
          <div className="text-center py-12">
            <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Generating Report</h3>
            <p className="text-gray-600">
              Our AI is analyzing your workflow data. This may take a moment...
            </p>
          </div>
        )}
        
        {report && !isGenerating && (
          <div className="prose prose-lg max-w-none">
            <div className="bg-green-50 text-green-700 p-4 rounded-md mb-6 flex items-start">
              <CheckCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <p>Report generated successfully!</p>
            </div>
            
            {/* Render the report content with markdown formatting */}
            {report.split('\n').map((line, i) => (
              <React.Fragment key={i}>
                {line}
                {i < report.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
            
            <div className="mt-8 flex justify-center">
              <button 
                className="btn btn-outline mr-4"
                onClick={() => setReport(null)}
              >
                Generate New Report
              </button>
              
              <button 
                className="btn btn-primary"
                onClick={() => {
                  // Create a blob and download the report
                  const blob = new Blob([report], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${workflow.title}-report-${format(new Date(), 'yyyy-MM-dd')}.md`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
              >
                Download Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
