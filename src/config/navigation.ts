import type { LucideIcon } from 'lucide-react'
import { Dumbbell, Home, Network, Settings, SquareFunction } from 'lucide-react'

import { StickyNoteIcon } from '@/components/icons'

export type BottomNavItem = {
  href: '/' | '/workouts' | '/settings'
  icon: LucideIcon
  label: string
  color: string
  darkColor: string
}

export const bottomNavItems: BottomNavItem[] = [
  {
    href: '/',
    label: 'Home',
    icon: Home,
    color: 'bg-cyan-500/10',
    darkColor: 'text-cyan-400',
  },
  {
    href: '/workouts',
    label: 'Workouts',
    icon: Dumbbell,
    color: 'bg-purple-500/10',
    darkColor: 'text-purple-400',
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings,
    color: 'bg-purple-500/10',
    darkColor: 'text-purple-400',
  },
] as const

