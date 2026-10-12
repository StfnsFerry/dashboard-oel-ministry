import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isSigninPage = pathname === "/signin";
  const isDashboard = pathname === "/";

  // Belum login → dashboard → signin
  if (!user && isDashboard) {
    return NextResponse.redirect(
      new URL("/signin", request.url)
    );
  }

  // Sudah login → signin → dashboard
  if (user && isSigninPage) {
    return NextResponse.redirect(
      new URL("/", request.url)
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api/|_next/|_vercel/|.*\\..*).*)",
  ],
};