This here is the description of my app. It will be broken down into its base components, base steps and design/code philosophy. Overall feature requests/bug fixes will be broken into Epics and features.

As you go through this doc, create a separate ...-plan.md file for each epic so that separate agents can handle it without filling up the context window.

# System:

You're working in a project that is working with

- React(19.2.0)[https://react.dev/reference/react]
- Tanstack Start meta framework(@tanstack/start)[https://tanstack.com/start/latest/docs/framework/react/guide/routing]
- tailwindcss: "^4.1.16"[https://tailwindcss.com/docs]
- shadcn(install components via the following command: bunx --bun shadcn@latest add <component-name>)[https://ui.shadcn.com/docs/components]
- Convex.dev(convex @convex-dev/react-query @tanstack/react-router-with-query @tanstack/react-query)[https://docs.convex.dev/quickstart/tanstack-start]
- Better-auth for auth["@convex-dev/better-auth": "^0.9.6" , "better-auth": "1.3.27" ]
- bun; instead of node/npm/npx so use that for every command.

For all the prompts in this project operate with that knowledge and use context7 mcp to fetch docs wherever needed.

# Code Guidelines

- reference /ai/system.md