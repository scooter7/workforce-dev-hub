// src/middleware.ts

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // --- Protect Admin Routes ---
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login?message=Please log in to access admin features.', request.url));
    }

    // This check now uses the ADMIN_USER_ID environment variable for authentication.
    const isAdmin = user.id === process.env.ADMIN_USER_ID;

    if (!isAdmin) {
      // If the user is not the designated admin, redirect them.
      return NextResponse.redirect(new URL('/?message=Admin access required.', request.url));
    }
  }

  // --- Redirect logged-in users from auth pages ---
  const authRoutes = ['/login', '/register', '/forgot-password'];
  if (user && authRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // --- Protect Dashboard Routes for logged-out users ---
  const dashboardRoutes = ['/goals', '/quizzes', 'points', '/profile', '/chat'];
  const isDashboardRoute = dashboardRoutes.some(route => pathname.startsWith(route));
  const isRootRoute = pathname === '/';

  if (!user && (isRootRoute || isDashboardRoute)) {
      let redirectUrl = '/login?message=Please log in to access this page.';
      if (pathname !== '/') {
        redirectUrl += `&redirect=${pathname}`;
      }
      return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|auth/callback|error|.*\\..*\\w{2,4}$).*)',
  ],
};