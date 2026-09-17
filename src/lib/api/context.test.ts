import { describe, expect, it } from "vitest";
import { assertWritableRequest, isWritableRequest } from "./context.server";

const ENV = { BETTER_AUTH_URL: "https://fit.webdevsam.pro" };
const ENDPOINT = "https://fit.webdevsam.pro/_serverFn/startWorkout";

const writeRequest = (method: string, origin?: string): Request =>
  new Request(ENDPOINT, {
    method,
    headers: origin === undefined ? {} : { origin },
  });

const expectForbidden = (run: () => void) => {
  let caught: unknown = null;
  try {
    run();
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(Response);
  if (caught instanceof Response) {
    expect(caught.status).toBe(403);
  }
};

describe("writable request guard", () => {
  it("accepts a same-origin POST", () => {
    const request = writeRequest("POST", "https://fit.webdevsam.pro");
    expect(isWritableRequest(ENV, request)).toBe(true);
    expect(() => assertWritableRequest(ENV, request)).not.toThrow();
  });

  it("accepts normalized origin spellings", () => {
    expect(
      isWritableRequest(ENV, writeRequest("POST", "https://FIT.webdevsam.pro")),
    ).toBe(true);
    expect(
      isWritableRequest(ENV, writeRequest("POST", "https://fit.webdevsam.pro/")),
    ).toBe(true);
    expect(isWritableRequest(ENV, writeRequest("post", "https://fit.webdevsam.pro"))).toBe(true);
  });

  it("rejects GET invocations of write functions", () => {
    expect(isWritableRequest(ENV, writeRequest("GET", "https://fit.webdevsam.pro"))).toBe(false);
    expectForbidden(() => assertWritableRequest(ENV, writeRequest("GET", "https://fit.webdevsam.pro")));
    expect(isWritableRequest(ENV, writeRequest("HEAD", "https://fit.webdevsam.pro"))).toBe(false);
  });

  it("rejects cross-origin writes", () => {
    expect(isWritableRequest(ENV, writeRequest("POST", "https://evil.example"))).toBe(false);
    expect(isWritableRequest(ENV, writeRequest("POST", "http://fit.webdevsam.pro"))).toBe(false);
    expect(isWritableRequest(ENV, writeRequest("POST", "https://fit.webdevsam.pro:8443"))).toBe(false);
    expectForbidden(() =>
      assertWritableRequest(ENV, writeRequest("POST", "https://evil.example")),
    );
  });

  it("rejects missing, opaque, and malformed origins", () => {
    expect(isWritableRequest(ENV, writeRequest("POST"))).toBe(false);
    expect(isWritableRequest(ENV, writeRequest("POST", "null"))).toBe(false);
    expect(isWritableRequest(ENV, writeRequest("POST", "not-an-origin"))).toBe(false);
    expect(isWritableRequest(ENV, writeRequest("POST", ""))).toBe(false);
  });

  it("rejects writes when the canonical origin is unusable", () => {
    expect(isWritableRequest({ BETTER_AUTH_URL: "" }, writeRequest("POST", "https://fit.webdevsam.pro"))).toBe(
      false,
    );
    expect(
      isWritableRequest(
        { BETTER_AUTH_URL: "fit.webdevsam.pro" },
        writeRequest("POST", "https://fit.webdevsam.pro"),
      ),
    ).toBe(false);
  });
});
