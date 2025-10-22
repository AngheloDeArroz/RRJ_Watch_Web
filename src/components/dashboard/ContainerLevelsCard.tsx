"use client";

import { useState, useEffect, useRef, type ComponentProps } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Drumstick,
  FlaskConical,
  WifiOff,
  CalendarClock,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import {
  doc,
  onSnapshot,
  collection,
  query,
  orderBy,
  limit,
} from "firebase/firestore";

type ContainerLevelsCardProps = ComponentProps<typeof Card>;

export function ContainerLevelsCard({ className, ...props }: ContainerLevelsCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [foodLevel, setFoodLevel] = useState<number>(0);
  const [phSolutionLevel, setPhSolutionLevel] = useState<number>(0);
  const [foodDaysRemaining, setFoodDaysRemaining] = useState<number | null>(null);
  const [phDaysRemaining, setPhDaysRemaining] = useState<number | null>(null);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  const latestLevelsRef = useRef<{ foodLevel: number; phSolutionLevel: number } | null>(null);
  const recentHistoryRef = useRef<any[]>([]);

  useEffect(() => {
    if (!db) {
      setError("Firebase not configured.");
      setIsLoading(false);
      return;
    }

    const levelsDocRef = doc(db, "container-levels", "status");
    const historyCollectionRef = collection(db, "water-history");
    const historyQuery = query(historyCollectionRef, orderBy("timestamp", "desc"), limit(7));

    const safeDelta = (start: any, end: any) => {
      if (typeof start === "number" && typeof end === "number" && start > end) {
        return start - end;
      }
      return 0;
    };

    const recalcFromRefs = () => {
      try {
        const levels = latestLevelsRef.current;
        const history = recentHistoryRef.current;
        if (!levels || !history.length) {
          setFoodDaysRemaining(null);
          setPhDaysRemaining(null);
          return;
        }

        let totalFoodUsed = 0;
        let totalPhUsed = 0;
        let validFoodDays = 0;
        let validPhDays = 0;

        for (const entry of history) {
          const fUsed = safeDelta(entry.foodLevelStartOfDay, entry.foodLevelEndOfDay);
          if (fUsed > 0) {
            totalFoodUsed += fUsed;
            validFoodDays++;
          }
          const pUsed = safeDelta(entry.phSolutionLevelStartOfDay, entry.phSolutionLevelEndOfDay);
          if (pUsed > 0) {
            totalPhUsed += pUsed;
            validPhDays++;
          }
        }

        const avgFood = validFoodDays ? totalFoodUsed / validFoodDays : 0;
        const avgPh = validPhDays ? totalPhUsed / validPhDays : 0;

        const f = levels.foodLevel ?? 0;
        const p = levels.phSolutionLevel ?? 0;

        setFoodDaysRemaining(avgFood ? Math.max(0, Math.round(f / avgFood)) : null);
        setPhDaysRemaining(avgPh ? Math.max(0, Math.round(p / avgPh)) : null);
      } catch (err) {
        console.error(err);
      }
    };

    const unsub1 = onSnapshot(levelsDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const fl = Number(data.foodLevel ?? 0);
        const ph = Number(data.phSolutionLevel ?? 0);
        setFoodLevel(fl);
        setPhSolutionLevel(ph);
        latestLevelsRef.current = { foodLevel: fl, phSolutionLevel: ph };
        recalcFromRefs();
        setError(null);
      } else setError("Container data not found.");
      setIsLoading(false);
    });

    const unsub2 = onSnapshot(historyQuery, (snap) => {
      recentHistoryRef.current = snap.docs.map((d) => d.data());
      recalcFromRefs();
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const Wave = ({ color, percentage }: { color: string; percentage: number }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();
    const phaseRef = useRef(0);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const amplitude = 6;
      const wavelength = 120;
      const speed = 0.04;

      const draw = () => {
        if (!ctx) return;
        ctx.clearRect(0, 0, width, height);
        const waterLevel = height * (1 - percentage / 100);

        ctx.beginPath();
        for (let x = 0; x <= width; x++) {
          const y = waterLevel + Math.sin((x / wavelength) * 2 * Math.PI + phaseRef.current) * amplitude;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();

        ctx.fillStyle = color;
        ctx.fill();

        phaseRef.current += speed;
        requestRef.current = requestAnimationFrame(draw);
      };

      draw();
      return () => cancelAnimationFrame(requestRef.current!);
    }, [color, percentage]);

    return (
      <canvas
        ref={canvasRef}
        width={96}
        height={192}
        style={{
          borderRadius: "2rem",
          width: "96px",
          height: "192px",
          display: "block",
        }}
      />
    );
  };

  const Gauge = ({
    level,
    label,
    icon: Icon,
    daysRemaining,
    theme,
  }: {
    level: number;
    label: string;
    icon: React.ElementType;
    daysRemaining: number | null;
    theme: "orange" | "blue";
  }) => {
    const percentage = Math.min(Math.max(level, 0), 100);
    const color = theme === "orange" ? "#fb923c" : "#38bdf8";
    return (
      <div className="flex flex-col items-center gap-4 w-full">
        <div className="flex flex-col items-center gap-1 h-10">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-muted-foreground" />
            <p className="text-lg font-bold text-foreground">{percentage}%</p>
          </div>
        </div>

        <div className="relative w-24 h-48 rounded-[2rem] overflow-hidden shadow-md border-4 border-gray-400 bg-slate-50">
          <Wave color={color} percentage={percentage} />
        </div>

        <p className="text-sm font-medium text-foreground">{label}</p>

        <div className="p-2 rounded-lg w-full text-center bg-secondary/40 shadow-inner">
          <div className="flex justify-center items-center gap-1.5 mb-1 text-muted-foreground">
            <CalendarClock className="w-3 h-3" />
            <h4 className="text-xs font-medium">Est. Remaining</h4>
          </div>
          <div className="text-xl font-bold text-foreground">
            {daysRemaining === null ? "Not consumed" : `${daysRemaining} days`}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className={cn("shadow-lg bg-card/40 backdrop-blur-md", className)} {...props}>
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-primary" />
          Container Levels & Supply
        </CardTitle>
        <CardDescription>Live status and realtime consumption estimates.</CardDescription>
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
          <div className="grid grid-cols-2 gap-4 justify-items-center">
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
          <div className="grid grid-cols-2 gap-4 text-center justify-items-center">
            <Gauge
              level={foodLevel}
              label="Food Container"
              icon={Drumstick}
              daysRemaining={foodDaysRemaining}
              theme="orange"
            />
            <Gauge
              level={phSolutionLevel}
              label="pH Solution"
              icon={FlaskConical}
              daysRemaining={phDaysRemaining}
              theme="blue"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
