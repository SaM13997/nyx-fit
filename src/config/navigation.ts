import type { LucideIcon } from 'lucide-react'
import { BarChart3, Dumbbell, Home, Scale, Settings } from 'lucide-react'

export type NavHref = '/' | '/workouts' | '/stats' | '/weights' | '/settings'

export type NavItem = {
  href: NavHref
  icon: LucideIcon
  label: string
  // Icon color for the current route in the dock menu.
  iconColor: string
}

export const navItems: NavItem[] = [
  {
    href: '/',
    label: 'Home',
    icon: Home,
    iconColor: '#67e8f9',
  },
  {
    href: '/workouts',
    label: 'Workouts',
    icon: Dumbbell,
    iconColor: '#d8b4fe',
  },
  {
    href: '/stats',
    label: 'Stats',
    icon: BarChart3,
    iconColor: '#fdba74',
  },
  {
    href: '/weights',
    label: 'Weight',
    icon: Scale,
    iconColor: '#fda4af',
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings,
    iconColor: '#ffffff',
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
