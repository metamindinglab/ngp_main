import Link from 'next/link';
import { MMLLogo } from './mml-logo';
import { ReactNode } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
  loading?: boolean;
  error?: string;
  className?: string;
}

export function DashboardLayout({ children, loading, error, className = "" }: DashboardLayoutProps) {
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Link href="/" className="self-start transform hover:scale-105 transition-transform">
          <MMLLogo />
        </Link>
        <div className="mt-8 flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Link href="/" className="self-start transform hover:scale-105 transition-transform">
          <MMLLogo />
        </Link>
        <div className="mt-8 flex flex-col items-center justify-center h-[60vh]">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-red-500 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`container mx-auto p-6 ${className}`}>
      <Link href="/" className="self-start transform hover:scale-105 transition-transform">
        <MMLLogo />
      </Link>
      <div className="mt-8">
        {children}
      </div>
    </div>
  );
} 