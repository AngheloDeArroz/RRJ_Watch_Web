"use client";

import { useState, useEffect, type ComponentProps } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Drumstick, FlaskConical, WifiOff, CalendarClock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection, query, orderBy, limit, getDocs, type FirestoreError } from "firebase/firestore";

type ContainerLevelsCardProps = ComponentProps<typeof Card>;

export function ContainerLevelsCard({ className, ...props }: ContainerLevelsCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [foodLevel, setFoodLevel] = useState(0);
  const [phSolutionLevel, setPhSolutionLevel] = useState(0);
  const [foodDaysRemaining, setFoodDaysRemaining] = useState<number | null>(null);
  const [phDaysRemaining, setPhDaysRemaining] = useState<number | null>(null);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setError("Firebase not configured.");
      setIsLoading(false);
      return;
    }

    const levelsDocRef = doc(db, "container-levels", "status");
    const unsubscribeLevels = onSnapshot(
      levelsDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFoodLevel(data.foodLevel ?? 0);
          setPhSolutionLevel(data.phSolutionLevel ?? 0);
          setError(null);
        } else {
          setError("Container levels not found.");
        }
      },
      (e: FirestoreError) => {
        console.error("Error fetching container levels:", e);
        let message = "Failed to fetch container levels.";
        if (e.code === "unavailable") message = "You are offline. Levels may be out of sync.";
        setError(message);
        setIsLoading(false);
      }
    );

    const calculateEstimates = async () => {
      try {
        const levelsSnap = await getDocs(collection(db, "container-levels"));
        const currentData = levelsSnap.docs.find((d) => d.id === "status")?.data();
        const currentFoodLevel = currentData?.foodLevel ?? 0;
        const currentPhLevel = currentData?.phSolutionLevel ?? 0;

        const historyCollectionRef = collection(db, "water-history");
        const q = query(historyCollectionRef, orderBy("timestamp", "desc"), limit(1));
        const historySnapshot = await getDocs(q);

        if (historySnapshot.empty) {
          throw new Error("No historical data to calculate consumption.");
        }

        const latestHistory = historySnapshot.docs[0].data();

        const foodStart = latestHistory.foodLevelStartOfDay;
        const foodEnd = latestHistory.foodLevelEndOfDay;
        if (typeof foodStart === "number" && typeof foodEnd === "number") {
          const dailyFoodConsumption = foodStart - foodEnd;
          if (dailyFoodConsumption > 0) {
            setFoodDaysRemaining(Math.floor(currentFoodLevel / dailyFoodConsumption));
          } else {
            setFoodDaysRemaining(Infinity);
          }
        } else {
          setFoodDaysRemaining(null);
        }

        const phStart = latestHistory.phSolutionLevelStartOfDay;
        const phEnd = latestHistory.phSolutionLevelEndOfDay;
        if (typeof phStart === "number" && typeof phEnd === "number") {
          const dailyPhConsumption = phStart - phEnd;
          if (dailyPhConsumption > 0) {
            setPhDaysRemaining(Math.floor(currentPhLevel / dailyPhConsumption));
          } else {
            setPhDaysRemaining(Infinity);
          }
        } else {
          setPhDaysRemaining(null);
        }

        setCalculationError(null);
      } catch (err: any) {
        console.error("Error calculating supply estimates:", err);
        let message = "Could not calculate estimates.";
        if (err.code === "unavailable") message = "Offline, cannot calculate usage.";
        else if (err.message) message = err.message;
        setCalculationError(message);
      } finally {
        setIsLoading(false);
      }
    };

    calculateEstimates();
    return () => unsubscribeLevels();
  }, []);

  const getLevelColor = (level: number) => {
    if (level > 50) return "fill-green-500/80";
    if (level > 20) return "fill-yellow-500/80";
    return "fill-red-500/80";
  };

  const getPhLevelColor = (level: number) => {
    if (level > 50) return "fill-sky-500/80";
    if (level > 20) return "fill-indigo-500/80";
    return "fill-purple-500/80";
  };

  const Gauge = ({
    level,
    colorClass,
    label,
    icon: Icon,
    daysRemaining,
  }: {
    level: number;
    colorClass: string;
    label: string;
    icon: React.ElementType;
    daysRemaining: number | null;
  }) => {
    const fillHeight = 140 * (level / 100);
    const yOffset = 35 + (140 - fillHeight);

    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-muted-foreground" />
          <p className="text-lg font-bold text-foreground">{level}%</p>
        </div>

        {/* Bottle with simple loading bar fill */}
        <div className="relative w-28 h-48">
          <svg viewBox="0 0 100 180" className="w-full h-full drop-shadow-md">
            <defs>
              <clipPath id={`bottle-clip-${label}`}>
                <path d="M 25 25 L 25 35 Q 25 40 20 45 V 175 H 80 V 45 Q 75 40 75 35 L 75 25 Z" />
              </clipPath>
            </defs>

            {/* Background bottle outline */}
            <path
              d="M 25 25 L 25 35 Q 25 40 20 45 V 175 H 80 V 45 Q 75 40 75 35 L 75 25 Z"
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="2"
            />

            {/* Fill area */}
            <g clipPath={`url(#bottle-clip-${label})`}>
              <rect
                x="20"
                y={yOffset}
                width="60"
                height={fillHeight}
                className={cn(colorClass, "transition-all duration-700 ease-in-out rounded-t-sm")}
              />
            </g>
          </svg>
        </div>

        {/* Label & remaining days */}
        <p className="text-sm font-medium text-foreground">{label}</p>
        <div className="p-2 rounded-lg bg-secondary/40 shadow-inner w-full text-center">
          <div className="flex justify-center items-center gap-1.5 mb-1 text-muted-foreground">
            <CalendarClock className="w-3 h-3" />
            <h4 className="text-xs font-medium">Est. Remaining</h4>
          </div>
          <div className="text-xl font-bold text-foreground">
            {daysRemaining === null ? "?" : daysRemaining === Infinity ? "∞" : daysRemaining}
          </div>
          <p className="text-xs text-muted-foreground">
            {daysRemaining !== null && daysRemaining !== Infinity ? "days" : "Not consumed"}
          </p>
        </div>
      </div>
    );
  };

  return (
    <Card className={cn("shadow-lg", className)} {...props}>
      <CardHeader>
        <CardTitle className="font-headline">Container Levels & Supply</CardTitle>
        <CardDescription>Live status and estimated days left for supplies.</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {error && (
          <p className="text-sm text-destructive mb-4 flex items-center gap-2">
            <WifiOff className="w-4 h-4" />
            {error}
          </p>
        )}
        {calculationError && (
          <div className="mb-4 p-2 rounded-md bg-destructive/10 border border-destructive/50 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {calculationError}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 justify-items-center">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-3 w-full">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="w-28 h-48 rounded-t-lg" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-20 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-center justify-items-center">
            <Gauge
              level={foodLevel}
              colorClass={getLevelColor(foodLevel)}
              label="Food Container"
              icon={Drumstick}
              daysRemaining={foodDaysRemaining}
            />
            <Gauge
              level={phSolutionLevel}
              colorClass={getPhLevelColor(phSolutionLevel)}
              label="pH Solution"
              icon={FlaskConical}
              daysRemaining={phDaysRemaining}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
