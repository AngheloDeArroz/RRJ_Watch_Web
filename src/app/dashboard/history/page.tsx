
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DailyAveragesCard } from '@/components/dashboard/history/DailyAveragesCard';
import { HistoricalChartCard } from '@/components/dashboard/history/HistoricalChartCard';
import { HistoricalLogsCard } from '@/components/dashboard/history/HistoricalLogsCard';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs, Timestamp, type FirestoreError } from 'firebase/firestore';
import { format } from 'date-fns';

export interface HistoricalEntry {
  date: string;
  timestamp: Date;
  waterQuality: {
    temp: string;
    turbidity: string;
    ph: string;
  };
  feedingSchedules: string[]; 
  phBalancerTriggered: boolean;
  isAutoFeedingEnabledToday?: boolean;
  isAutoPhEnabledToday?: boolean;
  foodLevelStartOfDay?: number;
  foodLevelEndOfDay?: number;
  phSolutionLevelStartOfDay?: number;
  phSolutionLevelEndOfDay?: number;
}

const formatTimeFromTimestamp = (timestampInput: unknown): string => {
  if (timestampInput instanceof Timestamp) {
    return format(timestampInput.toDate(), "hh:mm a");
  }
  return "";
};

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [historicalData, setHistoricalData] = useState<HistoricalEntry[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      if (!user) return;
      
      if (!db) {
        setHistoryError("Firebase not configured.");
        setIsHistoryLoading(false);
        return;
      }

      setIsHistoryLoading(true);
      setHistoryError(null);
      
      try {
        const historyCollectionRef = collection(db, "water-history");
        const q = query(historyCollectionRef, orderBy("timestamp", "desc"), limit(7));
        const querySnapshot = await getDocs(q);
        
        const fetchedEntries: HistoricalEntry[] = querySnapshot.docs.map(docSnap => {
          const data = docSnap.data();
          const ts = data.timestamp as Timestamp;
          const date = ts ? ts.toDate() : new Date();
          return {
            date: ts ? format(date, "PPP") : "Invalid Date",
            timestamp: date,
            waterQuality: {
              temp: data.temp?.toString() ?? "N/A",
              turbidity: data.turbidity?.toString() ?? "N/A",
              ph: data.ph?.toString() ?? "N/A",
            },
            feedingSchedules: Array.isArray(data.feedingSchedules) ? data.feedingSchedules.map(formatTimeFromTimestamp).filter(t => t) : [],
            phBalancerTriggered: data.phBalancerTriggered ?? false,
            isAutoFeedingEnabledToday: data.isAutoFeedingEnabledToday,
            isAutoPhEnabledToday: data.isAutoPhEnabledToday,
            foodLevelStartOfDay: data.foodLevelStartOfDay,
            foodLevelEndOfDay: data.foodLevelEndOfDay,
            phSolutionLevelStartOfDay: data.phSolutionLevelStartOfDay,
            phSolutionLevelEndOfDay: data.phSolutionLevelEndOfDay,
          };
        });

        if (fetchedEntries.length > 0) {
          setHistoricalData(fetchedEntries);
        } else {
          setHistoryError("No historical data found for the last 7 days.");
        }
      } catch (error) {
        console.error("Error fetching historical data:", error);
        const firestoreError = error as FirestoreError;
        let message = "Failed to fetch history.";
        if (firestoreError.code === 'unavailable') {
          message = "You are offline. Historical data could not be fetched.";
        }
        setHistoryError(message);
      } finally {
        setIsHistoryLoading(false);
      }
    };
    
    if (user) {
        fetchHistoricalData();
    }

  }, [user]);

  const isLoading = authLoading || isHistoryLoading;

  if (isLoading && historicalData.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-40 w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DailyAveragesCard historicalData={historicalData} error={historyError} />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <HistoricalChartCard historicalData={historicalData} error={historyError} />
          <HistoricalLogsCard historicalData={historicalData} error={historyError} isLoading={isLoading} />
        </div>
      </div>
    </DashboardLayout>
  );
}
