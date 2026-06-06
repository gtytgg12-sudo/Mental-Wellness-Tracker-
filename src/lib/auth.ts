import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { prisma } from './prisma';
import { loginSchema } from './validation';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      examType?: string | null;
    } & DefaultSession['user'];
  }
  interface User {
    examType?: string | null;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 7 },
  trustHost: true,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          examType: user.examType,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.examType = (user as { examType?: string | null }).examType ?? null;
      }
      if (trigger === 'update' && session?.examType) {
        token.examType = session.examType as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.examType = (token.examType as string | null) ?? null;
      }
      return session;
    },
  },
});

/** Helper for hashing passwords consistently. */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Demo / anonymous mode.
 * For the hackathon we want zero-friction access, so every visitor
 * shares a single "demo" user. The first request that needs a user
 * upserts this account; subsequent calls reuse it.
 */
const DEMO_EMAIL = 'demo@mindfulprep.app';

export async function getDemoUserId(): Promise<string> {
  const existing = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    select: { id: true },
  });
  if (existing) return existing.id;
  const created = await prisma.user.create({
    data: {
      email: DEMO_EMAIL,
      name: 'Demo Student',
      examType: 'JEE',
      onboardedAt: new Date(),
    },
    select: { id: true },
  });
  return created.id;
}

/** Re-export for convenience. */
export { z };
