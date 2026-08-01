import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"
import { dbRateLimit, resetRateLimit, MINUTE_MS } from "./db-rate-limit"

const LOGIN_LIMIT = 10
const LOGIN_WINDOW_MS = 15 * MINUTE_MS

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = credentials.email as string
        const password = credentials.password as string
        const key = `login:${email.toLowerCase()}`

        const { allowed } = await dbRateLimit(key, LOGIN_LIMIT, LOGIN_WINDOW_MS)
        if (!allowed) return null

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user || !user.passwordHash) {
          return null
        }

        const isValid = await bcrypt.compare(password, user.passwordHash)
        if (!isValid) {
          return null
        }

        await resetRateLimit(key)

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.avatarUrl,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
        token.isAdmin =
          !!process.env.ADMIN_EMAIL &&
          process.env.ADMIN_EMAIL.toLowerCase() === (user.email ?? "").toLowerCase()
      }
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { name: true, tokenVersion: true, email: true },
        })
        if (dbUser) {
          token.name = dbUser.name ?? token.name
          token.isAdmin =
            !!process.env.ADMIN_EMAIL &&
            process.env.ADMIN_EMAIL.toLowerCase() === (dbUser.email ?? "").toLowerCase()
          const dbVersion = dbUser.tokenVersion ?? 0
          if (token.tokenVersion === undefined) {
            token.tokenVersion = dbVersion
          } else if (dbVersion !== token.tokenVersion) {
            delete token.id
            delete token.role
            token.invalidated = true
          }
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token.invalidated) {
        return { user: null, expires: session.expires } as unknown as typeof session
      }
      if (session.user) {
        session.user.id = (token.id as string) ?? ""
        session.user.role = (token.role as string) ?? "student"
        session.user.isAdmin = token.isAdmin === true
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
  },
})
