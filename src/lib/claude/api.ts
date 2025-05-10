/**
 * Claude API Integration
 * This file contains utility functions for communicating with the Claude API
 * using the official Anthropic SDK
 */

import Anthropic from '@anthropic-ai/sdk';

// Types for Claude API
export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string | ClaudeMessageContent[];
}

export interface ClaudeMessageContent {
  type: 'text' | 'image';
  text?: string;
  source?: {
    type: 'base64';
    media_type: string;
    data: string;
  };
}

// Types for Claude API response
export interface TextBlock {
  type: 'text';
  text: string;
  citations?: Array<{
    start: number;
    end: number;
    text: string;
    type: string;
  }>;
}

export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, any>;
}

export type ContentBlock = TextBlock | ToolUseBlock;

export interface ClaudeResponse {
  content: string;
  model: string;
  stop_reason: string;
  stop_sequence: string | null;
}

// Initialize Anthropic client
let anthropicClient: Anthropic | null = null;

// Get or create the Anthropic client
export const getAnthropicClient = (apiKey?: string): Anthropic => {
  if (!anthropicClient || apiKey) {
    // Use the provided API key, or try to get it from environment variables
    // NEXT_PUBLIC_ prefix is required for client-side access
    const envKey = process.env.NEXT_PUBLIC_CLAUDE_API_KEY;
    
    const finalKey = apiKey || envKey;
    if (!finalKey) {
      console.error('No API key available for Claude API. Please check your environment variables or provide a key.');
    }
    
    anthropicClient = new Anthropic({
      apiKey: finalKey || '',
      dangerouslyAllowBrowser: true // Allow usage in browser environments
    });
    
    // Log initialization status but not the key itself for security
    if (apiKey) {
      console.log('Anthropic client initialized with custom API key');
    } else if (envKey) {
      console.log('Anthropic client initialized with environment API key');
    } else {
      console.log('Warning: Anthropic client initialized without API key');
    }
  }
  return anthropicClient;
};

// Test the API key
export const testClaudeApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    const client = getAnthropicClient(apiKey);
    
    // Simple test message
    const response = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'Hello, this is a test message. Please respond with "API key is working correctly."'
        }
      ]
    });
    
    console.log('Test API response:', response);
    return true;
  } catch (error) {
    console.error('API key test failed:', error);
    return false;
  }
};

// Send a message to Claude
export const sendMessageToClaude = async (
  messages: ClaudeMessage[],
  apiKey: string,
  model: string = 'claude-3-7-sonnet-20250219', // Updated to latest model version
  maxTokens: number = 1000,
  temperature: number = 0.7,
  systemPrompt?: string // Optional system prompt parameter
): Promise<ClaudeResponse> => {
  try {
    // Get the Anthropic client with the provided API key
    const client = getAnthropicClient(apiKey);
    
    // Format messages for the Anthropic SDK
    const formattedMessages = messages.map(msg => {
      // If content is a string, keep it as is
      if (typeof msg.content === 'string') {
        return {
          role: msg.role,
          content: msg.content
        };
      }
      
      // If content is an array of content blocks, format them for the SDK
      return {
        role: msg.role,
        content: msg.content.map(contentBlock => {
          if (contentBlock.type === 'text') {
            return {
              type: 'text',
              text: contentBlock.text
            };
          } else if (contentBlock.type === 'image' && contentBlock.source) {
            return {
              type: 'image',
              source: {
                type: contentBlock.source.type,
                media_type: contentBlock.source.media_type,
                data: contentBlock.source.data
              }
            };
          }
          return contentBlock;
        })
      };
    });
    
    // Log the request payload
    console.log('Claude API request payload:', JSON.stringify({
      model,
      messages: formattedMessages,
      max_tokens: maxTokens,
      temperature,
    }, null, 2));
    
    // Make the API request
    const response = await client.messages.create({
      model,
      messages: formattedMessages as any, // Type assertion needed due to SDK types
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt, // Add system prompt if provided
    });
    
    console.log('Claude API response:', JSON.stringify(response, null, 2));
    
    // Extract text content from the response
    let content = '';
    if (response.content && Array.isArray(response.content)) {
      // Use a more direct approach to extract text content
      const textBlocks = [];
      for (const block of response.content) {
        if (block.type === 'text' && 'text' in block) {
          textBlocks.push(block.text);
        }
      }
      content = textBlocks.join('\n');
    }
    
    return {
      content,
      model: response.model,
      stop_reason: response.stop_reason || 'unknown',
      stop_sequence: response.stop_sequence || null
    };
  } catch (error) {
    console.error('Error sending message to Claude:', error);
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    throw error;
  }
};

// Generate workflow suggestions
export const generateWorkflowSuggestions = async (
  workflowName: string,
  workflowDescription: string,
  apiKey: string
): Promise<string> => {
  const prompt = `
    I need to create a workflow named "${workflowName}" with the following description: "${workflowDescription}".
    
    Please suggest a structured list of tasks that would be appropriate for this workflow. 
    For each task, include:
    1. Task name
    2. Brief description
    3. Estimated time to complete
    4. Suggested tools or resources needed
    5. Dependencies (if any)
    
    Format your response as a structured list that could be parsed programmatically.
  `;

  const response = await sendMessageToClaude(
    [{ role: 'user', content: prompt }],
    apiKey
  );

  return response.content;
};

// Generate task recommendations
export const generateTaskRecommendations = async (
  workflowContext: string,
  currentTasks: string[],
  apiKey: string
): Promise<string> => {
  const prompt = `
    I'm working on a workflow with the following context: "${workflowContext}".
    
    I already have the following tasks planned:
    ${currentTasks.map(task => `- ${task}`).join('\n')}
    
    Please suggest 3-5 additional tasks that would complement this workflow.
    For each suggestion, provide:
    1. Task name
    2. Brief description
    3. Why this task would be valuable
    
    Format your response as a structured list that could be parsed programmatically.
  `;

  const response = await sendMessageToClaude(
    [{ role: 'user', content: prompt }],
    apiKey
  );

  return response.content;
};

// Generate workflow analysis and report
export const generateWorkflowAnalysis = async (
  workflowData: any,
  timeTrackingData: any,
  apiKey: string
): Promise<string> => {
  const prompt = `
    Please analyze the following workflow and its time tracking data to provide insights and recommendations:
    
    Workflow: ${JSON.stringify(workflowData)}
    
    Time Tracking Data: ${JSON.stringify(timeTrackingData)}
    
    In your analysis, please include:
    1. Overall workflow efficiency
    2. Bottlenecks or delays
    3. Tasks that took longer than expected
    4. Recommendations for improvement
    5. Suggestions for future workflows
    
    Format your response in a way that's easy to read and could be presented in a report.
  `;

  const response = await sendMessageToClaude(
    [{ role: 'user', content: prompt }],
    apiKey
  );

  return response.content;
};
