'use client';

import { useState, useEffect, type ComponentProps } from "react";
import Image from "next/image";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Thermometer,
  Waves,
  Beaker,
  WifiOff,
  Info,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, type FirestoreError, Timestamp } from "firebase/firestore";

type WaterQualityCardProps = ComponentProps<typeof Card>;

interface WaterQualityParam {
  id: "temp" | "turbidity" | "ph";
  label: string;
  value: string;
  unit: string;
  Icon: React.ElementType;
}

const PARAMETER_RANGES = {
  temp: { min: 22, max: 28 },
  turbidity: { min: 0, max: 40 },
  ph: { min: 6.5, max: 7.5 },
};

export function WaterQualityCard({ className, ...props }: WaterQualityCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<number | null>(null);
  const [turbidityValue, setTurbidityValue] = useState<number | null>(null);
  const [phValue, setPhValue] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Timestamp | null>(null);

  const [waterQualityData, setWaterQualityData] = useState<WaterQualityParam[]>([
    { id: "temp", label: "Temperature", value: "--", unit: "°C", Icon: Thermometer },
    { id: "turbidity", label: "Turbidity", value: "--", unit: "NTU", Icon: Waves },
    { id: "ph", label: "pH Level", value: "--", unit: "", Icon: Beaker },
  ]);

  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (!db) {
      setError("Firebase not configured.");
      setIsLoading(false);
      return;
    }

    const docRef = doc(db, "current-water-quality", "live");
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const temp = data.temperature ?? null;
          const turbidity = data.turbidity ?? null;
          const ph = data.ph ?? null;
          const last = data.lastUpdated ?? null;

          setTempValue(temp);
          setTurbidityValue(turbidity);
          setPhValue(ph);
          setLastUpdated(last);

          setWaterQualityData([
            { id: "temp", label: "Temperature", value: temp?.toFixed(1) ?? "--", unit: "°C", Icon: Thermometer },
            { id: "turbidity", label: "Turbidity", value: turbidity?.toFixed(1) ?? "--", unit: "NTU", Icon: Waves },
            { id: "ph", label: "pH Level", value: ph?.toFixed(1) ?? "--", unit: "", Icon: Beaker },
          ]);

          if (last) {
            const online = new Date().getTime() - last.toDate().getTime() < 5 * 60 * 1000;
            setIsOnline(online);
          } else {
            setIsOnline(false);
          }

          setError(null);
        } else {
          setError("Live data not found.");
          setIsOnline(false);
        }
        setIsLoading(false);
      },
      (e: FirestoreError) => {
        console.error("Error fetching live water quality:", e);
        let message = "Failed to fetch live data.";
        if (e.code === "unavailable") message = "You are offline. Showing last cached data.";
        setError(message);
        setIsLoading(false);
        setIsOnline(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const getWaterStatus = (): { isSafe: boolean; message: string; Icon: React.ElementType } => {
    if (!isOnline) return { isSafe: false, message: "System offline", Icon: ShieldAlert };
    if (tempValue === null || turbidityValue === null || phValue === null) {
      return { isSafe: false, message: "Awaiting sensor data...", Icon: ShieldAlert };
    }

    const issues: string[] = [];
    if (tempValue < PARAMETER_RANGES.temp.min || tempValue > PARAMETER_RANGES.temp.max) issues.push("temperature");
    if (turbidityValue > PARAMETER_RANGES.turbidity.max) issues.push("turbidity");
    if (phValue < PARAMETER_RANGES.ph.min || phValue > PARAMETER_RANGES.ph.max) issues.push("pH");

    if (issues.length === 0) return { isSafe: true, message: "Water is safe for fish.", Icon: ShieldCheck };

    return {
      isSafe: false,
      message: `Warning: Unsafe ${issues.join(", ")} level(s).`,
      Icon: ShieldAlert,
    };
  };

  const waterStatus = getWaterStatus();
  const aquariumImage = waterStatus.isSafe
    ? "/images/healthy_aquarium.gif"
    : "/images/unhealthy_aquarium.gif";
  const imageHint = waterStatus.isSafe ? "healthy aquarium" : "unhealthy aquarium";

  return (
    <Card
      className={cn(
        "shadow-lg overflow-hidden relative w-full aspect-video sm:aspect-[2.4/1]",
        className
      )}
      {...props}
    >
      <TooltipProvider>
        {isLoading ? (
          <Skeleton className="w-full h-full" />
        ) : (
          <>
            <Image
              key={aquariumImage}
              src={aquariumImage}
              alt={imageHint}
              fill
              style={{ objectFit: "cover" }}
              className="transition-all duration-700 ease-in-out z-0"
              unoptimized
            />

            <div
              className={cn(
                "absolute inset-0 z-10 transition-all duration-700",
                waterStatus.isSafe
                  ? "bg-gradient-to-t from-blue-900/50 via-blue-900/20 to-transparent ring-4 ring-blue-400/50 animate-pulse"
                  : "bg-gradient-to-t from-red-900/60 via-red-900/30 to-transparent ring-4 ring-red-500/60 animate-pulse"
              )}
            />

            <div className="relative z-20 flex flex-col justify-between h-full p-2 sm:p-4 md:p-6 text-white">
              {/* MAIN FLEX ROW */}
              <div className="flex flex-row justify-between items-start gap-2 sm:gap-4 flex-nowrap">
                {/* Left Info Box */}
                <div className="flex-shrink-0 bg-black/40 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-2 rounded-lg w-auto min-w-[100px]">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <CardTitle className="font-headline text-sm sm:text-base md:text-lg">
                      {isOnline ? "Live Water Quality" : "Last Sensor Data"}
                    </CardTitle>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="focus:outline-none">
                          <Info className="w-3 h-3 sm:w-4 sm:h-4 text-gray-300 hover:text-white transition-colors" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-background/80 backdrop-blur-sm text-foreground border-border max-w-xs">
                        <div className="text-sm">
                          <h4 className="font-bold mb-2">Acceptable Parameter Ranges</h4>
                          <ul className="list-disc list-inside space-y-1">
                            <li>
                              <strong>Temperature:</strong> {PARAMETER_RANGES.temp.min}-{PARAMETER_RANGES.temp.max} °C
                            </li>
                            <li>
                              <strong>Turbidity:</strong> {PARAMETER_RANGES.turbidity.min}-{PARAMETER_RANGES.turbidity.max} NTU
                            </li>
                            <li>
                              <strong>pH Level:</strong> {PARAMETER_RANGES.ph.min}-{PARAMETER_RANGES.ph.max}
                            </li>
                          </ul>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <CardDescription className="text-gray-200 text-[10px] sm:text-xs md:text-sm">
                    {isOnline
                      ? "Real-time sensor readings from your system."
                      : lastUpdated
                      ? `Last updated: ${lastUpdated.toDate().toLocaleString()}`
                      : "No recent data available."}
                  </CardDescription>
                </div>

                {/* Right Data Box */}
                <div className="flex-shrink bg-black/40 backdrop-blur-sm rounded-lg shadow-lg p-2 sm:p-3 w-auto min-w-[120px]">
                  {error && (
                    <p className="text-[9px] sm:text-xs text-red-300 mb-1 flex items-center gap-1 sm:gap-2 break-words">
                      <WifiOff className="w-3 h-3 sm:w-4 sm:h-4" />
                      {error}
                    </p>
                  )}
                  {waterQualityData.map((param) => (
                    <div key={param.id} className="flex items-center justify-between gap-1 sm:gap-4">
                      <div className="flex items-center gap-1">
                        <param.Icon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-300" />
                        <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-100">{param.label}</p>
                      </div>
                      <p className="text-sm sm:text-base md:text-lg font-bold text-white">
                        {param.value}
                        {param.unit && <span className="text-[9px] sm:text-xs md:text-sm ml-1 font-medium">{param.unit}</span>}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Water Status */}
              <div
                className={cn(
                  "flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 text-[10px] sm:text-xs rounded-full font-medium self-start mt-2 sm:mt-3 backdrop-blur-sm",
                  waterStatus.isSafe
                    ? "bg-blue-500/80 text-white"
                    : "bg-red-600/80 text-white"
                )}
              >
                <waterStatus.Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="text-[10px] sm:text-xs md:text-sm">{waterStatus.message}</span>
              </div>
            </div>
          </>
        )}
      </TooltipProvider>
    </Card>
  );
}
