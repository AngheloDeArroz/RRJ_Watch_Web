
"use client";

import { useMemo, type ComponentProps } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Thermometer, Waves, Beaker, AlertTriangle, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HistoricalEntry } from "@/app/dashboard/history/page";

type DailyAveragesCardProps = ComponentProps<typeof Card> & {
  historicalData: HistoricalEntry[];
  error: string | null;
};

interface Average {
  label: string;
  value: string;
  unit: string;
  Icon: React.ElementType;
}

export function DailyAveragesCard({ historicalData, error, className, ...props }: DailyAveragesCardProps) {
  const isLoading = historicalData.length === 0 && !error;

  const averages: Average[] = useMemo(() => {
    if (!historicalData || historicalData.length === 0) {
      return [
        { label: "Avg. Temp", value: "--", unit: "°C", Icon: Thermometer },
        { label: "Avg. Turbidity", value: "--", unit: "NTU", Icon: Waves },
        { label: "Avg. pH", value: "--", unit: "", Icon: Beaker },
      ];
    }

    const sum = historicalData.reduce((acc, entry) => {
      acc.temp += parseFloat(entry.waterQuality.temp) || 0;
      acc.turbidity += parseFloat(entry.waterQuality.turbidity) || 0;
      acc.ph += parseFloat(entry.waterQuality.ph) || 0;
      return acc;
    }, { temp: 0, turbidity: 0, ph: 0 });

    const count = historicalData.length;

    return [
      { label: "Avg. Temp", value: (sum.temp / count).toFixed(1), unit: "°C", Icon: Thermometer },
      { label: "Avg. Turbidity", value: (sum.turbidity / count).toFixed(1), unit: "NTU", Icon: Waves },
      { label: "Avg. pH", value: (sum.ph / count).toFixed(1), unit: "", Icon: Beaker },
    ];
  }, [historicalData]);

  return (
    <Card className={cn("shadow-lg", className)} {...props}>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary"/>
            7-Day Averages
        </CardTitle>
        <CardDescription>Average water quality readings over the last week.</CardDescription>
      </CardHeader>
      <CardContent>
         {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-4 rounded-lg bg-secondary/40 flex flex-col items-center justify-center space-y-2">
                        <Skeleton className="h-6 w-24 mb-1" />
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                ))}
            </div>
         ) : error ? (
             <p className="text-sm text-destructive flex items-center gap-2"><AlertTriangle className="w-4 h-4"/>{error}</p>
         ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {averages.map(avg => (
                    <div key={avg.label} className="p-4 rounded-lg bg-secondary/40 text-center shadow-inner">
                        <div className="flex justify-center items-center gap-2 mb-2 text-muted-foreground">
                            <avg.Icon className="w-4 h-4" />
                            <h4 className="text-sm font-medium">{avg.label}</h4>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{avg.value}
                            <span className="text-base font-normal text-muted-foreground ml-1">{avg.unit}</span>
                        </p>
                    </div>
                ))}
            </div>
         )}
      </CardContent>
    </Card>
  );
}
