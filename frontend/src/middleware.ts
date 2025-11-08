import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas públicas que não requerem autenticação
const publicRoutes = ['/login', '/register', '/forgot-password'];

// Rotas de autenticação que redirecionam para dashboard se já autenticado
const authRoutes = ['/login', '/register'];

// Matcher para aplicar middleware apenas em rotas específicas
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.gif).*)',
  ],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verificar se há token de acesso
  const accessToken = request.cookies.get('access_token')?.value;

  // Se estiver em rota de autenticação e já tiver token, redirecionar para dashboard
  if (authRoutes.includes(pathname) && accessToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Se não estiver em rota pública e não tiver token, redirecionar para login
  if (!publicRoutes.includes(pathname) && !accessToken) {
    const loginUrl = new URL('/login', request.url);
    // Adicionar URL de retorno como query parameter
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Continuar com a requisição
  return NextResponse.next();
}
