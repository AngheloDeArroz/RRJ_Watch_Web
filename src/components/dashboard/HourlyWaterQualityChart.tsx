"use client";

import { useState, useEffect, type ComponentProps, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  type FirestoreError,
  Timestamp,
} from "firebase/firestore";
import { format, isSameDay } from "date-fns";

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
  for (let i = 0; i < 24; i++) {
    const hourTimestamp = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      i
    );
    data.push({
      timestamp: Timestamp.fromDate(hourTimestamp),
      timeLabel: format(hourTimestamp, "HH:mm"),
      temperature: parseFloat((25 + Math.random() * 3).toFixed(1)),
      ph: parseFloat((6.5 + Math.random() * 0.8).toFixed(1)),
      turbidity: parseFloat((2 + Math.random() * 5).toFixed(1)),
    });
  }
  return data;
};

export function HourlyWaterQualityChart({
  className,
  ...props
}: HourlyWaterQualityChartProps) {
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

    const unsubscribe = onSnapshot(
      historyCollectionRef,
      (querySnapshot) => {
        const today = new Date();
        const fetchedEntries: HourlyDataPoint[] = querySnapshot.docs
          .map((docSnap) => {
            const data = docSnap.data();
            const ts = data.timestamp as Timestamp | undefined;
            return {
              timestamp: ts ?? Timestamp.now(),
              timeLabel: ts ? format(ts.toDate(), "HH:mm") : docSnap.id,
              temperature: data.temperature,
              ph: data.ph,
              turbidity: data.turbidity,
            };
          })
          // Keep only entries where timestamp date is today
          .filter((entry) => {
            const date = entry.timestamp.toDate();
            return isSameDay(date, today);
          })
          //  Sort chronologically
          .sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());

        if (fetchedEntries.length > 0) {
          setChartData(fetchedEntries);
          setError(null);
        } else {
          setError("No data found for today. Displaying mock data.");
          setChartData(generateMockHourlyData());
        }
        setIsLoading(false);
      },
      (e: FirestoreError) => {
        console.error("Error fetching hourly data:", e);
        setError("Failed to fetch hourly data. Displaying mock data.");
        if (chartData.length === 0) setChartData(generateMockHourlyData());
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const averages = useMemo(() => {
    if (chartData.length === 0)
      return { temperature: null, ph: null, turbidity: null };

    const sum = chartData.reduce(
      (acc, d) => ({
        temperature: acc.temperature + (d.temperature ?? 0),
        ph: acc.ph + (d.ph ?? 0),
        turbidity: acc.turbidity + (d.turbidity ?? 0),
      }),
      { temperature: 0, ph: 0, turbidity: 0 }
    );

    const validCounts = chartData.reduce(
      (acc, d) => ({
        temperature: acc.temperature + (d.temperature != null ? 1 : 0),
        ph: acc.ph + (d.ph != null ? 1 : 0),
        turbidity: acc.turbidity + (d.turbidity != null ? 1 : 0),
      }),
      { temperature: 0, ph: 0, turbidity: 0 }
    );

    return {
      temperature:
        validCounts.temperature > 0
          ? (sum.temperature / validCounts.temperature).toFixed(1)
          : null,
      ph:
        validCounts.ph > 0
          ? (sum.ph / validCounts.ph).toFixed(1)
          : null,
      turbidity:
        validCounts.turbidity > 0
          ? (sum.turbidity / validCounts.turbidity).toFixed(1)
          : null,
    };
  }, [chartData]);

  return (
    <Card className={cn("shadow-lg", className)} {...props}>
      <CardHeader>
        <CardTitle className="font-headline">Hourly Trends (Today)</CardTitle>
        <CardDescription>
          Displays hourly water quality data for today.
        </CardDescription>
        {!isLoading && chartData.length > 0 && (
          <div className="pt-2 flex gap-2 text-[0.75rem] sm:text-xs text-muted-foreground">
            {averages.temperature && (
              <div className="flex-1 min-w-0 text-center truncate">
                Avg. °C:{" "}
                <strong className="font-semibold text-foreground">
                  {averages.temperature}
                </strong>
              </div>
            )}
            {averages.ph && (
              <div className="flex-1 min-w-0 text-center truncate">
                Avg. pH:{" "}
                <strong className="font-semibold text-foreground">
                  {averages.ph}
                </strong>
              </div>
            )}
            {averages.turbidity && (
              <div className="flex-1 min-w-0 text-center truncate">
                Avg. NTU:{" "}
                <strong className="font-semibold text-foreground">
                  {averages.turbidity}
                </strong>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {error && (
          <p className="text-sm text-destructive mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </p>
        )}
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : chartData.length > 0 ? (
          <ChartContainer
            config={chartConfig}
            className="h-[300px] w-full text-xs sm:text-sm"
          >
            <LineChart
              accessibilityLayer
              data={chartData}
              margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="timeLabel"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip
                cursor
                content={<ChartTooltipContent indicator="line" />}
              />
              <Legend />
              <Line
                dataKey="temperature"
                type="monotone"
                stroke="var(--color-temperature)"
                strokeWidth={2}
                dot={false}
                name="Temp (°C)"
                connectNulls
              />
              <Line
                dataKey="ph"
                type="monotone"
                stroke="var(--color-ph)"
                strokeWidth={2}
                dot={false}
                name="pH"
                connectNulls
              />
              <Line
                dataKey="turbidity"
                type="monotone"
                stroke="var(--color-turbidity)"
                strokeWidth={2}
                dot={false}
                name="Turbidity (NTU)"
                connectNulls
              />
            </LineChart>
          </ChartContainer>
        ) : (
          <p className="text-center text-muted-foreground py-10">
            Insufficient data for today.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
