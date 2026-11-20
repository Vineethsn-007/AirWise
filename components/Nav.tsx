'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Today' },
  { href: '/plan', label: 'Routine Planner' },
  { href: '/plan#indoor', label: 'Indoor Hub' },
  { href: '/#impact', label: 'Impact' },
  { href: '/profile', label: 'Household' },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3">
      <nav
        aria-label="Primary navigation"
        className="flex max-w-full items-center gap-1 overflow-x-auto rounded-capsule border border-white/70 bg-white/90 p-1.5 shadow-capsule backdrop-blur"
      >
        <Link
          href="/"
          className="mr-1 shrink-0 rounded-capsule bg-sky-deep px-3 py-2 text-sm font-bold tracking-tight text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-deep"
        >
          AirWise
        </Link>
        {LINKS.map((link) => {
          const active = pathname === link.href.split('#')[0] && !link.href.includes('#');
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? 'page' : undefined}
              className={`shrink-0 rounded-capsule px-3 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-deep ${
                active ? 'bg-sky-soft text-sky-deep' : 'text-sky-ink hover:bg-sky-mist'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
