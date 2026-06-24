/** Allow only same-origin relative paths for post-login redirects. */
export function getSafeRedirectPath(
  redirect: string | undefined
): string | undefined {
  if (!redirect) {
    return undefined;
  }

  if (!redirect.startsWith("/") || redirect.startsWith("//")) {
    return undefined;
  }

  return redirect;
}
