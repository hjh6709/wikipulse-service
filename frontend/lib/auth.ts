import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import KeycloakProvider from "next-auth/providers/keycloak";
import { SignJWT } from "jose";

const MOCK_SECRET = new TextEncoder().encode("wikipulse-dev-secret");

async function mockJwt(username: string): Promise<string> {
  return new SignJWT({ sub: username, name: username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(MOCK_SECRET);
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Local Dev",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "dev" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username) return null;
        const token = await mockJwt(credentials.username);
        return { id: credentials.username, name: credentials.username, accessToken: token };
      },
    }),
    ...(process.env.KEYCLOAK_ISSUER
      ? [
          KeycloakProvider({
            clientId: process.env.KEYCLOAK_ID!,
            clientSecret: process.env.KEYCLOAK_SECRET!,
            issuer: process.env.KEYCLOAK_ISSUER,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user && "accessToken" in user && typeof (user as { accessToken: unknown }).accessToken === "string")
        token.accessToken = (user as { accessToken: string }).accessToken;
      if (account?.access_token) token.accessToken = account.access_token;
      return token;
    },
    async session({ session, token }) {
      if (typeof token.accessToken === "string") session.accessToken = token.accessToken;
      return session;
    },
  },
  pages: { signIn: "/login" },
};
