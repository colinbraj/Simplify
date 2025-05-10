'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useBoard } from '@/context/BoardContext';
import { 
  PlusIcon, 
  EllipsisHorizontalIcon,
  ChevronDownIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import TaskCard from './TaskCard';
import TaskDetailsSidebar from './TaskDetailsSidebar';

export default function BoardView() {
  const { currentBoard, addGroup } = useBoard();
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  
  // Function to handle adding a new group
  const handleAddGroup = () => {
    if (currentBoard) {
      addGroup(currentBoard.id, {
        title: 'New Group',
        tasks: []
      });
    }
  };
  
  // Function to handle task selection
  const handleTaskSelect = (taskId: string) => {
    setSelectedTask(taskId);
    setShowSidebar(true);
  };

  if (!currentBoard) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">No board selected</h2>
          <p className="text-gray-500 mb-6">Select a board from the sidebar or create a new one</p>
          <button className="btn btn-primary">
            Create New Board
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className={`flex-1 overflow-hidden transition-all ${showSidebar ? 'mr-80' : ''}`}>
        {/* Board Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800">{currentBoard.title}</h1>
            <Link href="/workflows" className="btn btn-primary">
              View Workflows
            </Link>
          </div>
          <p className="text-gray-600">{currentBoard.description}</p>
        </div>
        
        {/* Board Content */}
        <div className="overflow-x-auto pb-4">
          <div className="flex space-x-4 min-w-max">
            {/* Groups */}
            {currentBoard.groups.map((group) => (
              <div 
                key={group.id} 
                className="w-80 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden"
              >
                {/* Group Header */}
                <div className="bg-white p-3 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center">
                    <h3 className="font-medium text-gray-800">{group.title}</h3>
                    <span className="ml-2 text-xs text-gray-500 bg-gray-200 rounded-full px-2 py-0.5">
                      {group.tasks.length}
                    </span>
                  </div>
                  <button className="p-1 rounded-md hover:bg-gray-100">
                    <EllipsisHorizontalIcon className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
                
                {/* Tasks */}
                <div className="p-2 space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto">
                  {group.tasks.map((task) => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onClick={() => handleTaskSelect(task.id)} 
                    />
                  ))}
                  
                  {/* Add Task Button */}
                  <button 
                    className="w-full p-2 rounded-md border border-dashed border-gray-300 hover:bg-white flex items-center justify-center text-gray-500 hover:text-gray-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    <span>Add Task</span>
                  </button>
                </div>
              </div>
            ))}
            
            {/* Add Group Button */}
            <div className="w-80 flex-shrink-0">
              <button 
                onClick={handleAddGroup}
                className="w-full h-12 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                <span>Add Group</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Task Details Sidebar */}
      {showSidebar && (
        <TaskDetailsSidebar 
          taskId={selectedTask} 
          onClose={() => setShowSidebar(false)} 
        />
      )}
    </div>
  );
}
