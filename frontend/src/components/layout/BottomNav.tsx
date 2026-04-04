import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

function HomeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
      />
    </svg>
  )
}

function TagIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 7h.01M3 3h8l9 9a2 2 0 010 2.83l-5.17 5.17a2 2 0 01-2.83 0L3 11V3z"
      />
    </svg>
  )
}

const navItems: NavItem[] = [
  { href: '/', label: 'Início', icon: <HomeIcon /> },
  { href: '/search', label: 'Buscar', icon: <SearchIcon /> },
  { href: '/tags', label: 'Tags', icon: <TagIcon /> },
]

interface BottomNavProps {
  activePath: string
}

export function BottomNav({ activePath }: BottomNavProps) {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 inset-x-0 z-40 border-t border-barbie-accent/30 bg-white/80 backdrop-blur-md pb-safe"
    >
      <ul className="flex items-stretch justify-around h-14">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? activePath === '/'
              : activePath.startsWith(item.href)

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex h-full flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors',
                  isActive
                    ? 'text-barbie-primary'
                    : 'text-barbie-text/50 hover:text-barbie-dark',
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-xl transition-colors',
                    isActive && 'bg-barbie-bg-soft',
                  )}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
