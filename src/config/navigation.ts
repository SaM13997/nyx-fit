import type { LucideIcon } from 'lucide-react'
import { BarChart3, Dumbbell, Home, Scale, Settings } from 'lucide-react'

export type NavHref = '/' | '/workouts' | '/stats' | '/weights' | '/settings'

export type NavItem = {
  href: NavHref
  icon: LucideIcon
  label: string
  // Icon classes for the current route in the dock menu.
  iconClass: string
}

export const navItems: NavItem[] = [
  {
    href: '/',
    label: 'Home',
    icon: Home,
    iconClass: 'text-cyan-700 dark:text-cyan-300',
  },
  {
    href: '/workouts',
    label: 'Workouts',
    icon: Dumbbell,
    iconClass: 'text-purple-700 dark:text-purple-300',
  },
  {
    href: '/stats',
    label: 'Stats',
    icon: BarChart3,
    iconClass: 'text-orange-700 dark:text-orange-300',
  },
  {
    href: '/weights',
    label: 'Weight',
    icon: Scale,
    iconClass: 'text-rose-700 dark:text-rose-300',
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings,
    iconClass: 'text-foreground',
  },
]

// Pushed screens keep the tab they were opened from highlighted.
export function getActiveNavHref(pathname: string): NavHref {
  if (pathname === '/workouts' || pathname.startsWith('/workout/')) {
    return '/workouts'
  }
  if (pathname === '/stats') return '/stats'
  if (pathname === '/weights') return '/weights'
  if (
    pathname.startsWith('/settings') ||
    pathname === '/privacy' ||
    pathname === '/terms'
  ) {
    return '/settings'
  }
  return '/'
}
