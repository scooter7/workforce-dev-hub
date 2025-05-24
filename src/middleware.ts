import { createServerClient, type CookieOptions } from '@supabase/ssr'; // Correct import for @supabase/ssr
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/db'; // Optional: if you need strong types

export async function middleware(request: NextRequest) {
  // Create an initial response that will be modified if cookies are set/removed
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<Database>( // Use createServerClient
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // If a cookie is set, an RSC payload may not have been rendered with it.
          // This ensures the RSC payload is re-rendered with the new cookie.
          // Also update the request cookies for immediate availability.
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ // Re-create response to apply new request cookies
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // If a cookie is removed, an RSC payload may not have been rendered with it.
          // This ensures the RSC payload is re-rendered with the cookie removed.
          // Also update the request cookies for immediate availability.
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ // Re-create response to apply new request cookies
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // It's generally recommended to call supabase.auth.getUser() or getSession()
  // in middleware only if you are doing explicit route protection here.
  // The main purpose of the Supabase client in middleware is to refresh tokens
  // by being instantiated with the request's cookies.
  // For this app, we do have route protection logic, so let's get the user.
  const { data: { user } } = await supabase.auth.getUser();

  // --- Example Route Protection Logic ---
  const isAuthPageRoute = request.nextUrl.pathname.startsWith('/login') ||
                          request.nextUrl.pathname.startsWith('/register') ||
                          request.nextUrl.pathname.startsWith('/auth/callback'); // Auth callback itself

  const isApiAuthRoute = request.nextUrl.pathname.startsWith('/api/auth/');


  if (!user && !isAuthPageRoute && !isApiAuthRoute) {
    // If user is not logged in and not trying to access an auth page or API auth route,
    // redirect to login.
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('message', 'Please log in to access this page.');
    return NextResponse.redirect(redirectUrl);
  }

  if (user && (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register'))) {
    // If user is logged in and tries to access login or register, redirect to home.
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/'; // Your main dashboard page after login
    return NextResponse.redirect(redirectUrl);
  }
  // --- End Example Route Protection ---

  return response;
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Assets in /public are also typically excluded by default by this pattern,
     * but if you have other public static paths, add them to the negative lookahead.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};