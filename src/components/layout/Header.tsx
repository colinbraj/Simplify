'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  MagnifyingGlassIcon, 
  BellIcon, 
  QuestionMarkCircleIcon,
  PlusIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

export default function Header() {
  // State removed as notification and help features are no longer needed

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4">
      {/* Left Section - Search */}
      <div className="relative w-64">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input 
          type="text" 
          className="bg-gray-100 border-none rounded-lg pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
          placeholder="Search..."
        />
      </div>

      {/* Center Section - Empty Space */}
      <div className="flex-1"></div>

      {/* Right Section - User Menu */}
      <div className="flex items-center">
        
        {/* User Profile */}
        <div className="relative">
          <button className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">JD</span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
