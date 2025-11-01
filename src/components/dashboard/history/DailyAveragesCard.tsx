"use client";

import { useMemo, type ComponentProps } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Thermometer, Waves, Beaker, Scale } from "lucide-react";
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

export function DailyAveragesCard({
  historicalData,
  error,
  className,
  ...props
}: DailyAveragesCardProps) {
  const isLoading = historicalData.length === 0 && !error;

  const averages: Average[] = useMemo(() => {
    if (!historicalData || historicalData.length === 0) {
      return [
        { label: "Temp", value: "--", unit: "°C", Icon: Thermometer },
        { label: "Turbidity", value: "--", unit: "NTU", Icon: Waves },
        { label: "pH", value: "--", unit: "", Icon: Beaker },
      ];
    }

    const sum = historicalData.reduce(
      (acc, entry) => {
        acc.temp += parseFloat(entry.waterQuality.temp) || 0;
        acc.turbidity += parseFloat(entry.waterQuality.turbidity) || 0;
        acc.ph += parseFloat(entry.waterQuality.ph) || 0;
        return acc;
      },
      { temp: 0, turbidity: 0, ph: 0 }
    );

    const count = historicalData.length;

    return [
      { label: "Temp", value: (sum.temp / count).toFixed(1), unit: "°C", Icon: Thermometer },
      { label: "Turbidity", value: (sum.turbidity / count).toFixed(1), unit: "NTU", Icon: Waves },
      { label: "pH", value: (sum.ph / count).toFixed(1), unit: "", Icon: Beaker },
    ];
  }, [historicalData]);

  const evaluateMetric = (label: string, value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return { color: "text-gray-400", text: "--" };

    switch (label) {
      case "Temp":
        if (num >= 24 && num <= 28) return { color: "text-blue-400", text: "Good" };
        if ((num >= 20 && num < 24) || (num > 28 && num <= 32))
          return { color: "text-yellow-400", text: "Moderate" };
        return { color: "text-red-500", text: "Bad" };
      case "Turbidity":
        if (num <= 10) return { color: "text-blue-400", text: "Good" };
        if (num <= 40) return { color: "text-yellow-400", text: "Moderate" };
        return { color: "text-red-500", text: "Bad" };
      case "pH":
        if (num >= 6.5 && num <= 8.5) return { color: "text-blue-400", text: "Good" };
        if ((num >= 6 && num < 6.5) || (num > 8.5 && num <= 9))
          return { color: "text-yellow-400", text: "Moderate" };
        return { color: "text-red-500", text: "Bad" };
      default:
        return { color: "text-gray-400", text: "--" };
    }
  };

  return (
    <Card className={cn("relative shadow-lg overflow-hidden", className)} {...props}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-primary" />
          7-Day Averages
        </CardTitle>
        <CardDescription>
          Average water quality readings over the last week.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center justify-center bg-secondary/40 rounded-lg p-3 sm:p-4 space-y-2 text-center"
              >
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-destructive flex items-center gap-2">
            {error}
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {averages.map((avg) => {
              const evalMetric = evaluateMetric(avg.label, avg.value);
              return (
                <div
                  key={avg.label}
                  className="flex flex-col items-center justify-center bg-secondary/40 rounded-lg p-3 sm:p-4 text-center shadow-inner"
                >
                  <div className="flex justify-center items-center gap-1 sm:gap-2 mb-1 text-muted-foreground text-xs sm:text-sm">
                    <avg.Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <h4 className="font-medium">{avg.label}</h4>
                  </div>
                  <p className="text-lg sm:text-2xl font-bold text-foreground">
                    {avg.value}
                    <span className="text-xs sm:text-base font-normal text-muted-foreground ml-1">
                      {avg.unit}
                    </span>
                  </p>
                  <p className={cn("mt-1 text-xs sm:text-sm font-medium", evalMetric.color)}>
                    {evalMetric.text}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
