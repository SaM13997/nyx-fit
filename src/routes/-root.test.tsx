import { afterEach, describe, expect, it, vi } from "vitest";
import { Route } from "./__root";

const mocks = vi.hoisted(() => ({ fetchAuth: vi.fn() }));

vi.mock("@/lib/api/auth.functions", () => ({
  fetchAuth: mocks.fetchAuth,
}));

function runBeforeLoad(): Promise<{ userId: string | null }> {
  const loader = Route.options.beforeLoad;
  if (!loader) {
    throw new Error("Root beforeLoad is unavailable");
  }
  return loader(
    {} as NonNullable<Parameters<typeof loader>[0]>,
  ) as Promise<{ userId: string | null }>;
}

afterEach(() => {
  mocks.fetchAuth.mockReset();
});

describe("root auth loader", () => {
  it("resolves to a signed-out context when auth cannot be reached offline", async () => {
    mocks.fetchAuth.mockRejectedValue(new Error("Network unreachable"));

    await expect(runBeforeLoad()).resolves.toEqual({ userId: null });
  });

  it("passes through the signed-in user when auth resolves", async () => {
    mocks.fetchAuth.mockResolvedValue({ userId: "user-1" });

    await expect(runBeforeLoad()).resolves.toEqual({ userId: "user-1" });
  });
});
