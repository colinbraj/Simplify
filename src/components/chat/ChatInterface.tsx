'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useWorkflowStore, ChatMessage as ChatMessageType, Task } from '@/context/workflow/WorkflowContext';
import { sendMessageToClaude } from '@/lib/claude/api';
import { getClaudeConfig } from '@/lib/claude/config';
import ChatMessage from '@/components/chat/ChatMessage';
import ChatInput from '@/components/chat/ChatInput';

export default function ChatInterface() {
  const { 
    workflowCreation, 
    addChatMessage, 
    updateWorkflowCreation,
    completeWorkflowCreation,
    resetWorkflowCreation
  } = useWorkflowStore();
  
  const { chatHistory, currentStep } = workflowCreation;
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const claudeConfig = getClaudeConfig();

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Function to parse suggested tasks from chat history
  const parseSuggestedTasksFromChat = (chatHistory: ChatMessageType[]): Task[] => {
    // Look for the assistant message that contains task suggestions
    const taskSuggestionMessage = chatHistory.find(msg => 
      msg.role === 'assistant' && 
      (msg.content.includes('suggested tasks') || msg.content.includes('task suggestions'))
    );
    
    if (!taskSuggestionMessage) return [];
    
    // Try to parse tasks from the message
    const tasks: Task[] = [];
    const lines = taskSuggestionMessage.content.split('\n');
    
    let currentTask: Partial<Task> | null = null;
    
    for (const line of lines) {
      // Look for lines that might be task titles (numbered items or with a task name prefix)
      const taskTitleMatch = line.match(/^\d+\.\s+(.+?)(?:\s*-|\s*:|\s*$)/) || 
                             line.match(/^Task(?:\s+name)?(?:\s*-|\s*:)\s*(.+)$/i);
      
      if (taskTitleMatch) {
        // If we were building a task, add it to the list
        if (currentTask?.title) {
          tasks.push({
            ...currentTask,
            id: crypto.randomUUID(),
            workflowId: '',
            status: 'not_started',
            assignees: [],
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
        
        // Start a new task
        currentTask = {
          title: taskTitleMatch[1].trim(),
          description: '',
          priority: 'medium', // Default priority
          dueDate: null,
          startDate: null,
          estimatedTime: null,
          actualTime: null,
        };
        continue;
      }
      
      // If we're building a task, look for task details
      if (currentTask) {
        // Look for description
        const descriptionMatch = line.match(/description:?\s*(.+)/i) || 
                                line.match(/^(?!.*(?:priority|time|hours|minutes|level)):?\s*(.+)/i);
        
        if (descriptionMatch && !currentTask.description) {
          currentTask.description = descriptionMatch[1].trim();
          continue;
        }
        
        // Look for priority
        const priorityMatch = line.match(/priority:?\s*(.+)/i) || 
                             line.match(/level:?\s*(.+)/i);
        
        if (priorityMatch) {
          const priority = priorityMatch[1].toLowerCase().trim();
          if (priority.includes('high') || priority.includes('urgent')) {
            currentTask.priority = 'high';
          } else if (priority.includes('medium')) {
            currentTask.priority = 'medium';
          } else if (priority.includes('low')) {
            currentTask.priority = 'low';
          }
          continue;
        }
        
        // Look for estimated time
        const timeMatch = line.match(/(?:estimated|time|duration):?\s*(\d+)\s*(hours?|mins?|minutes?)/i) ||
                         line.match(/(\d+)\s*(hours?|mins?|minutes?)/i);
        
        if (timeMatch) {
          const amount = parseInt(timeMatch[1]);
          const unit = timeMatch[2].toLowerCase();
          
          if (unit.startsWith('hour')) {
            currentTask.estimatedTime = amount * 60; // Convert hours to minutes
          } else {
            currentTask.estimatedTime = amount; // Already in minutes
          }
          continue;
        }
      }
    }
    
    // Add the last task if we were building one
    if (currentTask?.title) {
      tasks.push({
        ...currentTask,
        id: crypto.randomUUID(),
        workflowId: '',
        status: 'not_started',
        assignees: [],
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
    
    return tasks;
  };

  // Handle sending a message to Claude
  const handleSendMessage = async (content: string, imageData?: string) => {
    if ((!content.trim() && !imageData) || isLoading) return;

    // Add user message to chat
    addChatMessage({
      role: 'user',
      content: imageData ? `${content}\n[Image attached]` : content,
      imageData: imageData || undefined,
    } as ChatMessageType);

    setIsLoading(true);

    try {
      // Process the message based on current workflow creation step
      await processMessage(content, imageData);
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Add error message
      addChatMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
      } as ChatMessageType);
    } finally {
      setIsLoading(false);
    }
  };

  // Process the message based on current workflow creation step
  const processMessage = async (content: string, imageData?: string) => {
    // Use environment variable API key directly if claudeConfig.apiKey is not available
    // Check for the client-side accessible environment variable with NEXT_PUBLIC_ prefix
    const apiKey = claudeConfig.apiKey || process.env.NEXT_PUBLIC_CLAUDE_API_KEY;
    
    if (!apiKey) {
      addChatMessage({
        role: 'assistant',
        content: 'Claude API key is not available. Please check your environment configuration.',
      } as ChatMessageType);
      return;
    }

    // Format messages for Claude API
    const messages = chatHistory.map(msg => {
      const formattedMsg: any = {
        role: msg.role === 'system' ? 'user' : msg.role,
        content: msg.content
      };

      // If the message has an image, add it to the content array
      if (msg.imageData) {
        formattedMsg.content = [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: msg.imageData.startsWith('data:image/png') ? 'image/png' : 'image/jpeg',
              data: msg.imageData.split(',')[1] // Remove the data:image/jpeg;base64, part
            }
          },
          {
            type: 'text',
            text: msg.content
          }
        ];
      }

      return formattedMsg;
    });

    // Add the new user message
    const newUserMessage: any = {
      role: 'user',
      content: content
    };

    // If the new message has an image, format it for Claude's vision API
    if (imageData) {
      newUserMessage.content = [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: imageData.startsWith('data:image/png') ? 'image/png' : 'image/jpeg',
            data: imageData.split(',')[1] // Remove the data:image/jpeg;base64, part
          }
        }
      ];

      // Add text content if provided
      if (content.trim()) {
        newUserMessage.content.push({
          type: 'text',
          text: content
        });
      }
    }

    messages.push(newUserMessage);

    // Handle different workflow creation steps
    switch (currentStep) {
      case 'initial':
        // User is providing the workflow name
        updateWorkflowCreation({
          workflowTitle: content,
          currentStep: 'naming'
        });

        // Use Claude to generate a personalized response
        try {
          const namePrompt = `
            The user wants to create a workflow named "${content}". 
            Generate a friendly, conversational response acknowledging their workflow name and asking for a description of what this workflow is for.
            Keep your response under 2 sentences and make it sound natural and helpful.
          `;
          
          console.log('Generating personalized response for workflow name:', content);
          
          const response = await sendMessageToClaude(
            [{ role: 'user', content: namePrompt }],
            apiKey,
            'claude-3-haiku-20240307', // Using a smaller model for faster response
            300
          );
          
          addChatMessage({
            role: 'assistant',
            content: response.content,
          } as ChatMessageType);
        } catch (error) {
          console.error('Error in initial step:', error);
          // Show the error to the user instead of using a predetermined response
          addChatMessage({
            role: 'assistant',
            content: `I encountered an error while processing your request. Please try again or check the console for more details. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          } as ChatMessageType);
        }
        break;

      case 'naming':
        // User is providing the workflow description
        updateWorkflowCreation({
          workflowDescription: content,
          currentStep: 'tasks'
        });

        // Generate a loading message
        addChatMessage({
          role: 'assistant',
          content: `Analyzing your workflow description and generating task suggestions...`,
        } as ChatMessageType);

        // Call Claude API to get task suggestions
        try {
          console.log('Generating task suggestions for workflow:', workflowCreation.workflowTitle);
          const systemPrompt = `
            I need to create a workflow named "${workflowCreation.workflowTitle}" with the following description: "${content}".
            
            Please suggest 5-7 tasks that would be appropriate for this workflow. 
            For each task, include:
            1. Task name (short and clear)
            2. Brief description (1-2 sentences)
            3. Estimated time to complete (in hours)
            4. Priority level (low, medium, high, urgent)
            
            Format your response as a structured list that I can easily read.
            
            IMPORTANT: Your response should ONLY include the task list without any introduction or conclusion.
          `;

          console.log('Sending prompt to Claude API:', systemPrompt);
          console.log('Using API key:', apiKey ? 'API key exists' : 'No API key');
          
          const response = await sendMessageToClaude(
            [{ 
              role: 'user', 
              content: systemPrompt 
            }],
            apiKey,
            'claude-3-sonnet-20240229',
            2000
          );

          console.log('Received response from Claude API:', response);

          // Parse tasks from Claude's response
          const suggestedTasks = parseSuggestedTasksFromChat([{
            id: crypto.randomUUID(),
            role: 'assistant',
            content: response.content,
            timestamp: new Date().toISOString()
          }]);

          // Update workflow creation state with suggested tasks
          updateWorkflowCreation({
            suggestedTasks,
            selectedTasks: suggestedTasks // Automatically select all suggested tasks
          });

          // Add Claude's response to chat
          addChatMessage({
            role: 'assistant',
            content: `Here are the suggested tasks for your "${workflowCreation.workflowTitle}" workflow:\n\n${response.content}\n\nWould you like to create this workflow now with these tasks? Reply with "yes" to create the workflow, or let me know if you'd like to modify any tasks first.`,
          } as ChatMessageType);
        } catch (error) {
          console.error('Error getting task suggestions:', error);
          // Log detailed error information
          if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
          }
          // Type assertion for axios error
          const axiosError = error as any;
          if (axiosError.response) {
            console.error('Error response data:', axiosError.response.data);
            console.error('Error response status:', axiosError.response.status);
            console.error('Error response headers:', axiosError.response.headers);
          }
          
          // Show the error to the user instead of using a predetermined response
          addChatMessage({
            role: 'assistant',
            content: `I encountered an error generating task suggestions. Error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check the console for more details.`,
          } as ChatMessageType);
        }
        break;

      case 'tasks':
        // Check if the user wants to complete the workflow with suggested tasks
        if (content.toLowerCase().includes('use these tasks') || 
            content.toLowerCase().includes('looks good') ||
            content.toLowerCase().includes('proceed with these') ||
            (content.toLowerCase().includes('yes') && !content.toLowerCase().includes('remove') && !content.toLowerCase().includes('change') && !content.toLowerCase().includes('edit'))) {
          
          // Select all suggested tasks if none are selected yet
          if (workflowCreation.selectedTasks.length === 0 && workflowCreation.suggestedTasks.length > 0) {
            updateWorkflowCreation({
              selectedTasks: workflowCreation.suggestedTasks
            });
          }
          
          // Complete the workflow creation with the selected tasks
          const workflowId = completeWorkflowCreation();
          
          // Add a success message
          addChatMessage({
            role: 'assistant',
            content: `Great! I've created your "${workflowCreation.workflowTitle}" workflow with ${workflowCreation.selectedTasks.length} tasks. You can now view and manage your workflow.`,
          } as ChatMessageType);
          
          // Redirect to the workflow page after a short delay
          setTimeout(() => {
            window.location.href = `/workflows/${workflowId}`;
          }, 2000);
          
        } 
        // Check if the user wants to edit tasks
        else if (content.toLowerCase().includes('edit') || 
                 content.toLowerCase().includes('change') || 
                 content.toLowerCase().includes('modify') || 
                 content.toLowerCase().includes('remove') || 
                 content.toLowerCase().includes('add') || 
                 content.toLowerCase().includes('replace')) {
          
          try {
            // Process task editing request
            const editPrompt = `
              We are creating a workflow named "${workflowCreation.workflowTitle}" with the description: "${workflowCreation.workflowDescription}".
              
              I've suggested these tasks:
              ${workflowCreation.suggestedTasks.map((task, index) => 
                `${index + 1}. ${task.title} - ${task.description} (Priority: ${task.priority}${task.estimatedTime ? `, Est. time: ${task.estimatedTime} minutes` : ''})`
              ).join('\n')}
              
              The user wants to edit these tasks with this request: "${content}"
              
              Please respond with:
              1. A helpful response acknowledging their edit request
              2. A COMPLETE updated list of tasks with the requested changes applied
              
              Format your response so that the updated task list is clearly separated from your message and formatted as a numbered list.
              Make sure each task has a title, description, priority, and estimated time.
            `;
            
            const response = await sendMessageToClaude(
              [{ role: 'user', content: editPrompt }],
              apiKey,
              'claude-3-sonnet-20240229',
              1500
            );

            // Add Claude's response to chat
            addChatMessage({
              role: 'assistant',
              content: response.content,
            } as ChatMessageType);
            
            // Extract the updated task list from Claude's response
            const updatedTasks = parseSuggestedTasksFromChat([{
              id: crypto.randomUUID(),
              role: 'assistant',
              content: response.content,
              timestamp: new Date().toISOString()
            }]);
            
            // If we successfully parsed updated tasks, update the workflow creation state
            if (updatedTasks.length > 0) {
              updateWorkflowCreation({
                suggestedTasks: updatedTasks,
                // Don't automatically select tasks yet
              });
            }
            
            // Add a follow-up prompt to create the workflow
            addChatMessage({
              role: 'assistant',
              content: `Are you happy with these tasks now? Say "use these tasks" to create the workflow, or let me know if you'd like to make more changes.`,
            } as ChatMessageType);
          } catch (error) {
            console.error('Error processing task edits:', error);
            
            // Show the error to the user
            addChatMessage({
              role: 'assistant',
              content: `I encountered an error processing your task edits. Error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check the console for more details.`,
            } as ChatMessageType);
          }
        } else {
          // User has some other question or comment
          try {
            const taskPrompt = `
              We are creating a workflow named "${workflowCreation.workflowTitle}" with the description: "${workflowCreation.workflowDescription}".
              
              I've suggested these tasks:
              ${workflowCreation.suggestedTasks.map((task, index) => 
                `${index + 1}. ${task.title} - ${task.description} (Priority: ${task.priority}${task.estimatedTime ? `, Est. time: ${task.estimatedTime} minutes` : ''})`
              ).join('\n')}
              
              The user's message is: "${content}"
              
              Please provide a helpful response that addresses their message. If they're asking a question about the workflow or tasks, answer it helpfully.
              Keep your response concise and focused on helping them complete their workflow creation.
            `;
            
            const response = await sendMessageToClaude(
              [{ role: 'user', content: taskPrompt }],
              apiKey,
              'claude-3-sonnet-20240229',
              1000
            );

            // Add Claude's response to chat
            addChatMessage({
              role: 'assistant',
              content: response.content,
            } as ChatMessageType);
            
            // Add a follow-up prompt to create the workflow
            addChatMessage({
              role: 'assistant',
              content: `Would you like to use the suggested tasks to create this workflow now? Say "use these tasks" to proceed, or let me know if you'd like to modify any tasks.`,
            } as ChatMessageType);
          } catch (error) {
            console.error('Error in tasks step:', error);
            
            // Show the error to the user
            addChatMessage({
              role: 'assistant',
              content: `I encountered an error processing your message. Error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check the console for more details.`,
            } as ChatMessageType);
          }
        }
        break;

      case 'complete':
        // Workflow has been completed, start a new one
        resetWorkflowCreation();
        
        addChatMessage({
          role: 'assistant',
          content: `Would you like to create another workflow?`,
        } as ChatMessageType);
        break;

      default:
        // For other steps, just have a conversation
        try {
          // Add some context about the workflow to help Claude provide a more relevant response
          const contextPrompt = `
            We are creating a workflow named "${workflowCreation.workflowTitle}" with the description: "${workflowCreation.workflowDescription}".
            The current step is: "${currentStep}".
            
            The user's message is: "${content}"
            
            Please provide a helpful, conversational response that addresses their message and helps them continue building their workflow.
            Keep your response concise and focused on helping them with their current step.
          `;
          
          const defaultResponse = await sendMessageToClaude(
            [{ role: 'user', content: contextPrompt }],
            apiKey,
            'claude-3-sonnet-20240229',
            1000
          );

          // Add Claude's response to chat
          addChatMessage({
            role: 'assistant',
            content: defaultResponse.content,
          } as ChatMessageType);
        } catch (error) {
          console.error('Error in default conversation:', error);
          
          // Show the error to the user
          addChatMessage({
            role: 'assistant',
            content: `I encountered an error processing your message. Error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check the console for more details.`,
          } as ChatMessageType);
        }
        break;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md overflow-hidden">
      {/* Chat header */}
      <div className="bg-primary text-white p-4 shadow-sm">
        <h2 className="text-xl font-semibold">Workflow Assistant</h2>
        <p className="text-sm opacity-80">
          {currentStep === 'initial' && 'Creating a new workflow'}
          {currentStep === 'naming' && `Defining "${workflowCreation.workflowTitle}" workflow`}
          {currentStep === 'tasks' && `Adding tasks to "${workflowCreation.workflowTitle}"`}
          {currentStep === 'tools' && 'Assigning tools to tasks'}
          {currentStep === 'users' && 'Assigning users to tasks'}
          {currentStep === 'review' && 'Reviewing workflow'}
          {currentStep === 'complete' && 'Workflow created'}
        </p>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        
        {isLoading && (
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Chat input */}
      <div className="border-t border-gray-200 p-4">
        <ChatInput 
          onSendMessage={handleSendMessage} 
          disabled={isLoading} 
          placeholder={isLoading ? 'Thinking...' : 'Type your message...'}
        />
      </div>
    </div>
  );
}
