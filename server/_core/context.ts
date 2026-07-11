import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "@shared/types";
import { upsertUser } from "../db";
import { getBearerToken, supabaseAdmin } from "./supabase";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  const token = getBearerToken(opts.req.headers.authorization);

  if (token) {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (!error && data.user) {
      user = await upsertUser({
        id: data.user.id,
        email: data.user.email ?? null,
        name:
          typeof data.user.user_metadata?.name === "string"
            ? data.user.user_metadata.name
            : data.user.email?.split("@")[0] ?? null,
      });
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
