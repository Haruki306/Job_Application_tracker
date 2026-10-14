import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { betterAuth } from "better-auth";
import { client, databaseName } from "@/lib/mongodb";

const secret = process.env.BETTER_AUTH_SECRET;
if (!secret) {
  throw new Error("Set BETTER_AUTH_SECRET in .env.local before starting the application.");
}

const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

export const auth = betterAuth({
  appName: "Daymark",
  baseURL,
  secret,
  trustedOrigins: [baseURL],
  database: mongodbAdapter(client.db(databaseName), { client }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
  },
});
