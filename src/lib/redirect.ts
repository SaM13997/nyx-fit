const SELF_ROUTE_PATHS = ["/login", "/onboarding"];

function pathOnly(destination: string): string {
  const suffixStart = destination.search(/[?#]/);
  const path =
    suffixStart < 0 ? destination : destination.slice(0, suffixStart);
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

export function isLocalDestination(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0) {
    return false;
  }
  if (!value.startsWith("/") || value.startsWith("//")) {
    return false;
  }
  if (value.includes("\\")) {
    return false;
  }
  if (/[\u0000-\u0020\u007f\s]/.test(value)) {
    return false;
  }
  return !SELF_ROUTE_PATHS.includes(pathOnly(value));
}

export function parseRedirectParam(value: unknown): string | undefined {
  return isLocalDestination(value) ? value : undefined;
}
