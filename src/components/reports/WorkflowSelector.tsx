import React, { useState, useEffect } from 'react';
import { useWorkflowStore, Workflow } from '@/context/workflow/WorkflowContext';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface WorkflowSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (workflow: Workflow) => void;
}

const WorkflowSelector: React.FC<WorkflowSelectorProps> = ({ isOpen, onClose, onSelect }) => {
  const { workflows } = useWorkflowStore();
  const [filteredWorkflows, setFilteredWorkflows] = useState<Workflow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Filter workflows based on search term
    const filtered = workflows.filter(workflow => 
      workflow.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredWorkflows(filtered);
  }, [workflows, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Select Workflow</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search workflows..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="max-h-80 overflow-y-auto">
          {filteredWorkflows.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {filteredWorkflows.map((workflow) => (
                <li key={workflow.id} className="py-3">
                  <button
                    onClick={() => onSelect(workflow)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md transition duration-150 ease-in-out"
                  >
                    <div className="font-medium text-gray-900">{workflow.title}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {workflow.tasks.length} tasks • Created: {new Date(workflow.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center mt-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        workflow.status === 'completed' ? 'bg-green-100 text-green-800' :
                        workflow.status === 'active' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1)}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No workflows found matching your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowSelector;
