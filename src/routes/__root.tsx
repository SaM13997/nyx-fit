/// <reference types="vite/client" />
import * as React from 'react'
import {
	Outlet,
	createRootRouteWithContext,
	HeadContent,
	Scripts,
	useRouteContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { BottomNav } from '../components/BottomNav'
import { createServerFn } from '@tanstack/react-start'
import { QueryClient } from '@tanstack/react-query'
import { ConvexQueryClient } from '@convex-dev/react-query'
import { ConvexReactClient } from 'convex/react'
import { getCookie, getRequest } from '@tanstack/react-start/server'
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react'
import {
	fetchSession,
	getCookieName,
} from '@convex-dev/better-auth/react-start'
import { authClient } from '@/lib/auth-client'
import { AppearanceProvider } from '@/lib/AppearanceContext'
import { InstallPrompt } from '@/components/InstallPrompt'
import appCss from '../styles.css?url'

// Get auth information for SSR using available cookies
const fetchAuth = createServerFn({ method: 'GET' }).handler(async () => {
	const { createAuth } = await import('../../convex/auth')
	const { session } = await fetchSession(getRequest())
	const sessionCookieName = getCookieName(createAuth)
	const token = getCookie(sessionCookieName)
	return {
		userId: session?.user.id,
		token,
	}
})

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient
	convexClient: ConvexReactClient
	convexQueryClient: ConvexQueryClient
}>()({
	head: () => ({
		meta: [
			{
				charSet: 'utf-8',
			},
			{
				name: 'viewport',
				content: 'width=device-width, initial-scale=1',
			},
			{
				name: 'theme-color',
				content: '#000000',
			},
			{
				name: 'apple-mobile-web-app-title',
				content: 'Nyx Fitness',
			},
		],
		links: [
			{ rel: 'stylesheet', href: appCss },
			{ rel: 'preconnect', href: 'https://fonts.googleapis.com' },
			{
				rel: 'preconnect',
				href: 'https://fonts.gstatic.com',
				crossOrigin: 'anonymous',
			},
			{
				rel: 'stylesheet',
				href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
			},
			{
				rel: 'icon',
				type: 'image/png',
				href: '/favicon/favicon-96x96.png',
				sizes: '96x96',
			},
			{
				rel: 'icon',
				type: 'image/svg+xml',
				href: '/favicon/favicon.svg',
			},
			{
				rel: 'shortcut icon',
				href: '/favicon/favicon.ico',
			},
			{
				rel: 'apple-touch-icon',
				href: '/favicon/apple-touch-icon.png',
				sizes: '180x180',
			},
			{
				rel: 'manifest',
				href: '/favicon/site.webmanifest',
			},
		],
	}),
	beforeLoad: async (ctx) => {
		// all queries, mutations and action made with TanStack Query will be
		// authenticated by an identity token.
		const { userId, token } = await fetchAuth()

		// During SSR only (the only time serverHttpClient exists),
		// set the auth token to make HTTP queries with.
		if (token) {
			ctx.context.convexQueryClient.serverHttpClient?.setAuth(token)
		}

		return { userId, token }
	},
	component: RootComponent,
})

function RootComponent() {
	const context = useRouteContext({ from: Route.id })
	return (
		<ConvexBetterAuthProvider
			client={context.convexClient}
			authClient={authClient}
		>
			<AppearanceProvider>
				<RootDocument>
					<Outlet />
					<InstallPrompt />
				</RootDocument>
			</AppearanceProvider>
		</ConvexBetterAuthProvider>
	)
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="dark">
			<head>
				<HeadContent />
				<title>Nyx Fitness</title>
			</head>
			<body className="bg-background">
				<div className="mx-auto max-w-lg flex flex-col overflow-x-clip w-full">
					<div className="flex-1 flex pb-6 flex-col">{children}</div>
					<BottomNav />
					<TanStackDevtools
						config={{
							position: 'bottom-right',
						}}
						plugins={[
							{
								name: 'Tanstack Router',
								render: <TanStackRouterDevtoolsPanel />,
							},
						]}
					/>
					<Scripts />
				</div>
			</body>
		</html>
	)
}
