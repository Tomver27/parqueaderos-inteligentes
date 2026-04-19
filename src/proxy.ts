import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

// Role IDs matching the Roles table
const ROLE_ADMIN = 1;
const ROLE_OPERADOR = 2;
const ROLE_CONDUCTOR = 3;

// Maps route prefix → allowed role ID
const ROLE_ROUTES: Record<string, number> = {
  "/admin": ROLE_ADMIN,
  "/operador": ROLE_OPERADOR,
  "/conductor": ROLE_CONDUCTOR,
};

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresca la sesión — obligatorio llamarlo en el middleware
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/parqueaderos") ||
    pathname.startsWith("/reservar") ||
    pathname.startsWith("/api/sensors") ||
    pathname.startsWith("/api/plates");

  // Public routes — allow without session
  if (isPublicRoute || isAuthRoute) {
    if (user && isAuthRoute) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return response;
  }

  // Protected routes — redirect to login if no session
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Role-based route protection
  const roleEntry = Object.entries(ROLE_ROUTES).find(([prefix]) =>
    pathname.startsWith(prefix)
  );

  if (roleEntry) {
    const [, requiredRole] = roleEntry;

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: userData } = await adminClient
      .from("Users")
      .select("id_role")
      .eq("email", user.email!)
      .single();

    if (!userData || userData.id_role !== requiredRole) {
      // Redirect to home if the user doesn't have the required role
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
