import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // Public routes that don't require authentication
  const publicPaths = ['/auth/signin', '/auth/signup', '/auth/error', '/api/auth'];
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path));

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Redirect to signin if not authenticated
  if (!token) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(signInUrl);
  }

  // Platform Admin route guard - only platform_admin role can access
  if (request.nextUrl.pathname.startsWith('/platform-admin')) {
    if (token.role !== 'platform_admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // Admin route guard - admin, manager, and platform_admin can access
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!['admin', 'manager', 'platform_admin'].includes(token.role as string)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // Add tenant context to headers for API routes
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-id', token.tenantId as string);
  requestHeaders.set('x-user-id', token.id as string);
  requestHeaders.set('x-user-role', token.role as string);
  if (token.branchId) {
    requestHeaders.set('x-branch-id', token.branchId as string);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
