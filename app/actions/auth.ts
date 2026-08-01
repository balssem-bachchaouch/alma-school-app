"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function loginAction(
  email: string,
  password: string
): Promise<string | null> {
  try {
    await signIn("credentials", { email, password, redirect: false });
    return null;
  } catch (error) {
    if (error instanceof AuthError) {
      return "Email ou mot de passe incorrect";
    }
    throw error;
  }
}
