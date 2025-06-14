import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  id: string;
  email: string;
  role: string;
  verificationStatus: string;
  iat: number;
  exp: number;
}

// Define which routes are protected and require authentication
const protectedRoutes = [
  '/dashboard',
  '/dashboard/doctor',
  '/dashboard/hospital',
  '/dashboard/compounder',
  '/dashboard/medStore',
  '/dashboard/clinic',
  '/dashboard/patient',
  '/dashboard/checkup-center',
  '/doctors',
  '/patients',
  '/hospitals',
  '/reviews',
  '/profile',
];

// Define routes that require verification
const verificationRequiredRoutes = [
  '/dashboard/doctor',
  '/dashboard/hospital',
  '/dashboard/compounder',
  '/dashboard/medStore',
  '/dashboard/clinic',
  '/dashboard/patient',
  '/dashboard/checkup-center',
];

// Define public routes that don't need authentication
const publicRoutes = [
  '/auth/login',
  '/auth/sign-up',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verification-status',
];

async function checkVerificationStatus(token: string) {
  try {
    const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:9001';
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      return false;
    }
    
    const userData = await response.json();
    return userData.verificationStatus === 'VERIFIED';
  } catch (error) {
    console.error('Error checking verification status:', error);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;
  
  // Allow API routes to be handled by the API handlers
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }
  
  // Check for static files and allow them
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // If the path is /auth/verification-status, allow access if user has token
  if (pathname === '/auth/verification-status') {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    return NextResponse.next();
  }

  // Check if route is protected and user is not authenticated
  if (isProtectedRoute(pathname) && !token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is authenticated and trying to access login/register pages, redirect to dashboard
  if (isAuthPage(pathname) && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Check verification status for routes that require verification
  if (token && isVerificationRequiredRoute(pathname)) {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      
      // Check real-time verification status
      const isVerified = await checkVerificationStatus(token);
      
      // If user is not verified, redirect to verification status page
      if (!isVerified) {
        // Prevent redirect loop by checking if already on verification status page
        if (pathname !== '/auth/verification-status') {
          return NextResponse.redirect(new URL('/auth/verification-status', request.url));
        }
      }
    } catch (error) {
      // If token is invalid, redirect to login
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// Helper function to check if route is protected
function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => pathname.startsWith(route));
}

// Helper function to check if route requires verification
function isVerificationRequiredRoute(pathname: string): boolean {
  return verificationRequiredRoutes.some(route => pathname.startsWith(route));
}

// Helper function to check if route is a public auth page like login
function isAuthPage(pathname: string): boolean {
  return publicRoutes.some(route => pathname === route);
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /_next/static (static files)
     * 2. /_next/image (image optimization files)
     * 3. /favicon.ico (favicon file)
     * 4. /public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 