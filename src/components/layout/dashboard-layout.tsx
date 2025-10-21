
'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from '@/components/ui/sidebar';
import { SidebarNav } from './sidebar-nav';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { ThemeToggleButton } from '@/components/ui/ThemeToggleButton';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    return (
        <SidebarProvider>
            <div className="flex min-h-screen">
                <Sidebar>
                    <SidebarHeader className="p-4">
                        <div className="flex items-center justify-between gap-2">
                            <a href="#" onClick={(e) => { e.preventDefault(); router.push('/dashboard'); }} className="flex items-center gap-2 no-underline">
                            <Image
                                    src="/images/logo.png"
                                    alt="RRJ Watch Logo"
                                    width={32}
                                    height={32}
                                    className="rounded-full"
                                    data-ai-hint="company logo"
                                />
                                <div className="flex flex-col">
                                    <h2 className="text-base font-semibold text-primary dark:text-white font-headline group-data-[collapsible=icon]:hidden">
                                        RRJ Watch
                                    </h2>
                                </div>
                            </a>
                            <div className="group-data-[collapsible=icon]:hidden">
                                <ThemeToggleButton />
                            </div>
                        </div>
                    </SidebarHeader>
                    <SidebarContent>
                        <SidebarMenu>
                            <SidebarNav />
                        </SidebarMenu>
                    </SidebarContent>
                    <SidebarFooter>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <Button onClick={handleLogout} variant="ghost" className="w-full justify-start">
                                    Logout
                                </Button>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarFooter>
                </Sidebar>

                <div className="flex flex-col flex-1">
                    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:hidden">
                        <SidebarTrigger className="md:hidden" />
                         <div className="flex items-center gap-2">
                            <Image
                                src="/images/logo.png"
                                alt="RRJ Watch Logo"
                                width={32}
                                height={32}
                                className="rounded-full"
                                data-ai-hint="company logo"
                            />
                            <h1 className="text-lg font-bold text-primary font-headline">RRJ Watch</h1>
                        </div>
                    </header>
                    <main className="flex-1 overflow-x-hidden pt-4 sm:pt-6 pb-6 px-4 sm:px-6">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}
