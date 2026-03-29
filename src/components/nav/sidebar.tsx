'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import {
  BarChart3,
  CalendarDays,
  FileText,
  LayoutDashboard,
  LogOut,
  TrendingUp,
  Flame,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/viral-tracker', label: 'Viral Tracker', icon: TrendingUp },
  { href: '/trending', label: 'Trending', icon: Flame },
  { href: '/script-generator', label: 'Script Generator', icon: FileText },
  { href: '/calendar', label: 'Calendario', icon: CalendarDays },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="flex flex-col w-64 min-h-screen border-r bg-card px-4 py-6">
      <div className="flex items-center gap-2 mb-8 px-2">
        <span className="text-2xl">🦕</span>
        <span className="font-bold text-lg">El Empresaurio</span>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              pathname === href || pathname.startsWith(href + '/')
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      <Button
        variant="ghost"
        className="justify-start gap-3 text-muted-foreground"
        onClick={handleSignOut}
      >
        <LogOut className="h-4 w-4" />
        Cerrar sesión
      </Button>
    </aside>
  )
}
