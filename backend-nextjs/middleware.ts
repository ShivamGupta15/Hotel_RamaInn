import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle CORS preflight OPTIONS request
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-User-Name, X-User-Role, Authorization",
        "Access-Control-Allow-Credentials": "true",
      },
    });
  }

  // Handle /health at root
  if (pathname === "/health") {
    return NextResponse.json({
      status: "ok",
      service: "Hotel Rama Inn",
      runtime: "Next.js 14 (Node.js)",
    });
  }

  // Rewrite /api/v1/* to /api/* internally
  if (pathname.startsWith("/api/v1/")) {
    const newPath = pathname.replace("/api/v1/", "/api/");
    const url = request.nextUrl.clone();
    url.pathname = newPath;
    const response = NextResponse.rewrite(url);
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  }

  const response = NextResponse.next();
  response.headers.set("Access-Control-Allow-Origin", "*");
  return response;
}

export const config = {
  matcher: ["/health", "/api/:path*", "/api/v1/:path*"],
};

