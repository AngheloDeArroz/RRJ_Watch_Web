
"use client";

import { type ComponentProps } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import type { HistoricalEntry } from "@/app/dashboard/history/page";

type HistoricalChartCardProps = ComponentProps<typeof Card> & {
  historicalData: HistoricalEntry[];
  error: string | null;
};

const chartConfig = {
  temperature: { label: "Temp (°C)", color: "hsl(var(--chart-1))" },
  ph: { label: "pH", color: "hsl(var(--chart-2))" },
  turbidity: { label: "Turbidity (NTU)", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;


export function HistoricalChartCard({ historicalData, error, className, ...props }: HistoricalChartCardProps) {
  const isLoading = historicalData.length === 0 && !error;

  const chartData = historicalData.map(entry => ({
      date: format(entry.timestamp, "MMM d"),
      temperature: parseFloat(entry.waterQuality.temp) || undefined,
      ph: parseFloat(entry.waterQuality.ph) || undefined,
      turbidity: parseFloat(entry.waterQuality.turbidity) || undefined,
  })).reverse(); // Reverse for chronological order in chart

  return (
    <Card className={cn("shadow-lg", className)} {...props}>
      <CardHeader>
        <CardTitle className="font-headline">Historical Trends</CardTitle>
        <CardDescription>Visualizing water quality changes over the past 7 days.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-[250px] w-full" /> : 
         error ? (
             <div className="h-[250px] flex items-center justify-center">
                 <p className="text-sm text-destructive flex items-center gap-2"><AlertTriangle className="w-4 h-4"/>{error}</p>
             </div>
         ) :
         (chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[250px] w-full text-xs sm:text-sm">
                <AreaChart accessibilityLayer data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip cursor={true} content={<ChartTooltipContent indicator="line" />} />
                    <Legend />
                    <Area dataKey="temperature" type="monotone" fill="var(--color-temperature)" fillOpacity={0.4} stroke="var(--color-temperature)" stackId="a" connectNulls/>
                    <Area dataKey="ph" type="monotone" fill="var(--color-ph)" fillOpacity={0.4} stroke="var(--color-ph)" stackId="b" connectNulls/>
                    <Area dataKey="turbidity" type="monotone" fill="var(--color-turbidity)" fillOpacity={0.4} stroke="var(--color-turbidity)" stackId="c" connectNulls/>
                </AreaChart>
            </ChartContainer>
            ) : (
            <div className="h-[250px] flex items-center justify-center">
                <p className="text-center text-muted-foreground">Insufficient data for chart.</p>
            </div>
         ))
        }
      </CardContent>
    </Card>
  );
}
