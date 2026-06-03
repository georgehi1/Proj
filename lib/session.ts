import { auth } from "@/lib/auth";

/** Returns the current session user, throwing if not signed in. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  return session.user;
}
