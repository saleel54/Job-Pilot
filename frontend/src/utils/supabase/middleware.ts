import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
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
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Refresh user session safely
  const { data: { user } } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const isAuthPage = url.pathname.startsWith('/auth');
  const isLandingPage = url.pathname === '/';
  const isApiRoute = url.pathname.startsWith('/api');
  const isStaticFile = url.pathname.includes('.') || url.pathname.startsWith('/_next');

  // Skip middleware logic for static assets and API routes
  if (isStaticFile || isApiRoute) {
    return response;
  }

  // Protect all routes except / and /auth
  if (!user && !isAuthPage && !isLandingPage) {
    url.pathname = '/auth';
    return NextResponse.redirect(url);
  }

  // Redirect to dashboard if logged in and trying to access landing page or auth page
  if (user && (isAuthPage || isLandingPage)) {
    // Note: Onboarding check is done page-level or layout-level to avoid DB call in middleware
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return response;
}
