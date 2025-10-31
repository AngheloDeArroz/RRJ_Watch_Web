"use client";

import { useState, useEffect, type ComponentProps } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock,
  Power,
  Pencil,
  Droplets,
  Settings,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import {
  doc,
  onSnapshot,
  updateDoc,
  deleteField,
  Timestamp,
} from "firebase/firestore";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const scheduleFormSchema = z.object({
  time: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
      message: "Please enter a valid time.",
    }),
  grams: z
    .coerce.number()
    .min(5, "Minimum 5 grams required.")
    .max(400, "Maximum allowed is 400 grams.")
    .refine((val) => val % 5 === 0, {
      message: "Grams must be in multiples of 5.",
    }),
});

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

export function AutomationControlCard({
  className,
  ...props
}: ComponentProps<typeof Card>) {
  const { toast } = useToast();

  const [feedingEnabled, setFeedingEnabled] = useState(false);
  const [feedingLoading, setFeedingLoading] = useState(true);
  const [phEnabled, setPhEnabled] = useState(false);
  const [phLoading, setPhLoading] = useState(true);
  const [foodLevel, setFoodLevel] = useState<number>(0);
  const [phSolutionLevel, setPhSolutionLevel] = useState<number>(0);

  const [schedules, setSchedules] = useState([
    { id: "feedingTime1", time: "", gramsId: "feedingGrams1", grams: 0 },
    { id: "feedingTime2", time: "", gramsId: "feedingGrams2", grams: 0 },
  ]);
  const [editingSchedule, setEditingSchedule] = useState<any | null>(null);

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: { time: "", grams: 5 },
  });

  const formatTime = (t: any) =>
    t instanceof Timestamp ? format(t.toDate(), "hh:mm a") : "";

  // Firestore listeners
  useEffect(() => {
    const statusRef = doc(db, "settings", "status");
    const unsubSettings = onSnapshot(statusRef, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setFeedingEnabled(d.feedingEnabled ?? false);
        setPhEnabled(d.phBalancerEnabled ?? false);
        setSchedules([
          {
            id: "feedingTime1",
            time: formatTime(d.feedingTime1),
            gramsId: "feedingGrams1",
            grams: d.feedingGrams1 ?? 0,
          },
          {
            id: "feedingTime2",
            time: formatTime(d.feedingTime2),
            gramsId: "feedingGrams2",
            grams: d.feedingGrams2 ?? 0,
          },
        ]);
      }
      setFeedingLoading(false);
      setPhLoading(false);
    });

    const levelsRef = doc(db, "container-levels", "status");
    const unsubLevels = onSnapshot(levelsRef, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setFoodLevel(d.foodLevel ?? 0);
        setPhSolutionLevel(d.phSolutionLevel ?? 0);
      }
    });

    return () => {
      unsubSettings();
      unsubLevels();
    };
  }, []);

  const toggleFeeding = async (val: boolean) => {
    await updateDoc(doc(db, "settings", "status"), {
      feedingEnabled: val,
      ...(val
        ? {}
        : {
            feedingTime1: deleteField(),
            feedingTime2: deleteField(),
            feedingGrams1: deleteField(),
            feedingGrams2: deleteField(),
          }),
    });
    toast({
      title: val ? "Feeding enabled" : "Feeding disabled",
    });
  };

  const togglePhBalancer = async (val: boolean) => {
    if (val && phSolutionLevel <= 0) {
      toast({
        title: "Please fill your pH balancer with solution",
        variant: "destructive",
      });
      return;
    }
    await updateDoc(doc(db, "settings", "status"), {
      phBalancerEnabled: val,
    });
    toast({
      title: val ? "pH balancer enabled" : "pH balancer disabled",
    });
  };

  const openEditDialog = (s: any) => {
    setEditingSchedule(s);
    let t24 = "";
    if (s.time) {
      const [time, mod] = s.time.split(" ");
      let [h, m] = time.split(":");
      if (h === "12") h = "00";
      if (mod === "PM") h = (parseInt(h) + 12).toString();
      t24 = `${h.padStart(2, "0")}:${m}`;
    }
    form.reset({ time: t24, grams: s.grams });
  };

  const saveSchedule: SubmitHandler<ScheduleFormValues> = async (data) => {
    if (!editingSchedule) return;

    const currentFood = (foodLevel / 100) * 400;
    if (currentFood <= 0) {
      toast({
        title: "Please fill your food container",
        variant: "destructive",
      });
      return;
    }

    // Calculate total grams after this edit
    const totalPlanned = schedules.reduce((sum, s) => {
      if (s.id === editingSchedule.id) return sum + data.grams; // new grams for edited one
      return sum + (s.grams || 0);
    }, 0);

    if (totalPlanned > currentFood) {
      toast({
        title: `Set less. The total feeding amount (${totalPlanned}g) exceeds container's food (${currentFood.toFixed(0)}g).`,
        variant: "destructive",
      });
      return;
    }

    const [h, m] = data.time.split(":").map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);

    // Check for duplicate time
    const t24 = `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}`;
    const isDuplicate = schedules.some(
      (s) =>
        s.id !== editingSchedule.id &&
        s.time &&
        (() => {
          const [otime, mod] = s.time.split(" ");
          let [oh, om] = otime.split(":");
          if (oh === "12") oh = "00";
          if (mod === "PM") oh = (parseInt(oh) + 12).toString();
          return `${oh.padStart(2, "0")}:${om}` === t24;
        })()
    );

    if (isDuplicate) {
      form.setError("time", {
        type: "manual",
        message: "Cannot set two feeding schedules at the same time.",
      });
      return;
    }

    const t12 = format(date, "hh:mm a");
    await updateDoc(doc(db, "settings", "status"), {
      [editingSchedule.id]: Timestamp.fromDate(date),
      [editingSchedule.gramsId]: data.grams,
    });

    toast({
      title: "Schedule updated",
      description: `Feeding at ${t12} for ${data.grams}g.`,
    });
    setEditingSchedule(null);
  };

  return (
    <div className="w-full">
      <Card
        className={cn(
          "w-full h-full bg-card/40 backdrop-blur-md rounded-2xl shadow-md p-6",
          className
        )}
        {...props}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl font-semibold">
            <Clock className="w-6 h-6 text-primary" />
            Automation Controls
          </CardTitle>
          <CardDescription>
            Manage automated feeding and pH balancing systems.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex gap-6 flex-col md:flex-row">
          {/* Feeding Section */}
          <div className="flex-1">
            <h3 className="font-semibold flex items-center gap-2 mb-2">
              <Settings className="w-5 h-5 text-primary" /> Automated Feeding
            </h3>

            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-md">
              <Label className="flex items-center gap-2">
                <Power className="w-5 h-5 text-primary" /> System Status
              </Label>
              {feedingLoading ? (
                <Skeleton className="h-6 w-11" />
              ) : (
                <Switch
                  checked={feedingEnabled}
                  onCheckedChange={toggleFeeding}
                />
              )}
            </div>

            {feedingEnabled &&
              schedules.map((s, i) => (
                <div
                  key={s.id}
                  className="flex justify-between items-center p-3 mt-3 border rounded-md hover:bg-secondary/50 cursor-pointer"
                  onClick={() => openEditDialog(s)}
                >
                  <div>
                    <p className="font-medium">Schedule {i + 1}</p>
                    <p className="text-sm text-muted-foreground">
                      {s.time || "Not set"}{" "}
                      {s.grams ? `• ${s.grams}g` : "• Not set"}
                    </p>
                  </div>
                  <Pencil className="w-4 h-4 text-muted-foreground" />
                </div>
              ))}
          </div>

          <div className="hidden md:block w-px bg-border" />

          {/* pH Balancer Section */}
          <div className="flex-1">
            <h3 className="font-semibold flex items-center gap-2 mb-2">
              <Droplets className="w-5 h-5 text-primary" /> pH Balancer
            </h3>

            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-md">
              <Label className="flex items-center gap-2">
                <Power className="w-5 h-5 text-primary" /> System Status
              </Label>
              {phLoading ? (
                <Skeleton className="h-6 w-11" />
              ) : (
                <Switch
                  checked={phEnabled}
                  onCheckedChange={togglePhBalancer}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Feeding Dialog */}
      <Dialog
        open={!!editingSchedule}
        onOpenChange={(o) => !o && setEditingSchedule(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Feeding Schedule</DialogTitle>
            <DialogDescription>
              Set the time and amount (grams).
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(saveSchedule)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <input
                        type="time"
                        {...field}
                        className="w-full p-2 rounded-md border"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="grams"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (grams)</FormLabel>
                    <Slider
                      min={5}
                      max={400}
                      step={5}
                      value={[field.value]}
                      onValueChange={(v) => field.onChange(v[0])}
                    />
                    <p className="text-sm text-center mt-2">{field.value}g</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
