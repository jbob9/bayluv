import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP, magicLink } from "better-auth/plugins";
import { db, schema } from "~/db/index.server";
import { sendEmail } from "./email.server";
import { env } from "./env.server";

/** Social providers register only when both id + secret are present. */
const socialProviders: BetterAuthOptions["socialProviders"] = {};
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  };
}
if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
  socialProviders.github = {
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
  };
}

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: { type: "string" },
    },
  },
  socialProviders,
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendEmail({
          to: email,
          subject: "Your bayluv sign-in link",
          html: `<p>Click to sign in to bayluv:</p><p><a href="${url}">Sign in</a></p><p>This link expires shortly. If you didn't request it, ignore this email.</p>`,
        });
      },
    }),
    emailOTP({
      sendVerificationOTP: async ({ email, otp }) => {
        await sendEmail({
          to: email,
          subject: "Your bayluv verification code",
          html: `<p>Your bayluv code is:</p><p style="font-size:24px;font-weight:700;letter-spacing:4px">${otp}</p><p>It expires shortly.</p>`,
        });
      },
    }),
  ],
});

export type Auth = typeof auth;
