import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkflowStore } from '@/context/workflow/WorkflowContext';
import { Task, TaskStatus, TaskPriority } from '@/types/index';
import { sendMessageToClaude } from '@/lib/claude/api';
import { getClaudeConfig } from '@/lib/claude/config';

interface ChatMessageType {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface TaskChatInterfaceProps {
  workflowId: string;
  suggestedTasks: Task[];
  onClose: () => void;
  saveChatMessages?: (messages: ChatMessageType[]) => void;
}

export default function TaskChatInterface({ workflowId, suggestedTasks, onClose, saveChatMessages }: TaskChatInterfaceProps) {
  const { addTask } = useWorkflowStore();
  const [chatHistory, setChatHistory] = useState<ChatMessageType[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showChatExport, setShowChatExport] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const claudeConfig = getClaudeConfig();
  const router = useRouter();


  
  // Format tasks for display in chat
  const formatTasksForDisplay = (tasks: Task[]): string => {
    return tasks.map((task, index) => {
      let taskDisplay = `${index + 1}. **${task.title}**\n`;
      taskDisplay += `   Description: ${task.description || 'No description provided'}\n`;
      taskDisplay += `   Priority: ${task.priority || 'Medium'}\n`;
      taskDisplay += `   Estimated Time: ${formatEstimatedTime(task.estimatedTime)}\n`;
      return taskDisplay;
    }).join('\n');
  };

  // Format estimated time
  const formatEstimatedTime = (minutes: number | null): string => {
    if (!minutes) return 'Not specified';
    
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours} hour(s) ${remainingMinutes} minute(s)` : `${hours} hour(s)`;
    }
    
    return `${minutes} minute(s)`;
  };

  // Initialize chat with suggested tasks
  useEffect(() => {
    // Create initial system message
    const initialMessage: ChatMessageType = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `Here are the suggested tasks for your workflow:\n\n${formatTasksForDisplay(suggestedTasks)}\n\nWould you like to make any changes to these tasks? You can edit, add, or remove tasks. Or simply say "use these tasks" to add them all to your workflow.`,
      timestamp: new Date().toISOString(),
    };

    setChatHistory([initialMessage]);
  }, [suggestedTasks]);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    scrollToBottom();
    
    // Save chat messages for parent component if the prop is provided
    if (saveChatMessages && chatHistory.length > 0) {
      saveChatMessages(chatHistory);
    }
  }, [chatHistory, saveChatMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Add a single task to the workflow
  const addSingleTask = (task: Partial<Task>) => {
    try {
      console.log('Adding task to workflow:', task.title);
      
      // Create a complete task object with all required properties
      const taskToAdd = {
        title: task.title || 'New Task',
        description: task.description || '',
        status: 'not_started' as TaskStatus,
        priority: (task.priority as TaskPriority) || 'medium' as TaskPriority,
        assignees: task.assignees || [],
        dueDate: task.dueDate || null,
        startDate: null,
        estimatedTime: task.estimatedTime || null,
        actualTime: null,
        dependencies: task.dependencies || [],
        tools: task.tools || [],
        tags: task.tags || [],
        methodComparison: {
          currentMethod: {
            status: 'not_started' as TaskStatus,
            timeEntries: []
          },
          aiMethod: {
            status: 'not_started' as TaskStatus,
            timeEntries: []
          }
        }
      };
      
      // Add the task to the workflow
      const taskId = addTask(workflowId, taskToAdd);
      
      console.log('Task added successfully with ID:', taskId);
      return taskId;
    } catch (error) {
      console.error('Error adding task:', error);
      return null;
    }
  };

  // Handle sending a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with input:', userInput);
    
    if (!userInput.trim() || isLoading) return;
    
    // Add user message to chat
    const userMessage: ChatMessageType = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userInput,
      timestamp: new Date().toISOString(),
    };
    
    // Store the input before clearing it
    const currentInput = userInput;
    
    setChatHistory(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);
    
    // Add a temporary loading message
    const loadingMessage: ChatMessageType = {
      id: 'loading-' + crypto.randomUUID(),
      role: 'assistant',
      content: 'Processing your request...',
      timestamp: new Date().toISOString(),
    };
    
    setChatHistory(prev => [...prev, loadingMessage]);
    
    // Scroll to bottom after adding the message
    setTimeout(scrollToBottom, 100);
    
    // Check if user wants to use the tasks as is
    if (currentInput.toLowerCase().includes('use these tasks')) {
      // Add all suggested tasks to the workflow
      console.log('Adding suggested tasks to workflow:', suggestedTasks.length);
      
      // Create a simple test task to verify the workflow is working
      const testTaskId = addSingleTask({
        title: 'Test Task',
        description: 'This is a test task to verify the workflow is working',
        priority: 'medium',
        estimatedTime: 60
      });
      console.log('Test task created with ID:', testTaskId);
      
      // Add the suggested tasks
      suggestedTasks.forEach(task => {
        addSingleTask(task);
      });
      
      // Add confirmation message
      const confirmationMessage: ChatMessageType = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Great! All tasks have been added to your workflow. You can now view and manage them in the workflow detail page.',
        timestamp: new Date().toISOString(),
      };
      
      setChatHistory(prev => [...prev, confirmationMessage]);
      setIsLoading(false);
      
      // Force refresh the page to show the new tasks
      window.location.reload();
      
      // Close the chat interface after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);
      
      return;
    }
    
    // Use Claude API to process the message
    try {
      // Use environment variable API key directly if claudeConfig.apiKey is not available
      // Check for the client-side accessible environment variable with NEXT_PUBLIC_ prefix
      const apiKey = claudeConfig.apiKey || process.env.NEXT_PUBLIC_CLAUDE_API_KEY;
      console.log('Using API key:', apiKey ? 'API key exists' : 'No API key found', 'Environment variable:', process.env.NEXT_PUBLIC_CLAUDE_API_KEY ? 'exists' : 'not found');
      
      if (!apiKey) {
        const errorMessage: ChatMessageType = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Claude API key is not available. Please check your environment configuration.',
          timestamp: new Date().toISOString(),
        };
        
        setChatHistory(prev => [...prev, errorMessage]);
        setIsLoading(false);
        return;
      }
      
      // Format the entire chat history for Claude
      const messages = chatHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Add the new user message
      messages.push({
        role: 'user',
        content: currentInput
      });
      
      // Claude API doesn't accept 'system' as a role in the messages array
      // Instead, we'll use the system parameter in the API call
      const systemPrompt = `
        You are a task management assistant. The user is reviewing a list of suggested tasks for their workflow.
        
        Here are the original suggested tasks:
        ${formatTasksForDisplay(suggestedTasks)}
        
        Help the user modify these tasks based on their requests. They may want to:
        1. Edit existing tasks (titles, descriptions, priorities, estimated times)
        2. Add new tasks
        3. Remove tasks
        4. Reorder tasks
        
        When the user is satisfied and says something like "use these tasks" or "add these tasks", 
        respond with a clear, structured list of the final tasks in this format:
        
        FINAL_TASKS_START
        1. Task Title 1
           Description: Description text
           Priority: high/medium/low
           EstimatedTime: X hours Y minutes
        2. Task Title 2
           Description: Description text
           Priority: high/medium/low
           EstimatedTime: X hours Y minutes
        FINAL_TASKS_END
        
        This format will be parsed to create the actual tasks in the workflow.
      `;
      
      // Send to Claude API with system prompt
      const response = await sendMessageToClaude(
        messages as any,
        apiKey,
        'claude-3-7-sonnet-20250219',
        1000,
        0.7,
        systemPrompt // Pass system prompt as an additional parameter
      );
      
      // Remove the loading message
      setChatHistory(prev => prev.filter(msg => !msg.id.startsWith('loading-')));
      
      // Check if the response contains final tasks
      const assistantResponse = response.content;
      console.log('Received response from Claude API:', assistantResponse);
      const finalTasksMatch = assistantResponse.match(/FINAL_TASKS_START\n([\s\S]*?)\nFINAL_TASKS_END/);
      
      if (finalTasksMatch) {
        // Parse the final tasks
        const finalTasksText = finalTasksMatch[1];
        
        // Parse tasks from text
        const parsedTasks: Task[] = [];
        const taskBlocks = finalTasksText.split(/\d+\.\s+/).filter(Boolean);
        
        for (const block of taskBlocks) {
          const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
          
          if (lines.length === 0) continue;
          
          // First line is the title
          const title = lines[0].replace(/\*\*/g, '').trim();
          let description = '';
          let priority: 'low' | 'medium' | 'high' = 'medium';
          let estimatedTime: number | null = null;
          
          // Process the rest of the lines
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.startsWith('Description:')) {
              description = line.substring('Description:'.length).trim();
            } else if (line.startsWith('Priority:')) {
              const priorityText = line.substring('Priority:'.length).trim().toLowerCase();
              if (priorityText.includes('high')) {
                priority = 'high';
              } else if (priorityText.includes('low')) {
                priority = 'low';
              } else {
                priority = 'medium';
              }
            } else if (line.startsWith('EstimatedTime:') || line.startsWith('Estimated Time:')) {
              const timeText = line.includes('EstimatedTime:') 
                ? line.substring('EstimatedTime:'.length).trim()
                : line.substring('Estimated Time:'.length).trim();
              
              // Parse time in hours and minutes
              const hoursMatch = timeText.match(/(\d+)\s*hour/);
              const minutesMatch = timeText.match(/(\d+)\s*minute/);
              
              let totalMinutes = 0;
              if (hoursMatch) {
                totalMinutes += parseInt(hoursMatch[1]) * 60;
              }
              if (minutesMatch) {
                totalMinutes += parseInt(minutesMatch[1]);
              }
              
              estimatedTime = totalMinutes > 0 ? totalMinutes : null;
            }
          }
          
          // Create the task
          parsedTasks.push({
            id: crypto.randomUUID(),
            workflowId: workflowId,
            title,
            description,
            status: 'not_started',
            priority,
            assignees: [],
            dueDate: null,
            startDate: null,
            estimatedTime,
            actualTime: null,
            dependencies: [],
            tools: [],
            tags: [],
            timeEntries: [],
            methodComparison: {
              currentMethod: {
                status: 'not_started',
                timeEntries: []
              },
              aiMethod: {
                status: 'not_started',
                timeEntries: []
              }
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as Task);
        }
        
        // Add the tasks to the workflow
        console.log('Adding parsed tasks to workflow:', parsedTasks.length);
        
        if (parsedTasks.length === 0) {
          // If no tasks were parsed, create a default task
          console.log('No tasks parsed, creating a default task');
          const defaultTaskId = addSingleTask({
            title: 'Default Task',
            description: 'This task was created because no tasks were parsed from the conversation',
            priority: 'medium',
            estimatedTime: 60
          });
          console.log('Default task created with ID:', defaultTaskId);
        } else {
          // Add each parsed task
          parsedTasks.forEach(task => {
            addSingleTask(task);
          });
        }
        
        // Show a clean response without the FINAL_TASKS markers
        const cleanResponse = assistantResponse.replace(/FINAL_TASKS_START\n[\s\S]*?\nFINAL_TASKS_END/, 
          'Great! I\'ve added these tasks to your workflow. You can now view and manage them in the workflow detail page.');
        
        const assistantMessage: ChatMessageType = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: cleanResponse,
          timestamp: new Date().toISOString(),
        };
        
        setChatHistory(prev => [...prev, assistantMessage]);
        
        // Add a success message
        const successMessage: ChatMessageType = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Tasks have been successfully added to your workflow!',
          timestamp: new Date().toISOString(),
        };
        
        setChatHistory(prev => [...prev, successMessage]);
        
        // Force refresh the page to show the new tasks
        window.location.reload();
        
        // Close the chat interface after a short delay
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        // Regular response
        const assistantMessage: ChatMessageType = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: assistantResponse,
          timestamp: new Date().toISOString(),
        };
        
        setChatHistory(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Add error message to chat
      const errorMessage: ChatMessageType = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `I encountered an error while processing your request. Please try again. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      };
      
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };



  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Toggle chat export view
  const toggleChatExport = () => {
    setShowChatExport(!showChatExport);
  };
  
  // Format chat history for export
  const formatChatHistoryForExport = () => {
    return chatHistory.map(msg => {
      return `[${formatTimestamp(msg.timestamp)}] ${msg.role.toUpperCase()}: ${msg.content}`;
    }).join('\n\n');
  };
  
  // Copy chat history to clipboard
  const copyChatToClipboard = () => {
    const formattedChat = formatChatHistoryForExport();
    navigator.clipboard.writeText(formattedChat);
    alert('Chat history copied to clipboard!');
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Chat Header */}
      <div className="bg-primary text-white p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Task Assistant</h2>
          <p className="text-sm opacity-80">Creating tasks for your workflow</p>
        </div>
        <button 
          onClick={toggleChatExport}
          className="bg-white text-primary px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors flex items-center shadow-sm"
          title="View Chat History"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View Chat History
        </button>
      </div>
      
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-primary text-white rounded-br-none'
                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
              }`}
            >
              <div className="whitespace-pre-line" dangerouslySetInnerHTML={{ __html: message.content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }} />
              <div
                className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}
              >
                {formatTimestamp(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-3 bg-gray-100 text-gray-800 rounded-bl-none">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Chat Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={isLoading}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e as any);
              }
            }}
          />
          <button
            type="button"
            onClick={handleSendMessage}
            className="bg-primary text-white p-2 rounded-full hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 disabled:opacity-50"
            disabled={!userInput.trim() || isLoading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Chat Export Modal */}
      {showChatExport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-gray-200 p-4">
              <h3 className="text-lg font-semibold">Chat History</h3>
              <div className="flex space-x-2">
                <button
                  onClick={copyChatToClipboard}
                  className="bg-primary text-white px-3 py-1 rounded-md text-sm hover:bg-primary-dark transition-colors"
                >
                  Copy to Clipboard
                </button>
                <button
                  onClick={toggleChatExport}
                  className="bg-gray-200 text-gray-800 px-3 py-1 rounded-md text-sm hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <pre className="whitespace-pre-wrap text-sm font-mono bg-gray-50 p-4 rounded-md">
                {formatChatHistoryForExport()}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
