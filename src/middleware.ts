import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const isAuthRoute = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register");
  const isTrainerRoute = nextUrl.pathname.startsWith("/trainer");
  const isClientRoute = nextUrl.pathname.startsWith("/client");
  const isApiRoute = nextUrl.pathname.startsWith("/api");

  if (isApiRoute) return NextResponse.next();

  if (isAuthRoute && isLoggedIn) {
    const dest = role === "TRAINER" ? "/trainer" : "/client";
    return NextResponse.redirect(new URL(dest, nextUrl));
  }

  if ((isTrainerRoute || isClientRoute) && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isTrainerRoute && role !== "TRAINER") {
    return NextResponse.redirect(new URL("/client", nextUrl));
  }
  if (isClientRoute && role !== "CLIENT") {
    return NextResponse.redirect(new URL("/trainer", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|uploads).*)",
  ],
};
