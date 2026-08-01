import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const proxy = auth as any;

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|icon-192.png|icon-512.png|sw.js|manifest.webmanifest|.*\\.png$|.*\\.js$|login|register).*)",
  ],
};
