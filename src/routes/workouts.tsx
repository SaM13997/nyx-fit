import { createFileRoute } from "@tanstack/react-router";
import { Dumbbell } from "lucide-react";
import type { WorkoutListItem } from "@/lib/types";
import { useWorkouts } from "@/lib/api/hooks";
import { WorkoutCard } from "@/components/WorkoutCard";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/workouts")({
  component: WorkoutsPage,
});

// !TODO: Redo the background of the padded area section with gemini 3 instead

// html,
// html:before{
//   --s: 56px; /* control the size */
//   --g: 10px; /* control the gap */
//   --c: #ECD078; /* first color */

//   --_l: #0000 calc(33% - .866*var(--g)),var(--c) calc(33.2% - .866*var(--g)) 33%,#0000 34%;
//   background:
//     repeating-linear-gradient(var(--c) 0 var(--g), #0000 0 50%)
//      0 calc(.866*var(--s) - var(--g)/2),
//     conic-gradient(from -150deg at var(--g) 50%,var(--c) 120deg,#0000 0),
//     linear-gradient(-120deg,var(--_l)),linear-gradient( -60deg,var(--_l))
//     #0B486B; /* second color */
//   background-size: var(--s) calc(3.466*var(--s));
//   animation: p infinite 2s linear;
// }
// html:before {
//   content: "";
//   position: fixed;
//   inset: 0;
//   -webkit-mask: 
//     linear-gradient(#000 50%,#0000 0) 
//     0 calc(.866*var(--s))/100% calc(3.466*var(--s));
//   animation-direction: reverse;
// }
// @keyframes p {
//   to {
//     background-position-x: calc(-1*var(--s));
//   }
// }

// use this animated background code to create the background for the  Visual Design Element - Top 35%.

// Change teh colors to match workout theme color and our design aesthetic:

// Add it behind a backdrop blur and fade from black to transparent from tl to br

function WorkoutsPage() {
  const {
    workouts,
    isLoading,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useWorkouts();
  // Cards stagger in only if this visit had to wait for them.
  const [animateList] = useState(isLoading && workouts.length === 0);

  return (
    <div className="overflow-x-clip bg-background text-foreground font-sans relative min-h-dvh">
      {/* Visual Design Element - Top 35% */}
      <div className="relative h-[35vh] pointer-events-none overflow-hidden">
        {/* Animated hexagonal pattern background */}
        <div className="absolute inset-0 animated-hex-bg opacity-50" />

        {/* Backdrop blur layer */}
        <div className="absolute inset-0 backdrop-blur-sm" />

        {/* Gradient fade from black (top-left) to transparent (bottom-right) */}
        <div className="absolute inset-0 bg-gradient-to-tr from-background via-background/60 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background h-10 to-transparent" />

        {/* Content */}
        <div className="relative flex flex-col justify-end  h-full px-4 pt-12">
          <div className=" max-w-md">
            <h1 className="text-6xl font-bold tracking-tighter ">
              Workouts
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative px-4 pb-32">
        <div className="mx-auto max-w-md space-y-6">
          <div className="px-1">
            <p className="text-sm text-muted-foreground">
              Your training history and progress.
            </p>
          </div>

          {isError && workouts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-red-600/40 dark:border-red-500/20 bg-red-500/10 dark:bg-red-500/5 p-8 text-center">
              <p className="text-sm text-red-700 dark:text-red-200">
                Couldn&apos;t load your workouts. Check your connection and try
                again.
              </p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="min-h-11 rounded-xl bg-brand px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
              >
                Try again
              </button>
            </div>
          ) : (
            <>
              {isError ? (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-600/40 dark:border-red-500/20 bg-red-500/10 px-4 py-2">
                  <p className="text-sm text-red-700 dark:text-red-200">
                    Connection issue. Showing saved workouts.
                  </p>
                  <button
                    type="button"
                    onClick={() => void refetch()}
                    className="min-h-11 shrink-0 rounded-xl border border-red-600/40 dark:border-red-500/30 px-4 text-sm font-semibold text-red-700 dark:text-red-100 transition-colors hover:bg-red-500/10"
                  >
                    Try again
                  </button>
                </div>
              ) : null}
              {isLoading && workouts.length === 0 ? (
                <div role="status" aria-label="Loading workouts" className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-[76px] animate-pulse rounded-xl bg-fill" />
                  ))}
                </div>
              ) : (
                <>
                  <WorkoutList workouts={workouts} hasMore={hasNextPage} animateIn={animateList} />
                  <LoadMore
                    hasNextPage={hasNextPage}
                    isFetching={isFetchingNextPage}
                    onLoadMore={() => void fetchNextPage()}
                  />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}


// Loads the next page as the button nears the viewport; the button itself
// stays as the keyboard and no-IntersectionObserver fallback.
function LoadMore({
  hasNextPage,
  isFetching,
  onLoadMore,
}: {
  hasNextPage: boolean;
  isFetching: boolean;
  onLoadMore: () => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const loadMoreRef = useRef(onLoadMore);
  loadMoreRef.current = onLoadMore;

  useEffect(() => {
    const button = buttonRef.current;
    if (!hasNextPage || isFetching || !button || typeof IntersectionObserver === "undefined") {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMoreRef.current();
      },
      { rootMargin: "400px" },
    );
    observer.observe(button);
    return () => observer.disconnect();
  }, [hasNextPage, isFetching]);

  if (!hasNextPage) return null;
  return (
    <button
      ref={buttonRef}
      type="button"
      disabled={isFetching}
      onClick={onLoadMore}
      className="mt-4 min-h-11 w-full rounded-xl border border-border text-sm font-semibold text-ink-secondary transition-colors hover:bg-fill disabled:opacity-60"
    >
      {isFetching ? "Loading…" : "Load more"}
    </button>
  );
}

function WorkoutList({
  workouts,
  hasMore,
  animateIn,
}: {
  workouts: WorkoutListItem[];
  hasMore: boolean;
  animateIn: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="text-xl font-bold">Recent History</h2>
        <span className="bg-brand-tint text-brand-ink px-2.5 py-0.5 rounded-full text-xs font-bold border border-purple-600/40 dark:border-purple-500/20">
          {workouts.length}
          {hasMore ? "+" : ""}
        </span>
      </div>
      {workouts.length === 0 ? (
        <div className="border border-dashed border-purple-600/40 dark:border-purple-500/20 rounded-3xl p-12 text-center bg-purple-500/10 dark:bg-purple-500/5">
          <div className="w-16 h-16 bg-brand-tint rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-600/40 dark:border-purple-500/20">
            <Dumbbell className="h-8 w-8 text-purple-700 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">No workouts yet</h3>
          <p className="text-muted-foreground text-sm max-w-[200px] mx-auto">
            Start your first workout to begin tracking your progress
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {workouts.map((workout, index) => (
            <WorkoutCard key={workout.id} workout={workout} index={index} animateIn={animateIn} />
          ))}
        </div>
      )}
    </div>
  );
}

