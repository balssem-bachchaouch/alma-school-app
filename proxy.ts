import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const proxy = auth as any;

export const config = {
  // Exclude auth pages from proxy so they render without a NEXTAUTH_SECRET check
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|register).*)"],
};
