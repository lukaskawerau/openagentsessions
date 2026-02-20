import type { UserRole } from "@prisma/client";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

import { prisma } from "@/lib/prisma";

type GitHubProfile = {
  id?: number;
  login?: string;
};

function readModeratorIds(): Set<string> {
  const raw = process.env.MODERATOR_GITHUB_IDS;

  if (!raw) {
    return new Set<string>();
  }

  return new Set(
    raw
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0),
  );
}

const moderatorIds = readModeratorIds();

function roleForUser(existingRole: UserRole | null, githubId: string): UserRole {
  if (existingRole === "MODERATOR") {
    return "MODERATOR";
  }

  return moderatorIds.has(githubId) ? "MODERATOR" : "USER";
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ profile, user }) {
      const githubProfile = profile as GitHubProfile;
      const githubId = githubProfile.id ? String(githubProfile.id) : null;
      const githubLogin = githubProfile.login ?? null;

      if (!githubId || !githubLogin) {
        return false;
      }

      const existingUser = await prisma.user.findUnique({
        where: { githubId },
        select: { id: true, role: true },
      });

      const role = roleForUser(existingUser?.role ?? null, githubId);

      await prisma.user.upsert({
        where: { githubId },
        create: {
          githubId,
          githubLogin,
          email: user.email,
          image: user.image,
          name: user.name,
          role,
        },
        update: {
          githubLogin,
          email: user.email,
          image: user.image,
          name: user.name,
          role,
        },
      });

      return true;
    },
    async jwt({ token, profile }) {
      const githubProfile = profile as GitHubProfile | undefined;

      if (githubProfile?.id) {
        token.githubId = String(githubProfile.id);
      }

      if (githubProfile?.login) {
        token.githubLogin = githubProfile.login;
      }

      if (!token.githubId) {
        return token;
      }

      const dbUser = await prisma.user.findUnique({
        where: { githubId: token.githubId },
        select: {
          id: true,
          role: true,
          githubLogin: true,
        },
      });

      if (!dbUser) {
        return token;
      }

      token.appUserId = dbUser.id;
      token.role = dbUser.role;
      token.githubLogin = dbUser.githubLogin;

      return token;
    },
    async session({ session, token }) {
      if (!session.user || !token.appUserId || !token.githubId || !token.role) {
        return session;
      }

      session.user.id = token.appUserId;
      session.user.githubId = token.githubId;
      session.user.githubLogin = token.githubLogin ?? "";
      session.user.role = token.role;

      return session;
    },
  },
};

export async function getAuthSession() {
  return getServerSession(authOptions);
}
