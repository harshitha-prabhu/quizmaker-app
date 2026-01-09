/**
 * Navigation Bar Component
 * 
 * Main navigation component that shows different options based on authentication status.
 */

'use client';

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { logoutUser } from '@/app/actions/auth';
import { toast } from 'sonner';
import { LogOut, User, Home } from 'lucide-react';

interface NavbarProps {
  user?: {
    first_name: string;
    last_name: string;
  } | null;
}

export function Navbar({ user = null }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const result = await logoutUser();
      if (result.success) {
        toast.success('Logged out successfully');
        router.push('/login');
        router.refresh();
      } else {
        toast.error('Failed to log out. Please try again.');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('An error occurred during logout.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Don't show navbar on auth pages
  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Home className="h-5 w-5" />
            QuizMaker
          </Link>
          {user && (
            <Link
              href="/dashboard"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === '/dashboard'
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              Dashboard
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {user.first_name} {user.last_name}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

