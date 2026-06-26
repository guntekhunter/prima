import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Public paths that don't require authentication
const PUBLIC_PATHS = ["/", "/register"];

export async function proxy(req: NextRequest) {
    let response = NextResponse.next({
        request: req,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return req.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        req.cookies.set(name, value);
                        response.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = req.nextUrl;

    const isPublicPath = PUBLIC_PATHS.some(
        (path) => pathname === path || pathname.startsWith(path + "/")
    );

    // Unauthenticated user trying to access a protected route → redirect to / (login)
    if (!user && !isPublicPath) {
        return NextResponse.redirect(new URL("/", req.url));
    }

    // Authenticated user trying to access / (login) → redirect to /dashboard
    if (user && pathname === "/") {
        return NextResponse.redirect(new URL("/report", req.url));
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico and common asset extensions
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
