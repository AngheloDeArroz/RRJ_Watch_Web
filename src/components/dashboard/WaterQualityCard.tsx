"use client";

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
import { doc, onSnapshot, type FirestoreError } from "firebase/firestore";

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
  turbidity: { min: 0, max: 10 },
  ph: { min: 6.5, max: 7.5 },
};

export function WaterQualityCard({
  className,
  ...props
}: WaterQualityCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tempValue, setTempValue] = useState<number | null>(null);
  const [turbidityValue, setTurbidityValue] = useState<number | null>(null);
  const [phValue, setPhValue] = useState<number | null>(null);

  const [waterQualityData, setWaterQualityData] = useState<WaterQualityParam[]>([
    { id: "temp", label: "Temperature", value: "--", unit: "°C", Icon: Thermometer },
    { id: "turbidity", label: "Turbidity", value: "--", unit: "NTU", Icon: Waves },
    { id: "ph", label: "pH Level", value: "--", unit: "", Icon: Beaker },
  ]);

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

          setTempValue(temp);
          setTurbidityValue(turbidity);
          setPhValue(ph);

          setWaterQualityData([
            { id: "temp", label: "Temperature", value: temp?.toFixed(1) ?? "--", unit: "°C", Icon: Thermometer },
            { id: "turbidity", label: "Turbidity", value: turbidity?.toFixed(1) ?? "--", unit: "NTU", Icon: Waves },
            { id: "ph", label: "pH Level", value: ph?.toFixed(1) ?? "--", unit: "", Icon: Beaker },
          ]);
          setError(null);
        } else {
          setError("Live data not found.");
        }
        setIsLoading(false);
      },
      (e: FirestoreError) => {
        console.error("Error fetching live water quality:", e);
        let message = "Failed to fetch live data.";
        if (e.code === "unavailable") message = "You are offline. Showing last cached data.";
        setError(message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const getWaterStatus = (): { isSafe: boolean; message: string; Icon: React.ElementType } => {
    if (tempValue === null || turbidityValue === null || phValue === null) {
      return { isSafe: false, message: "Awaiting sensor data...", Icon: ShieldAlert };
    }

    const issues: string[] = [];
    if (tempValue < PARAMETER_RANGES.temp.min || tempValue > PARAMETER_RANGES.temp.max) {
      issues.push("temperature");
    }
    if (turbidityValue > PARAMETER_RANGES.turbidity.max) {
      issues.push("turbidity");
    }
    if (phValue < PARAMETER_RANGES.ph.min || phValue > PARAMETER_RANGES.ph.max) {
      issues.push("pH");
    }

    if (issues.length === 0) {
      return { isSafe: true, message: "Water is safe for fish.", Icon: ShieldCheck };
    }

    return {
      isSafe: false,
      message: `Warning: Unsafe ${issues.join(", ")} level(s).`,
      Icon: ShieldAlert,
    };
  };

  // --- Use water safety to decide GIF background ---
  const waterStatus = getWaterStatus();
  const aquariumImage = waterStatus.isSafe
    ? "/images/healthy_aquarium.gif"
    : "/images/unhealthy_aquarium.gif";

  const imageHint = waterStatus.isSafe ? "healthy aquarium" : "unhealthy aquarium";

  return (
    <Card
      className={cn(
        "shadow-lg overflow-hidden relative aspect-video w-full sm:aspect-[2.4/1]",
        className
      )}
      {...props}
    >
      <TooltipProvider>
        {isLoading ? (
          <Skeleton className="w-full h-full" />
        ) : (
          <>
            {/* Background GIF */}
            <Image
              key={aquariumImage}
              src={aquariumImage}
              alt={imageHint}
              fill
              style={{ objectFit: "cover" }}
              className="transition-all duration-700 ease-in-out z-0"
              unoptimized
            />

            {/* Overlay: gradient + glow border */}
            <div
              className={cn(
                "absolute inset-0 z-10 transition-all duration-700",
                waterStatus.isSafe
                  ? "bg-gradient-to-t from-blue-900/50 via-blue-900/20 to-transparent ring-4 ring-blue-400/50 animate-pulse"
                  : "bg-gradient-to-t from-red-900/60 via-red-900/30 to-transparent ring-4 ring-red-500/60 animate-pulse"
              )}
            />

            {/* Text and readings */}
            <div className="relative z-20 flex flex-col justify-between h-full p-4 sm:p-6 text-white">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-shrink-0 bg-black/40 backdrop-blur-sm px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CardTitle className="font-headline text-lg sm:text-xl">
                      Live Water Quality
                    </CardTitle>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="focus:outline-none">
                          <Info className="w-4 h-4 text-gray-300 hover:text-white transition-colors" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-background/80 backdrop-blur-sm text-foreground border-border">
                        <div className="text-sm">
                          <h4 className="font-bold mb-2">Acceptable Parameter Ranges</h4>
                          <ul className="list-disc list-inside space-y-1">
                            <li>
                              <strong>Temperature:</strong>{" "}
                              {PARAMETER_RANGES.temp.min}-{PARAMETER_RANGES.temp.max} °C
                            </li>
                            <li>
                              <strong>Turbidity:</strong>{" "}
                              {PARAMETER_RANGES.turbidity.min}-{PARAMETER_RANGES.turbidity.max} NTU
                            </li>
                            <li>
                              <strong>pH Level:</strong>{" "}
                              {PARAMETER_RANGES.ph.min}-{PARAMETER_RANGES.ph.max}
                            </li>
                          </ul>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <CardDescription className="text-gray-200 text-xs sm:text-sm">
                    Real-time sensor readings from your system.
                  </CardDescription>
                </div>

                <div className="p-3 space-y-2 bg-black/40 backdrop-blur-sm rounded-lg shadow-lg w-auto self-end sm:self-start">
                  {error && (
                    <p className="text-xs text-red-300 mb-2 flex items-center gap-2">
                      <WifiOff className="w-4 h-4" />
                      {error}
                    </p>
                  )}
                  {waterQualityData.map((param) => (
                    <div
                      key={param.id}
                      className="flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-2">
                        <param.Icon className="w-4 h-4 text-blue-300" />
                        <p className="text-xs font-medium text-gray-100">
                          {param.label}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-white">
                        {param.value}
                        {param.unit && (
                          <span className="text-xs ml-1 font-medium">{param.unit}</span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {!isLoading && (
                <div
                  className={cn(
                    "flex items-center gap-2 px-3 py-1 text-xs rounded-full font-medium self-start mt-3 backdrop-blur-sm",
                    waterStatus.isSafe
                      ? "bg-blue-500/80 text-white"
                      : "bg-red-600/80 text-white"
                  )}
                >
                  <waterStatus.Icon className="w-3 h-3" />
                  <span>{waterStatus.message}</span>
                </div>
              )}
            </div>
          </>
        )}
      </TooltipProvider>
    </Card>
  );
}
