'use client';

import { Task } from '@/context/BoardContext';
import { format } from 'date-fns';
import { 
  CalendarIcon, 
  ChatBubbleLeftIcon, 
  PaperClipIcon
} from '@heroicons/react/24/outline';

type TaskCardProps = {
  task: Task;
  onClick: () => void;
};

export default function TaskCard({ task, onClick }: TaskCardProps) {
  // Function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return 'bg-gray-200 text-gray-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'done':
        return 'bg-green-100 text-green-700';
      case 'stuck':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  // Function to get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-600';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'urgent':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  // Format status for display
  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div 
      className="bg-white rounded-md shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="p-3">
        <h4 className="font-medium text-gray-800 mb-2">{task.title}</h4>
        
        <div className="text-xs text-gray-500 line-clamp-2 mb-3">
          {task.description}
        </div>
        
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
            {formatStatus(task.status)}
          </span>
          
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>
        </div>
        
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {task.tags.map((tag, index) => (
              <span 
                key={index}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
          <div className="flex items-center">
            {task.dueDate && (
              <div className="flex items-center mr-3">
                <CalendarIcon className="h-3 w-3 mr-1" />
                <span>{format(new Date(task.dueDate), 'MMM d')}</span>
              </div>
            )}
            
            <div className="flex items-center mr-3">
              <ChatBubbleLeftIcon className="h-3 w-3 mr-1" />
              <span>0</span>
            </div>
            
            <div className="flex items-center">
              <PaperClipIcon className="h-3 w-3 mr-1" />
              <span>0</span>
            </div>
          </div>
          
          {task.assignees.length > 0 && (
            <div className="flex -space-x-1">
              {task.assignees.map((assignee, index) => (
                <div 
                  key={index}
                  className="h-5 w-5 rounded-full bg-gray-300 border border-white flex items-center justify-center text-[10px] text-gray-700"
                  title={assignee}
                >
                  {assignee.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
