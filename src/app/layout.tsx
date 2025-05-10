import '@/styles/globals.css';
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { WorkflowSupabaseProvider } from '@/context/workflow/WorkflowSupabaseContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Simplify - Work Management Platform',
  description: 'A powerful work management platform for teams',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WorkflowSupabaseProvider>
          {children}
        </WorkflowSupabaseProvider>
      </body>
    </html>
  );
}
