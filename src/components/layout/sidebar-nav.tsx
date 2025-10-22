'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { LayoutDashboard, CalendarDays, Settings, Download } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/history', label: 'History', icon: CalendarDays },
  { href: '/dashboard/settings', label: 'Automation', icon: Settings },
];

// Replace this with your app download link
const appDownloadLink = 'https://your-app-download-link.com';
// Replace this with your QR code image URL
const qrCodeImageUrl = '/images/qr-code.png';

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

      {/* Divider */}
      <div className="flex-grow border-t border-border/40 mt-6" />

      {/* QR Code section */}
      <div className="flex flex-col items-center gap-2 mt-6 px-4 py-3 bg-secondary/20 rounded-xl text-center">
        <p className="text-sm font-medium text-foreground">Scan to download the app</p>
        <img src={qrCodeImageUrl} alt="QR Code" className="w-20 h-20 object-contain" />
        <Link href={appDownloadLink} target="_blank" className="flex items-center gap-1 text-xs text-primary hover:underline mt-1">
          <Download className="w-4 h-4" /> Download
        </Link>
      </div>
    </div>
  );
}
