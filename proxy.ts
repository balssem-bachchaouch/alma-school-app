import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

// auth is a next-auth middleware; proxy is the Next.js 16 equivalent of middleware
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const proxy = auth as any;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
