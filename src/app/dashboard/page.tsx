
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { WaterQualityCard } from '@/components/dashboard/WaterQualityCard';
import { HourlyWaterQualityChart } from '@/components/dashboard/HourlyWaterQualityChart';
import { ContainerLevelsCard } from '@/components/dashboard/ContainerLevelsCard';
import DashboardLayout from '@/components/layout/dashboard-layout';

export default function RRJWatchDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex flex-col min-h-screen bg-background p-4 sm:p-6 lg:p-8">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md shadow-sm mb-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Skeleton className="h-8 w-32 sm:w-48" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
          </div>
        </header>
        <main className="flex-grow container mx-auto">
           <div className="space-y-8">
              <Skeleton className="h-48" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Skeleton className="h-96" />
                <Skeleton className="h-80" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Skeleton className="h-80" />
              </div>
          </div>
        </main>
         <footer className="py-6 border-t mt-8">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <Skeleton className="h-4 w-1/2 mx-auto mb-2" />
            <Skeleton className="h-4 w-1/3 mx-auto" />
          </div>
        </footer>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <WaterQualityCard />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <HourlyWaterQualityChart />
          <ContainerLevelsCard />
        </div>
      </div>
    </DashboardLayout>
  );
}
