import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Brute-force throttle: after MAX failed attempts for an email within WINDOW,
// further attempts are rejected until the oldest failures age out of the window.
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

function ipFromRequest(request: Request | undefined): string | null {
  const fwd = request?.headers?.get("x-forwarded-for");
  return fwd ? fwd.split(",")[0].trim() : null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (rawCredentials, request) => {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase();
        const since = new Date(Date.now() - LOGIN_WINDOW_MS);

        // Prune expired rows so the table stays small, then check the window.
        await prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: since } } });
        const recentFailures = await prisma.loginAttempt.count({
          where: { email, createdAt: { gte: since } },
        });
        if (recentFailures >= LOGIN_MAX_ATTEMPTS) {
          // Locked out for the remainder of the window.
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        const valid = user
          ? await bcrypt.compare(parsed.data.password, user.passwordHash)
          : false;

        if (!user || !valid) {
          await prisma.loginAttempt.create({
            data: { email, ip: ipFromRequest(request) },
          });
          return null;
        }

        // Success: clear this account's recent failures.
        await prisma.loginAttempt.deleteMany({ where: { email } });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tokenVersion: user.tokenVersion,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Sign-in: stamp the identity and the current token version.
        token.id = user.id as string;
        token.role = (user as { role?: string }).role;
        token.tokenVersion = (user as { tokenVersion?: number }).tokenVersion ?? 0;
        return token;
      }
      // Subsequent requests: revalidate against the DB so a bumped
      // tokenVersion (sign-out-everywhere) invalidates this session.
      if (token.id) {
        const current = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { tokenVersion: true },
        });
        if (!current || current.tokenVersion !== token.tokenVersion) {
          return null;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});
