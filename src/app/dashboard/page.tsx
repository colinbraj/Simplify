'use client';

import { useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function Dashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Welcome to Simplify</h1>
            
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Navigation</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/workflows" className="btn btn-primary flex items-center justify-center py-3">
                  <span>View Workflows</span>
                </Link>
                <Link href="/reports" className="btn btn-outline flex items-center justify-center py-3">
                  <span>View Reports</span>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Note: The provided code edit seems to be a part of the BoardView component, 
// not the Dashboard component. The following code assumes that the BoardView 
// component is a separate file and the provided code edit is applied to that file.

// If the BoardView component is not a separate file, you would need to modify 
// the Dashboard component to include the provided code edit, which would likely 
// involve significant changes to the component's structure and functionality.
