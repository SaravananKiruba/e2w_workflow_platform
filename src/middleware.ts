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

  // Check if tenant is active (block suspended/inactive tenants)
  if (token.tenantStatus && token.tenantStatus !== 'active') {
    return NextResponse.redirect(new URL('/unauthorized?reason=tenant_inactive', request.url));
  }

  // Platform Admin route guard - ONLY platform_admin role
  if (request.nextUrl.pathname.startsWith('/platform-admin')) {
    if (token.role !== 'platform_admin') {
      return NextResponse.redirect(new URL('/unauthorized?reason=platform_admin_only', request.url));
    }
  }

  // Tenant Admin route guard - ONLY admin role (configuration management)
  if (request.nextUrl.pathname.startsWith('/tenant-admin')) {
    if (token.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized?reason=tenant_admin_only', request.url));
    }
  }

  // Legacy /admin routes - redirect to /tenant-admin for non-platform admins
  if (request.nextUrl.pathname.startsWith('/admin') && token.role !== 'platform_admin') {
    const newPath = request.nextUrl.pathname.replace('/admin', '/tenant-admin');
    return NextResponse.redirect(new URL(newPath + request.nextUrl.search, request.url));
  }

  // Admin route guard (legacy support) - admin, manager, and platform_admin can access
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!['admin', 'manager', 'platform_admin'].includes(token.role as string)) {
      return NextResponse.redirect(new URL('/unauthorized?reason=admin_required', request.url));
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
