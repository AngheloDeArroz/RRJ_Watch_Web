
'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { LayoutDashboard, CalendarDays, Settings } from 'lucide-react';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/history', label: 'History', icon: CalendarDays },
    { href: '/dashboard/settings', label: 'Automation', icon: Settings },
];

export function SidebarNav() {
    const pathname = usePathname();

    return (
        <React.Fragment>
            {navItems.map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href} className="mb-2">
                    <Link href={href} legacyBehavior passHref>
                        <SidebarMenuButton
                            isActive={pathname === href}
                            tooltip={label}
                        >
                            <Icon />
                            <span>{label}</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            ))}
        </React.Fragment>
    );
}
