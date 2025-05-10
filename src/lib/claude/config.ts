/**
 * Claude API Configuration
 * This file handles secure access to API keys and configuration
 */

// Environment variable names
const CLAUDE_API_KEY_ENV = 'NEXT_PUBLIC_CLAUDE_API_KEY';
const ANTHROPIC_API_KEY_ENV = 'ANTHROPIC_API_KEY';

// Interface for Claude API configuration
export interface ClaudeConfig {
  apiKey: string | null;
  isConfigured: boolean;
}

// Get Claude API configuration from environment variables or local storage
export const getClaudeConfig = (): ClaudeConfig => {
  // In Next.js, client-side environment variables must be prefixed with NEXT_PUBLIC_
  const envApiKey = process.env.NEXT_PUBLIC_CLAUDE_API_KEY || null;
  
  if (envApiKey) {
    return {
      apiKey: envApiKey,
      isConfigured: true,
    };
  }

  // Fall back to local storage (client-side) if no env variable
  if (typeof window !== 'undefined') {
    try {
      const apiKey = localStorage.getItem('claude_api_key');
      return {
        apiKey,
        isConfigured: !!apiKey,
      };
    } catch (error) {
      console.error('Error accessing local storage:', error);
    }
  }

  return {
    apiKey: null,
    isConfigured: false,
  };
};

// Save Claude API key to local storage
export const saveClaudeApiKey = (apiKey: string): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('claude_api_key', apiKey);
    } catch (error) {
      console.error('Error saving to local storage:', error);
    }
  }
};

// Remove Claude API key from local storage
export const removeClaudeApiKey = (): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('claude_api_key');
    } catch (error) {
      console.error('Error removing from local storage:', error);
    }
  }
};

// Check if Claude API is configured
export const isClaudeConfigured = (): boolean => {
  const config = getClaudeConfig();
  return config.isConfigured;
};
