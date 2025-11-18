import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { AuthDebug } from "@/components/auth-debug";

export const Route = createFileRoute("/")({
  component: HomePage,
});



function HomePage() {
  const { data: sessionData, isPending, error } = authClient.useSession();

  const session = sessionData?.session ?? null;


  return (
    <div className="bg-black px-4 py-6 min-h-screen text-white">
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn("flex flex-col gap-4")}
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dummy App</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Minimal template wired up with Better Auth + Convex.
          </p>
        </div>

        <AuthDebug
          sessionData={sessionData}
          isPending={isPending}
          error={error}
        />
        {!session && (
          <Link
            to="/login"
            className="text-sm font-medium text-sky-400 transition hover:text-sky-300"
          >
            Go to login
          </Link>
        )}
        {session && (
          <Button onClick={() => authClient.signOut()}>Sign out</Button>
        )}
      </motion.div>
    </div>
  );
}
