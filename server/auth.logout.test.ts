import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(): TrpcContext {
  return {
    user: {
      id: "00000000-0000-0000-0000-000000000000",
      email: "sample@example.com",
      name: "Sample User",
      role: "user",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastSignedIn: new Date().toISOString(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("auth.logout", () => {
  it("reports success after the client clears its Supabase session", async () => {
    const caller = appRouter.createCaller(createContext());

    await expect(caller.auth.logout()).resolves.toEqual({ success: true });
  });
});
