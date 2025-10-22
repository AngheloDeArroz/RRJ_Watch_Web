"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AutomationControlCard } from "@/components/dashboard/settings/AutomationCards";
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
        <div className="w-full h-full p-6">
          <Skeleton className="h-[600px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full h-full p-6">
        <AutomationControlCard className="w-full h-full" />
      </div>
    </DashboardLayout>
  );
}
