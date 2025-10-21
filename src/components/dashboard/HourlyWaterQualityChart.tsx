
"use client";

import { useState, useEffect, type ComponentProps, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, Timestamp, type FirestoreError } from 'firebase/firestore';
import { format, subHours } from 'date-fns';

type HourlyWaterQualityChartProps = ComponentProps<typeof Card>;

interface HourlyDataPoint {
  timestamp: Timestamp;
  timeLabel: string;
  temperature?: number;
  ph?: number;
  turbidity?: number;
}

const chartConfig = {
  temperature: { label: "Temp (°C)", color: "hsl(var(--chart-1))" },
  ph: { label: "pH", color: "hsl(var(--chart-2))" },
  turbidity: { label: "Turbidity (NTU)", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

const generateMockHourlyData = (): HourlyDataPoint[] => {
  const data: HourlyDataPoint[] = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const hourTimestamp = subHours(now, i);
    data.push({
      timestamp: Timestamp.fromDate(hourTimestamp),
      timeLabel: format(hourTimestamp, "HH:mm"),
      temperature: parseFloat((24 + Math.random() * 3).toFixed(1)),
      ph: parseFloat((6.8 + Math.random() * 0.5).toFixed(1)),
      turbidity: parseFloat((3 + Math.random() * 10).toFixed(1)),
    });
  }
  return data;
};

export function HourlyWaterQualityChart({ className, ...props }: HourlyWaterQualityChartProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<HourlyDataPoint[]>([]);

  useEffect(() => {
    if (!db) {
      setError("Firebase not configured. Displaying mock data.");
      setChartData(generateMockHourlyData());
      setIsLoading(false);
      return;
    }
    const historyCollectionRef = collection(db, "hourly-water-quality");
    const q = query(historyCollectionRef, orderBy("timestamp", "desc"), limit(24));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedEntries: HourlyDataPoint[] = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const ts = data.timestamp as Timestamp;
        return {
          timestamp: ts,
          timeLabel: ts ? format(ts.toDate(), "HH:mm") : "N/A",
          temperature: data.temperature, ph: data.ph, turbidity: data.turbidity
        };
      });

      if (fetchedEntries.length > 0) {
        setChartData(fetchedEntries.reverse());
        setError(null);
      } else {
        setError("No hourly data found. Displaying mock data.");
        setChartData(generateMockHourlyData());
      }
      setIsLoading(false);
    }, (e: FirestoreError) => {
      console.error("Error fetching hourly data:", e);
      let message = "Failed to fetch hourly data. Displaying mock data.";
      if (e.code === 'unavailable') message = "You are offline. Displaying mock data if cache is empty.";
      setError(message);
      if (chartData.length === 0) setChartData(generateMockHourlyData());
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [chartData.length]);

  const averages = useMemo(() => {
    if (chartData.length === 0) {
        return { temperature: null, ph: null, turbidity: null };
    }
    const sum = chartData.reduce((acc, data) => {
        acc.temperature += data.temperature ?? 0;
        acc.ph += data.ph ?? 0;
        acc.turbidity += data.turbidity ?? 0;
        return acc;
    }, { temperature: 0, ph: 0, turbidity: 0 });

    const validCounts = chartData.reduce((acc, data) => {
        if (data.temperature != null) acc.temperature++;
        if (data.ph != null) acc.ph++;
        if (data.turbidity != null) acc.turbidity++;
        return acc;
    }, { temperature: 0, ph: 0, turbidity: 0 });

    return {
        temperature: validCounts.temperature > 0 ? (sum.temperature / validCounts.temperature).toFixed(1) : null,
        ph: validCounts.ph > 0 ? (sum.ph / validCounts.ph).toFixed(1) : null,
        turbidity: validCounts.turbidity > 0 ? (sum.turbidity / validCounts.turbidity).toFixed(1) : null,
    };
  }, [chartData]);


  return (
    <Card className={cn("shadow-lg", className)} {...props}>
      <CardHeader>
        <CardTitle className="font-headline">Hourly Trends (Last 24h)</CardTitle>
        <CardDescription>A summary of water quality changes over the past day.</CardDescription>
        {!isLoading && chartData.length > 0 && (
          <div className="pt-2 text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
            {averages.temperature && <span>Avg. Temp: <strong className="font-semibold text-foreground">{averages.temperature}°C</strong></span>}
            {averages.ph && <span>Avg. pH: <strong className="font-semibold text-foreground">{averages.ph}</strong></span>}
            {averages.turbidity && <span>Avg. Turbidity: <strong className="font-semibold text-foreground">{averages.turbidity} NTU</strong></span>}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/>{error}</p>}
        {isLoading ? <Skeleton className="h-[300px] w-full" /> : 
         (chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px] w-full text-xs sm:text-sm">
                <LineChart accessibilityLayer data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="timeLabel" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" minTickGap={40}/>
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip cursor={true} content={<ChartTooltipContent indicator="line" />} />
                <Legend />
                <Line dataKey="temperature" type="monotone" stroke="var(--color-temperature)" strokeWidth={2} dot={false} name="Temp (°C)" connectNulls/>
                <Line dataKey="ph" type="monotone" stroke="var(--color-ph)" strokeWidth={2} dot={false} name="pH" connectNulls/>
                <Line dataKey="turbidity" type="monotone" stroke="var(--color-turbidity)" strokeWidth={2} dot={false} name="Turbidity (NTU)" connectNulls/>
                </LineChart>
            </ChartContainer>
            ) : (
            <p className="text-center text-muted-foreground py-10">Insufficient data for chart.</p>
         ))
        }
      </CardContent>
    </Card>
  );
}
