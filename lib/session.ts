import { auth } from "@/lib/auth";

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

/** The current session user, or null if not signed in. Safe for conditional UI. */
export async function currentUser(): Promise<SessionUser | null> {
  const session = await auth();
  return (session?.user as SessionUser) ?? null;
}

/** Returns the current session user, throwing if not signed in. */
export async function requireUser(): Promise<SessionUser> {
  const user = await currentUser();
  if (!user?.id) {
    throw new Error("Not authenticated");
  }
  return user;
}

/** Like requireUser, but also enforces one of the given roles. */
export async function requireRole(...roles: string[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!user.role || !roles.includes(user.role)) {
    throw new Error("Not authorised");
  }
  return user;
}

export function isAdmin(user: SessionUser | null | undefined): boolean {
  return user?.role === "ADMIN";
}
