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

  const { data: { session } } = await supabase.auth.getSession();
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const authRoutes = ['/login', '/register', '/forgot-password'];
  const dashboardRoutes = ['/goals', '/quizzes', '/points', '/profile', '/chat'];

  // --- Redirect logged-in users from auth pages ---
  if (session && authRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // --- Protect Admin Routes ---
  if (pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login?message=Please log in to access admin features.&redirect=/admin', request.url));
    }
    if (user?.id !== process.env.ADMIN_USER_ID) {
      return NextResponse.redirect(new URL('/?message=Admin access required.', request.url));
    }
  }

  // --- Protect Dashboard Routes for logged-out users ---
  const isDashboardRoute = dashboardRoutes.some(route => pathname.startsWith(route));
  const isRootRoute = pathname === '/';

  if (!session && (isRootRoute || isDashboardRoute)) {
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
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - auth/callback (Supabase auth callback)
     * - error (error page)
     * - And specific files in /public like favicons, site.webmanifest, images etc.
     */
    '/((?!api|_next/static|_next/image|auth/callback|error|.*\\..*\\w{2,4}$).*)',
  ],
};