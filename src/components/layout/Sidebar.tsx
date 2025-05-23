'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  HomeIcon, 
  Squares2X2Icon as ViewBoardsIcon, 
  CalendarIcon, 
  ChartBarIcon, 
  UserGroupIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  // Removed workspaces state

  return (
    <aside 
      className={`bg-white border-r border-gray-200 transition-all duration-300 flex flex-col ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-gray-200">
        <Link href="/" className="w-full">
          {collapsed ? (
            <div className="w-full flex justify-center">
              <span className="text-2xl font-bold text-primary hover:text-primary/80 transition-colors">S</span>
            </div>
          ) : (
            <h1 className="text-2xl font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer">Simplify</h1>
          )}
        </Link>
      </div>

      {/* Toggle Button */}
      <div className="p-4 flex justify-end">
        <button 
          className="p-1 rounded-md hover:bg-gray-100"
          onClick={onToggle}
        >
          {collapsed ? (
            <ChevronRightIcon className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
          )}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 border-t border-gray-200">
        <ul className="space-y-1">
          <li>
            <Link 
              href="/dashboard" 
              className="flex items-center p-2 rounded-md bg-primary/10 text-primary"
            >
              <HomeIcon className="h-5 w-5" />
              {!collapsed && <span className="ml-3">Home</span>}
            </Link>
          </li>
          <li>
            <Link 
              href="/workflows" 
              className="flex items-center p-2 rounded-md hover:bg-gray-100 text-gray-700"
            >
              <ViewBoardsIcon className="h-5 w-5" />
              {!collapsed && <span className="ml-3">Workflows</span>}
            </Link>
          </li>
          <li>
            <Link 
              href="/reports" 
              className="flex items-center p-2 rounded-md hover:bg-gray-100 text-gray-700"
            >
              <ChartBarIcon className="h-5 w-5" />
              {!collapsed && <span className="ml-3">Reports</span>}
            </Link>
          </li>
        </ul>
      </nav>

      {/* Settings Link */}
      <div className="p-4 border-t border-gray-200">
        <Link 
          href="/settings" 
          className="flex items-center p-2 rounded-md hover:bg-gray-100 text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {!collapsed && <span className="ml-3">Settings</span>}
        </Link>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700">JD</span>
          </div>
          {!collapsed && (
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">John Doe</p>
              <p className="text-xs text-gray-500">john@example.com</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
