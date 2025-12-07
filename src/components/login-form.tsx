
import type { FormEvent } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "@tanstack/react-router";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();

  const navigateAfterAuth = () => {
    const search = router.state.location.search as
      | { redirect?: unknown }
      | undefined;
    const redirect =
      typeof search?.redirect === "string" && search.redirect.length > 0
        ? search.redirect
        : undefined;

    if (redirect) {
      router.history.push(redirect);
    } else {
      router.navigate({ to: "/" });
    }
  };

  const handleEmailSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");

    if (typeof email !== "string" || email.length === 0) {
      console.error("Email is required");
      return;
    }

    try {
      await authClient.signIn.email({
        email,
        password: "",
      });
      navigateAfterAuth();
    } catch (error) {
      console.error("Email sign-in failed", error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await authClient.signIn.social({
        provider: "google",
      });
      navigateAfterAuth();
    } catch (error) {
      console.error("Google sign-in failed", error);
      if (error instanceof Error && error.message.includes("403")) {
        console.error(
          "A 403 Forbidden error occurred. This is likely due to a misconfiguration of your environment variables. Please check your .env.local file and your Convex environment variables (npx convex env list) and ensure that SITE_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, BETTER_AUTH_SECRET, and CONVEX_SITE_URL are all set correctly."
        );
      }
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleEmailSignIn}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Welcome Back
            </h1>
            <p className="text-sm text-gray-400">
              Enter your email to sign in or create an account
            </p>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="name@example.com"
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-xl h-12 px-4 focus:ring-green-500 focus:border-green-500 transition-all font-medium"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold h-12 rounded-xl text-base transition-all active:scale-[0.98] shadow-lg shadow-purple-900/20"
            >
              Continue with Email
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-black px-2 text-gray-500 font-medium tracking-wider">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 font-bold h-12 rounded-xl text-base transition-all active:scale-[0.98] gap-3"
          >
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
              <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
            </svg>
            Google
          </Button>
        </div>
      </form>
      <div className="text-center text-xs text-gray-500">
        By clicking continue, you agree to our <a href="#" className="underline hover:text-white transition-colors">Terms</a> and <a href="#" className="underline hover:text-white transition-colors">Privacy Policy</a>.
      </div>
    </div>
  );
}
