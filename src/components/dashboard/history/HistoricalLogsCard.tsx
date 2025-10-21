"use client";

import { type ComponentProps } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, WifiOff, Clock, Droplets, Percent, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HistoricalEntry } from "@/app/dashboard/history/page";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Fixed version - visible in both light and dark mode
const ContainerLevelBar = ({ start, end }: { start?: number; end?: number }) => {
  if (start === undefined || end === undefined) {
    return (
      <span className="text-muted-foreground/70 italic text-xs">N/A</span>
    );
  }

  const startLevel = Math.max(0, Math.min(100, start));
  const endLevel = Math.max(0, Math.min(100, end));

  return (
    <div className="w-full h-5 bg-secondary rounded-md overflow-hidden relative border border-border/50">
      {/* End Level (bottom layer) */}
      <div className="h-full bg-primary/30" style={{ width: `${startLevel}%` }} />
      {/* Start Level (top layer, reveals end level underneath) */}
      <div
        className="absolute top-0 left-0 h-full bg-primary"
        style={{ width: `${endLevel}%` }}
      />

      {/* Text Labels */}
      <div className="absolute inset-0 flex items-center justify-between px-2 text-xs font-semibold">
        <span
          className="text-black dark:text-white drop-shadow-sm"
          style={{ opacity: startLevel > 10 ? 1 : 0 }}
        >
          Start: {start}%
        </span>
        <span
          className="text-black dark:text-white drop-shadow-sm"
          style={{ opacity: endLevel > 10 ? 1 : 0 }}
        >
          End: {end}%
        </span>
      </div>
    </div>
  );
};

export function HistoricalLogsCard({
  historicalData,
  error,
  isLoading,
  className,
  ...props
}: ComponentProps<typeof Card> & {
  historicalData: HistoricalEntry[];
  error: string | null;
  isLoading: boolean;
}) {
  const renderStatus = (status: boolean | undefined) => {
    if (status === undefined)
      return <span className="text-muted-foreground/70 italic">N/A</span>;
    return status ? (
      <span className="text-green-600 dark:text-green-400">Enabled</span>
    ) : (
      <span className="text-red-600 dark:text-red-400">Disabled</span>
    );
  };

  const downloadPDF = () => {
    const doc = new jsPDF();

    const tableColumn = [
      "Date",
      "Feeding Status",
      "Feeding Times",
      "pH Balancer Status",
      "pH Activity",
      "Food Level Start",
      "Food Level End",
      "pH Level Start",
      "pH Level End",
    ];

    const tableRows: (string | number)[][] = historicalData.map((entry) => [
      entry.date,
      entry.isAutoFeedingEnabledToday ? "Enabled" : "Disabled",
      entry.feedingSchedules.length > 0
        ? entry.feedingSchedules.join(", ")
        : "No automated feeding",
      entry.isAutoPhEnabledToday ? "Enabled" : "Disabled",
      entry.phSolutionLevelEndOfDay !== undefined &&
      entry.phSolutionLevelStartOfDay !== undefined
        ? entry.phSolutionLevelEndOfDay < entry.phSolutionLevelStartOfDay
          ? "Triggered"
          : "Not Triggered"
        : "N/A",
      entry.foodLevelStartOfDay ?? "N/A",
      entry.foodLevelEndOfDay ?? "N/A",
      entry.phSolutionLevelStartOfDay ?? "N/A",
      entry.phSolutionLevelEndOfDay ?? "N/A",
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [63, 81, 181] },
    });

    doc.save("historical_logs.pdf");
  };

  return (
    <Card className={cn("shadow-lg", className)} {...props}>
      <CardHeader className="relative">
        <CardTitle className="font-headline flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" /> Daily Logs
        </CardTitle>
        <CardDescription>
          A day-by-day record of system activities.
        </CardDescription>

        {/* Download button positioned top-right */}
        <button
          className="absolute top-3 right-3 flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded bg-primary text-white hover:bg-primary/90"
          onClick={downloadPDF}
        >
          <Download className="w-4 h-4" /> Download PDF
        </button>
      </CardHeader>

      <CardContent className="space-y-4">
        <ScrollArea className="h-80 pr-4">
          {isLoading && (
            <div className="space-y-4 py-2">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="shadow-sm">
                  <CardHeader className="py-3 px-4">
                    <Skeleton className="h-5 w-1/2" />
                  </CardHeader>
                  <CardContent className="space-y-2 py-3 px-4 text-sm">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {error && !isLoading && (
            <div className="h-80 flex items-center justify-center">
              <div className="my-4 p-3 rounded-md bg-destructive/10 border border-destructive text-destructive text-sm flex items-center gap-2">
                <WifiOff className="w-5 h-5" /> {error}
              </div>
            </div>
          )}

          {!isLoading && historicalData.length > 0 && (
            <div className="space-y-4 py-2">
              {historicalData.map((entry) => {
                const wasPhTriggered =
                  entry.phSolutionLevelStartOfDay !== undefined &&
                  entry.phSolutionLevelEndOfDay !== undefined &&
                  entry.phSolutionLevelEndOfDay < entry.phSolutionLevelStartOfDay;

                return (
                  <Card key={entry.date} className="shadow-sm bg-secondary/30">
                    <CardContent className="space-y-3 p-3 text-sm">
                      <p className="font-headline mb-2 font-semibold">
                        {entry.date}
                      </p>

                      {/* Feeding Section */}
                      <div>
                        <h5 className="text-xs font-semibold mb-1 text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Feeding:
                        </h5>
                        <p className="text-xs text-muted-foreground">
                          System Status: {renderStatus(entry.isAutoFeedingEnabledToday)}
                        </p>
                        {entry.feedingSchedules.length > 0 ? (
                          <p className="text-xs text-muted-foreground">
                            Fed at: {entry.feedingSchedules.join(", ")}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">
                            No automated feeding triggered.
                          </p>
                        )}
                      </div>

                      {/* pH Balancer Section */}
                      <div>
                        <h5 className="text-xs font-semibold mb-1 text-muted-foreground flex items-center gap-1">
                          <Droplets className="w-3 h-3" />
                          pH Balancer:
                        </h5>
                        <p className="text-xs text-muted-foreground">
                          System Status: {renderStatus(entry.isAutoPhEnabledToday)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Activity:{" "}
                          {entry.phSolutionLevelStartOfDay !== undefined &&
                          entry.phSolutionLevelEndOfDay !== undefined ? (
                            wasPhTriggered ? (
                              <span className="text-accent-foreground font-semibold">
                                Triggered
                              </span>
                            ) : (
                              "Not Triggered"
                            )
                          ) : (
                            <span className="italic text-muted-foreground/70">
                              N/A
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Container Levels */}
                      <div>
                        <h5 className="text-xs font-semibold mb-2 text-muted-foreground flex items-center gap-1">
                          <Percent className="w-3 h-3" />
                          Container Levels:
                        </h5>
                        <div className="space-y-2">
                          <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                            <span className="text-xs text-muted-foreground">Food:</span>
                            <ContainerLevelBar
                              start={entry.foodLevelStartOfDay}
                              end={entry.foodLevelEndOfDay}
                            />
                          </div>
                          <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                            <span className="text-xs text-muted-foreground">pH Solution:</span>
                            <ContainerLevelBar
                              start={entry.phSolutionLevelStartOfDay}
                              end={entry.phSolutionLevelEndOfDay}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {!isLoading && !error && historicalData.length === 0 && (
            <div className="h-80 flex items-center justify-center">
              <p className="text-center text-muted-foreground">
                No historical logs available.
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
