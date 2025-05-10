'use client';

import React from 'react';
import { format } from 'date-fns';
import { ChatMessage as ChatMessageType } from '@/context/workflow/WorkflowContext';
import { UserCircleIcon } from '@heroicons/react/24/solid';

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const { role, content, timestamp } = message;
  const isUser = role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`
        flex max-w-[80%] 
        ${isUser ? 'flex-row-reverse' : 'flex-row'}
      `}>
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
          {isUser ? (
            <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
              <UserCircleIcon className="h-8 w-8" />
            </div>
          ) : (
            <div className="h-8 w-8 rounded-full bg-secondary text-white flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
        
        {/* Message content */}
        <div>
          <div className={`
            p-3 rounded-lg 
            ${isUser 
              ? 'bg-primary text-white rounded-tr-none' 
              : 'bg-gray-100 text-gray-800 rounded-tl-none'}
          `}>
            {/* Render message content with markdown support */}
            <div className="prose prose-sm max-w-none">
              {content.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < content.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </div>
          </div>
          
          {/* Timestamp */}
          <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {format(new Date(timestamp), 'h:mm a')}
          </div>
        </div>
      </div>
    </div>
  );
}
