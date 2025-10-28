'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { SidebarNav } from './sidebar-nav';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { ThemeToggleButton } from '@/components/ui/ThemeToggleButton';
import { LogOut } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Sidebar - wrapper */}
        <Sidebar className="bg-white text-gray-900 dark:bg-zinc-900 dark:text-gray-100 shadow-md">
          {/* SidebarHeader - force opaque white background */}
          <SidebarHeader className="p-4 bg-white text-gray-900 dark:bg-zinc-900 dark:text-gray-100">
            <div className="flex items-center justify-between gap-2">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  router.push('/dashboard');
                }}
                className="flex items-center gap-2 no-underline"
              >
                <Image
                  src="/images/logo.png"
                  alt="RRJ Watch Logo"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <h2 className="text-lg font-semibold text-primary dark:text-white font-headline whitespace-nowrap">
                  RRJ Watch
                </h2>
              </a>
              <div className="group-data-[collapsible=icon]:hidden">
                <ThemeToggleButton />
              </div>
            </div>
          </SidebarHeader>

          {/* SidebarContent - force opaque white background and remove backdrop blur/transparency */}
          <SidebarContent className="bg-white text-gray-900 dark:bg-zinc-900 dark:text-gray-100 shadow-none border-r border-border/30">
            <div className="border-t border-border/30 mb-2" />
            <SidebarMenu>
              <SidebarNav />
            </SidebarMenu>
          </SidebarContent>

          {/* SidebarFooter - force opaque background */}
          <SidebarFooter className="bg-white text-gray-900 dark:bg-zinc-900 dark:text-gray-100">
            <SidebarMenu>
              <SidebarMenuItem>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="w-full justify-start gap-2"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </Button>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Main Dashboard Area */}
        <div className="flex flex-col flex-1 w-full h-screen bg-background">
          {/* Mobile Header - only visible when sidebar is hidden */}
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/90 backdrop-blur-md px-2 sm:px-4 md:hidden">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <Image
                src="/images/logo.png"
                alt="RRJ Watch Logo"
                width={32}
                height={32}
                className="rounded-full"
              />
              <h1 className="text-lg font-bold text-primary font-headline">RRJ Watch</h1>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 w-full h-full overflow-y-auto overflow-x-hidden px-2 sm:px-4 lg:px-6 py-2 sm:py-4 lg:py-6 transform transition-all duration-300 ease-in-out text-[clamp(0.9rem,1vw,1rem)]">
            <div className="w-full flex flex-col gap-4 sm:gap-6 pt-1 sm:pt-4 pb-2 sm:pb-6 px-1 sm:px-3">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
