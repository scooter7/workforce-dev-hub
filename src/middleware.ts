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

  const { pathname } = request.nextUrl;

  // --- Admin Route Protection ---
  if (pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login?message=Please log in to access admin features.&redirect=/admin', request.url));
    }
    const { data: { user } } = await supabase.auth.getUser(); // Re-fetch user for admin check
    if (user?.id !== process.env.ADMIN_USER_ID) {
      // Non-admin trying to access /admin/*
      // Redirect to dashboard or show an access denied page if you have one for non-admins.
      // For now, redirecting to dashboard.
      return NextResponse.redirect(new URL('/?message=Admin access required.', request.url)); 
    }
  }
  // --- End Admin Route Protection ---

  // For non-admin protected routes (user dashboard areas)
  // This list should match the paths you want to protect for any logged-in user.
  const protectedUserRoutes = ['/', '/goals', '/quizzes', '/points', '/profile', '/chat']; 
  // Check if the current path starts with any of the protectedUserRoutes
  if (protectedUserRoutes.some(route => pathname.startsWith(route) && (pathname === route || pathname.startsWith(route + '/'))) && !pathname.startsWith('/admin')) {
    if (!session) {
      let redirectUrl = '/login?message=Please log in to access this page.';
      if (pathname !== '/') { // Append redirect only if not trying to access the root
        redirectUrl += `&redirect=${pathname}`;
      }
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

  // Allow access to auth pages if no session
  if (!session && (pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/forgot-password'))) {
    return response;
  }

  // Redirect logged-in users from auth pages to dashboard
  if (session && (pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/forgot-password'))) {
    return NextResponse.redirect(new URL('/', request.url));
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
     * This can be done by excluding common file extensions OR by being more specific.
     * A common pattern is to exclude paths that include a '.' (indicating a file extension)
     * in the last segment, but this can be too broad or too narrow.
     */
    '/((?!api|_next/static|_next/image|auth/callback|error|.*\\..*\\w{2,4}$).*)',
    // The `.*\\..*\\w{2,4}$` part tries to exclude paths ending with a typical file extension.
    // It means: any characters (.*), then a literal dot (\\.), then any characters (.*), 
    // then 2 to 4 word characters (\\w{2,4}) at the end of the string ($).
    // This should exclude .jpg, .png, .ico, .svg, .webmanifest etc.
    // If you want to be more explicit and still protect some root files:
    // '/((?!api|_next/static|_next/image|favicon.ico|site.webmanifest|robots.txt|images/.*|LifeRamp_LifeRamp.jpg|LifeRamp_Assessment.jpg|auth/callback|error).*)',
  ],
};