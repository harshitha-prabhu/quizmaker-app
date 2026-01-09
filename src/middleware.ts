/**
 * Next.js Middleware for Authentication
 * 
 * Protects routes and handles authentication redirects.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_CONFIG } from '@/lib/services/session.service';

/**
 * Public routes that don't require authentication
 */
const PUBLIC_ROUTES = ['/', '/login', '/register'];

/**
 * Protected routes that require authentication
 */
const PROTECTED_ROUTES = ['/dashboard', '/mcqs', '/quizzes'];

/**
 * Middleware function to handle authentication
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Check if route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Get session token from cookies
  const sessionToken = request.cookies.get(SESSION_CONFIG.COOKIE_NAME)?.value;

  // If no session token, redirect to login
  if (!sessionToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // TODO: Validate session token against database
  // For now, we'll let the route handler validate the session
  // This is because middleware doesn't have direct database access
  // in the same way server actions do
  
  // In a production setup, you might want to:
  // 1. Cache session validation results
  // 2. Use a JWT token that can be validated without DB lookup
  // 3. Or validate session in the route handler itself

  return NextResponse.next();
}

/**
 * Configure which routes the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

