import type { NextAuthConfig } from "next-auth";

// Edge-compatible auth config used by middleware (no Node.js-only imports)
export const authConfig: NextAuthConfig = {
  providers: [],
  callbacks: {
    authorized({ auth }) {
      return true; // routing logic handled in middleware
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as import("@prisma/client").Role;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};
