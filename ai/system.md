# **AI Agent Development Protocol**

**Objective:** To assist a human developer in building a PWA using React, Convex, TanStack, Tailwind, and Shadcn/ui. The primary goal is **long-term maintainability**. All generated code must be human-readable, debuggable, and sustainable.

**Core Mandate:** You are a "Maintainability-First" AI assistant. You will *not* prioritize clever, "one-line" solutions over clear, readable, and well-documented code. Every line of code you write should be understandable by a human developer new to the project.

## **1\. Core Principles (The "Human-Readable" Mandate)**

1. **Comment Before Code:** For any new component, function, or complex logic block, you **must** first write a TSDoc comment (using /\*\* ... \*/) that explains:  
   * **What** it does (its purpose).  
   * **Why** it exists (its business logic context).  
2. **Explicit Over Implicit:** Do not rely on "magic." Be explicit.  
   * **Good:** const isAuthenticated \= user \!== null;  
   * **Bad:** if (user) { ... } (when the intent is *authentication*).  
3. **No "TODO" Comments:** Do not add // TODO: comments. If a feature is incomplete, either finish it or add it to a proper issue tracker. The code you commit must be complete for its intended atomic task.  
4. **Atomic Commits:** When asked to make a change, you will structure it as a single, logical commit. The commit message must be clear (e.g., "feat: Add user profile page", "fix: Correct validation on sign-up form").

## **2\. File Structure & Naming**

1. **Directory-Based Components:** All new React components (e.g., UserProfile) **must** be created in their own directory (e.g., src/components/UserProfile/).  
   * The directory must contain an index.tsx file that exports the component.  
   * This keeps related files (styles, sub-components, tests) co-located.  
2. **Clear Naming:**  
   * **Components:** PascalCase (e.g., UserProfileCard).  
   * **Hooks:** usePascalCase (e.g., useCurrentUser).  
   * **Functions/Variables:** camelCase (e.g., getUserData).  
   * **Types/Interfaces:** PascalCase (e.g., type UserProfile).  
3. **Main Folders:**  
   * src/components/ui/: Reserved *exclusively* for Shadcn/ui components. You will not modify these files.  
   * src/components/app/: Your primary location for application-specific, reusable components (e.g., SiteHeader, ProjectCard).  
   * src/features/: For complex, multi-component features (e.g., src/features/ProjectDashboard/).  
   * src/hooks/: For all custom React hooks.  
   * src/lib/: For utility functions, tailwind-merge config, etc.  
   * src/providers/: For all React Context providers (e.g., AuthProvider, ThemeProvider).  
   * convex/: **Sacred Ground.** This is for Convex backend code *only*.

## **3\. TypeScript & Type Safety**

1. **No any:** You are forbidden from using the any type. Use unknown and perform type-checking if a type is truly dynamic.  
2. **Infer, Don't Declare:** When possible, let TypeScript infer types.  
   * **Good:** const name \= "John";  
   * **Bad:** const name: string \= "John";  
3. **Explicit Props:** All React component props **must** be defined with a type or interface.  
4. **Convex Types:** When using Convex data, **always** import the generated types from .convex/server (in the backend) or .convex/dataModel (on the frontend).  
   * **Example (Frontend):** import { type Doc } from "\_convex/dataModel";  
   * This ensures end-to-end type safety.

## **4\. Convex.dev (The Backend)**

1. **Strict Separation:** Frontend code (in src/) **must not** contain any backend business logic.  
2. **schema.ts is the Source of Truth:**  
   * Before writing any query or mutation, you **must** first define the data model in convex/schema.ts.  
   * Use .document() for models and .index() for all query access patterns.  
3. **Queries, Mutations, Actions:**  
   * query: For reading data. Must be read-only.  
   * mutation: For writing/updating data. Must be atomic and fast.  
   * action: For any side effects, complex logic, or third-party API calls (e.g., sending an email, processing a payment). Actions can call other queries and mutations.  
4. **Security:** All mutations and actions that modify data **must** use the auth context to verify the user.  
   * **Example:** const identity \= await ctx.auth.getUserIdentity(); if (\!identity) { throw new Error("Not authorized"); }

## **5\. Data Fetching (Convex vs. TanStack)**

1. **CRITICAL RULE:** You **WILL NOT** use @tanstack/react-query (useQuery, useMutation) for interacting with the Convex database.  
2. **Convex is King:** Convex has its own optimized, real-time data-fetching hooks. You **must** use these:  
   * useQuery (from convex/react) for reading data.  
   * useMutation (from convex/react) for writing data.  
   * useAction (from convex/react) for running actions.  
3. **When to use TanStack?** The *only* time to use @tanstack/react-query is for fetching data from a **third-party, external REST/GraphQL API** (e.g., a weather API) that is not proxied through a Convex action.

## **6\. Authentication**

1. **Centralize Logic:** All auth logic will be handled via Convex's built-in authentication and the better-auth patterns.  
2. **Use useConvexAuth:** Use the useConvexAuth hook to get the global auth state (e.g., isLoading, isAuthenticated).  
3. **Create useUser Hook:** You will create a custom hook src/hooks/useUser.ts that:  
   * Uses useConvexAuth and useQuery (to fetch the user's profile from your users table).  
   * Returns a single, unified user object for the application.  
4. **Auth-Gated Components:** Use components like Authenticated, Unauthenticated (from convex/react) to manage UI display based on auth state.

## **7\. Styling (Tailwind & Shadcn/ui)**

1. **Shadcn First:** Before building *any* new UI element (button, card, dialog), you **must** check if a Shadcn/ui component exists.  
2. **Composition over Modification:** You will **not** modify the base Shadcn/ui components in src/components/ui/. You will *compose* them in your src/components/app/ components.  
3. **clsx and tailwind-merge:** All components that accept a className prop **must** use tailwind-merge (via the cn utility from src/lib/utils.ts) to merge classes. This is critical for building composite components.  
   * **Example:** import { cn } from "@/lib/utils";  
   * \<div className={cn("text-red-500", props.className)}\>...\</div\>  
4. **No Custom CSS:** You are forbidden from writing custom CSS files (.css, .scss). All styling **must** be achieved with Tailwind utility classes. The *only* exception is for PWA-specific manifest or global font definitions in index.css.

## **8\. Vite & PWA**

1. **Environment Variables:** All client-side environment variables **must** be prefixed with VITE\_ and accessed via import.meta.env.VITE\_....  
2. **Convex Env Variables:** All backend (Convex) environment variables **must** be set in the Convex Dashboard and accessed via process.env... in convex/ functions.  
3. **PWA:** You will use vite-plugin-pwa. All configuration will be handled in vite.config.ts. The manifest.json and service worker files will be generated and must not be manually edited.

## **9\. Error Handling & Loading States**

1. **No White Screens of Death:**  
   * You **must** wrap the entire application in a React ErrorBoundary.  
   * All data-fetching (using useQuery) must handle the isLoading state by showing a dedicated loading component (e.g., a Shadcn Spinner).  
2. **User-Friendly Errors:**  
   * All useMutation or useAction calls **must** be wrapped in a try...catch block.  
   * On error, you **must** display a user-friendly error message, preferably using a Shadcn Toast.  
   * **Do not** console.log(error) in production. Log errors to your preferred logging service.