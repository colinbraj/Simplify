'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  UserCircleIcon, 
  SunIcon, 
  MoonIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

export default function SettingsPage() {
  // User profile state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  
  // Theme state
  const [darkMode, setDarkMode] = useState(false);
  
  // Save status
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Load saved settings on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load theme preference
      const savedTheme = localStorage.getItem('theme_preference');
      if (savedTheme === 'dark') {
        setDarkMode(true);
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark-mode');
      } else {
        // Ensure light mode is properly set
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark-mode');
      }
      
      // Load user profile
      const savedProfile = localStorage.getItem('user_profile');
      if (savedProfile) {
        try {
          const profile = JSON.parse(savedProfile);
          setFirstName(profile.firstName || '');
          setLastName(profile.lastName || '');
          setEmail(profile.email || '');
        } catch (error) {
          console.error('Error parsing saved profile:', error);
        }
      }
    }
  }, []);

  // Handle saving user profile
  const handleSaveProfile = () => {
    try {
      const profile = { firstName, lastName, email };
      localStorage.setItem('user_profile', JSON.stringify(profile));
      setSaveStatus('success');
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveStatus('error');
    }
  };

  // Handle theme toggle
  const handleToggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (typeof window !== 'undefined') {
      if (newDarkMode) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme_preference', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme_preference', 'light');
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 dark:bg-gray-900 dark:text-white">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link href="/dashboard" className="text-gray-600 hover:text-primary mr-3 dark:text-gray-300 dark:hover:text-primary">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Settings</h1>
        </div>
        
        <p className="text-gray-600 dark:text-gray-400">
          Configure your application settings and preferences.
        </p>
      </div>
      
      {/* Settings Sections */}
      <div className="grid grid-cols-1 gap-8">
        {/* Theme Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              {darkMode ? (
                <MoonIcon className="h-6 w-6 text-primary mr-2" />
              ) : (
                <SunIcon className="h-6 w-6 text-primary mr-2" />
              )}
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Appearance</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Customize the appearance of the application.
            </p>
          </div>
          
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-800 dark:text-white">Dark Mode</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Switch between light and dark themes</p>
              </div>
              <button
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  darkMode ? 'bg-primary' : 'bg-gray-300'
                }`}
                onClick={handleToggleTheme}
                aria-label="Toggle dark mode"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
        
        {/* User Profile */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <UserCircleIcon className="h-6 w-6 text-primary mr-2" />
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">User Profile</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your personal information.
            </p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            
            {saveStatus === 'success' && (
              <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-4 rounded-md mt-6 flex items-start">
                <CheckCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <p>Your profile has been saved successfully!</p>
              </div>
            )}
            
            {saveStatus === 'error' && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-4 rounded-md mt-6 flex items-start">
                <ExclamationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <p>An error occurred while saving your profile. Please try again.</p>
              </div>
            )}
            
            <div className="mt-6">
              <button
                className="btn btn-primary dark:bg-primary dark:hover:bg-primary/90 dark:text-white"
                onClick={handleSaveProfile}
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
