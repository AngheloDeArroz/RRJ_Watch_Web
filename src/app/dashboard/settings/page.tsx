"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AutomatedFeedingCard, PhBalancerCard } from "@/components/dashboard/settings/AutomationCards";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <DashboardLayout>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full h-full p-6">
          <Skeleton className="h-[450px] w-full" />
          <Skeleton className="h-[350px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full h-full p-6">
        <AutomatedFeedingCard className="w-full h-full" />
        <PhBalancerCard className="w-full h-full" />
      </div>
    </DashboardLayout>
  );
}
