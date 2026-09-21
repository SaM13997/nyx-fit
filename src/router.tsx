import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { QueryClient } from "@tanstack/react-query";

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
    },
  });

  const router = routerWithQueryClient(
    createRouter({
      routeTree,
      defaultPreload: "intent",
      scrollRestoration: true,
      defaultViewTransition: true,
      context: { queryClient },
    }),
    queryClient
  );

  return router;
}
