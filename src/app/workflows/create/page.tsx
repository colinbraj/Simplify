'use client';

import React from 'react';
import { WorkflowProvider } from '@/context/workflow/WorkflowContext';
import ChatInterface from '@/components/chat/ChatInterface';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function CreateWorkflowPage() {
  return (
    <WorkflowProvider>
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 py-4 px-6">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center text-gray-600 hover:text-primary mr-4">
                <ArrowLeftIcon className="h-5 w-5 mr-1" />
                <span>Back to Dashboard</span>
              </Link>
              <h1 className="text-2xl font-bold text-gray-800">Create New Workflow</h1>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-hidden p-6">
          <div className="container mx-auto h-full max-w-4xl">
            <div className="bg-white rounded-lg shadow-md h-full overflow-hidden">
              <ChatInterface />
            </div>
          </div>
        </main>
      </div>
    </WorkflowProvider>
  );
}
