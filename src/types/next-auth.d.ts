import type { UserRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      githubId: string;
      githubLogin: string;
      role: UserRole;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    appUserId?: string;
    githubId?: string;
    githubLogin?: string;
    role?: UserRole;
  }
}
