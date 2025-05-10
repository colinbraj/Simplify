'use client';

import { useState, useEffect } from 'react';
import { useBoard, Task, Status, Priority } from '@/context/BoardContext';
import { format } from 'date-fns';
import { 
  XMarkIcon, 
  CalendarIcon, 
  TagIcon, 
  UserIcon, 
  ChatBubbleLeftRightIcon,
  PaperClipIcon,
  ClockIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

type TaskDetailsSidebarProps = {
  taskId: string | null;
  onClose: () => void;
};

export default function TaskDetailsSidebar({ taskId, onClose }: TaskDetailsSidebarProps) {
  const { currentBoard, updateTask } = useBoard();
  const [task, setTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Status>('todo');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [newComment, setNewComment] = useState('');
  
  // Find the task in the current board
  useEffect(() => {
    if (!currentBoard || !taskId) return;
    
    for (const group of currentBoard.groups) {
      const foundTask = group.tasks.find(t => t.id === taskId);
      if (foundTask) {
        setTask(foundTask);
        setTitle(foundTask.title);
        setDescription(foundTask.description);
        setStatus(foundTask.status);
        setPriority(foundTask.priority);
        setDueDate(foundTask.dueDate || '');
        break;
      }
    }
  }, [currentBoard, taskId]);
  
  // Function to find which group the task belongs to
  const findTaskGroup = () => {
    if (!currentBoard || !taskId) return null;
    
    for (const group of currentBoard.groups) {
      if (group.tasks.some(t => t.id === taskId)) {
        return group.id;
      }
    }
    return null;
  };
  
  // Function to save changes
  const handleSave = () => {
    if (!currentBoard || !taskId) return;
    
    const groupId = findTaskGroup();
    if (!groupId) return;
    
    updateTask(currentBoard.id, groupId, taskId, {
      title,
      description,
      status,
      priority,
      dueDate: dueDate || null,
    });
    
    setIsEditing(false);
  };
  
  // Function to add a comment (mock implementation)
  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    // In a real app, this would add the comment to the task
    console.log('Adding comment:', newComment);
    setNewComment('');
  };
  
  if (!task) {
    return (
      <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-lg border-l border-gray-200 z-10 flex items-center justify-center">
        <p className="text-gray-500">No task selected</p>
      </div>
    );
  }

  return (
    <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-lg border-l border-gray-200 z-10 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-medium text-gray-800">Task Details</h2>
        <button 
          className="p-1 rounded-md hover:bg-gray-100"
          onClick={onClose}
        >
          <XMarkIcon className="h-5 w-5 text-gray-600" />
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="input"
              ></textarea>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                className="input"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
                <option value="stuck">Stuck</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="input"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input"
              />
            </div>
            
            <div className="flex space-x-2 pt-4">
              <button 
                className="btn btn-primary flex-1"
                onClick={handleSave}
              >
                Save Changes
              </button>
              <button 
                className="btn btn-outline flex-1"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-medium text-gray-800 mb-2">{task.title}</h1>
              <p className="text-gray-600 whitespace-pre-line">{task.description}</p>
            </div>
            
            <div className="flex flex-col space-y-4">
              <div className="flex items-center">
                <div className="w-8 flex-shrink-0">
                  <ClockIcon className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="flex items-center mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.status === 'todo' ? 'bg-gray-200 text-gray-700' :
                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      task.status === 'done' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {task.status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-8 flex-shrink-0">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Due Date</p>
                  <p className="text-sm font-medium text-gray-800 mt-1">
                    {task.dueDate ? format(new Date(task.dueDate), 'MMMM d, yyyy') : 'No due date'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-8 flex-shrink-0">
                  <CheckIcon className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Priority</p>
                  <div className="flex items-center mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.priority === 'low' ? 'bg-gray-100 text-gray-600' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-8 flex-shrink-0">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Assignees</p>
                  <div className="flex items-center mt-1">
                    {task.assignees.length > 0 ? (
                      <div className="flex -space-x-1">
                        {task.assignees.map((assignee, index) => (
                          <div 
                            key={index}
                            className="h-6 w-6 rounded-full bg-gray-300 border border-white flex items-center justify-center text-xs text-gray-700"
                            title={assignee}
                          >
                            {assignee.charAt(0).toUpperCase()}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No assignees</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-8 flex-shrink-0">
                  <TagIcon className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tags</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {task.tags.length > 0 ? (
                      task.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No tags</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-4">
              <button 
                className="btn btn-primary w-full"
                onClick={() => setIsEditing(true)}
              >
                Edit Task
              </button>
            </div>
          </div>
        )}
        
        {/* Comments Section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center mb-4">
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="font-medium text-gray-800">Comments</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex">
              <div className="h-8 w-8 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">JD</span>
              </div>
              <div className="ml-3 flex-1">
                <textarea
                  placeholder="Add a comment..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  rows={3}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                ></textarea>
                <div className="mt-2 flex justify-end">
                  <button 
                    className="btn btn-primary py-1 px-3 text-sm"
                    onClick={handleAddComment}
                  >
                    Comment
                  </button>
                </div>
              </div>
            </div>
            
            <p className="text-center text-sm text-gray-500 py-4">No comments yet</p>
          </div>
        </div>
        
        {/* Activity Section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center mb-4">
            <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="font-medium text-gray-800">Activity</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex">
              <div className="h-6 w-6 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-700">JD</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-gray-800">John Doe</span> created this task
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {format(new Date(task.createdAt), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
