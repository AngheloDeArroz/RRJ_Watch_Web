'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { LayoutDashboard, CalendarDays, Settings } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/history', label: 'History', icon: CalendarDays },
  { href: '/dashboard/settings', label: 'Automation', icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col justify-start gap-4 px-3 py-6">
      {navItems.map(({ href, label, icon: Icon }) => (
        <SidebarMenuItem key={href}>
          <Link href={href} legacyBehavior passHref>
            <SidebarMenuButton
              isActive={pathname === href}
              tooltip={label}
              className={cn(
                'flex items-center gap-4 rounded-xl px-5 py-4 text-base font-medium transition-all',
                'hover:bg-accent hover:text-accent-foreground',
                pathname === href && 'bg-accent text-accent-foreground shadow-md'
              )}
            >
              <Icon className="h-6 w-6" />
              <span>{label}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}

      {/* Optional section divider for future expansion */}
      <div className="flex-grow border-t border-border/40 mt-6" />

    </div>
  );
}
