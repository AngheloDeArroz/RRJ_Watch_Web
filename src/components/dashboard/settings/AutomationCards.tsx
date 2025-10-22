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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock,
  Power,
  X,
  AlertTriangle,
  Weight,
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
    .min(1, "Grams must be at least 1.")
    .max(500, "Grams cannot exceed 500."),
});
type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

export function AutomationControlCard({
  className,
  ...props
}: ComponentProps<typeof Card>) {
  const { toast } = useToast();

  const [feedingLoading, setFeedingLoading] = useState(true);
  const [feedingError, setFeedingError] = useState<string | null>(null);
  const [feedingEnabled, setFeedingEnabled] = useState(false);
  const [schedules, setSchedules] = useState([
    { id: "feedingTime1", time: "", gramsId: "feedingGrams1", grams: 0 },
    { id: "feedingTime2", time: "", gramsId: "feedingGrams2", grams: 0 },
  ]);
  const [editingSchedule, setEditingSchedule] = useState<any | null>(null);
  const [feedingLastTriggered, setFeedingLastTriggered] =
    useState<Timestamp | null>(null);

  const [phLoading, setPhLoading] = useState(true);
  const [phError, setPhError] = useState<string | null>(null);
  const [phEnabled, setPhEnabled] = useState(false);
  const [phLastTriggered, setPhLastTriggered] =
    useState<Timestamp | null>(null);

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: { time: "", grams: 0 },
  });

  const formatTime = (t: any) =>
    t instanceof Timestamp ? format(t.toDate(), "hh:mm a") : "";

  useEffect(() => {
    const statusRef = doc(db, "settings", "status");
    const unsubStatus = onSnapshot(
      statusRef,
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setFeedingEnabled(d.feedingEnabled === true);
          setPhEnabled(d.phBalancerEnabled === true);
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
          setFeedingError(null);
          setPhError(null);
        } else {
          setFeedingError("Settings not found.");
          setPhError("Settings not found.");
        }
        setFeedingLoading(false);
        setPhLoading(false);
      },
      (e) => {
        console.error(e);
        setFeedingError("Failed to fetch settings.");
        setPhError("Failed to fetch settings.");
        setFeedingLoading(false);
        setPhLoading(false);
      }
    );

    const triggeredRef = doc(db, "settings", "triggered");
    const unsubTriggered = onSnapshot(triggeredRef, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setFeedingLastTriggered(d.feedingLastTriggered ?? null);
        setPhLastTriggered(d.phLastTriggered ?? null);
      }
    });

    return () => {
      unsubStatus();
      unsubTriggered();
    };
  }, []);

  const toggleFeeding = async (val: boolean) => {
    const ref = doc(db, "settings", "status");
    const updates: any = { feedingEnabled: val };
    if (!val) {
      Object.assign(updates, {
        feedingTime1: deleteField(),
        feedingGrams1: deleteField(),
        feedingTime2: deleteField(),
        feedingGrams2: deleteField(),
      });
    }
    await updateDoc(ref, updates);
    toast({
      title: "Success",
      description: val
        ? "Feeding enabled."
        : "Feeding disabled and schedules cleared.",
    });
  };

  const openEditDialog = (schedule: any) => {
    setEditingSchedule(schedule);
    let t24 = "";
    if (schedule.time) {
      const [time, mod] = schedule.time.split(" ");
      let [h, m] = time.split(":");
      if (h === "12") h = "00";
      if (mod === "PM") h = (parseInt(h) + 12).toString();
      t24 = `${h.padStart(2, "0")}:${m}`;
    }
    form.reset({ time: t24, grams: schedule.grams });
  };

  const saveSchedule: SubmitHandler<ScheduleFormValues> = async (data) => {
    if (!editingSchedule) return;
    const [h, m] = data.time.split(":").map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    const t12 = format(date, "hh:mm a");
    const ref = doc(db, "settings", "status");
    const updates = {
      [editingSchedule.id]: Timestamp.fromDate(date),
      [editingSchedule.gramsId]: data.grams,
    };
    await updateDoc(ref, updates);
    toast({
      title: "Updated",
      description: `Feeding at ${t12} for ${data.grams}g.`,
    });
    setEditingSchedule(null);
  };

  const clearSchedule = async (s: any, e: any) => {
    e.stopPropagation();
    const ref = doc(db, "settings", "status");
    await updateDoc(ref, {
      [s.id]: deleteField(),
      [s.gramsId]: deleteField(),
    });
    toast({ title: "Cleared", description: "Schedule removed." });
  };

  const togglePhBalancer = async (val: boolean) => {
    const ref = doc(db, "settings", "status");
    await updateDoc(ref, { phBalancerEnabled: val });
    toast({
      title: "Success",
      description: val
        ? "pH balancer enabled."
        : "pH balancer disabled.",
    });
  };

  return (
    <div className="flex-1 w-full h-full p-4 md:p-6">
      <Card
        className={cn(
          "flex flex-col h-full bg-card/40 backdrop-blur-md rounded-2xl shadow-md p-6",
          "text-sm md:text-base lg:text-lg xl:text-xl transition-all duration-300",
          className
        )}
        {...props}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl md:text-2xl font-semibold">
            <Clock className="w-6 h-6 md:w-7 md:h-7 text-primary" />
            Automation Controls
          </CardTitle>
          <CardDescription className="text-sm md:text-base">
            Manage automated feeding and pH balancing systems.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto pr-2">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Feeding Section */}
            <div className="flex-1">
              <h3 className="text-base md:text-lg font-semibold flex items-center gap-2 mb-2">
                <Settings className="w-5 h-5 text-primary" /> Automated Feeding
              </h3>

              {feedingError && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5" /> {feedingError}
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-md">
                <Label className="flex items-center gap-2 text-sm md:text-base font-medium">
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

              {feedingEnabled && !feedingLoading && (
                <div className="space-y-3 pt-3">
                  {schedules.map((s, i) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-secondary/50 cursor-pointer transition-colors"
                      onClick={() => openEditDialog(s)}
                    >
                      <div>
                        <p className="font-medium text-sm md:text-base">
                          Schedule {i + 1}
                        </p>
                        {s.time ? (
                          <p className="text-xs md:text-sm text-muted-foreground">
                            <Clock className="inline w-3 h-3 mr-1" /> {s.time}{" "}
                            <Weight className="inline w-3 h-3 ml-3 mr-1" />{" "}
                            {s.grams > 0 ? `${s.grams}g` : "Not set"}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            Not set
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-8 w-8 flex items-center justify-center">
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </div>
                        {s.time && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => clearSchedule(s, e)}
                            className="h-8 w-8 text-destructive/70 hover:text-destructive"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {feedingLastTriggered && (
                <p className="text-xs text-muted-foreground mt-2">
                  Last triggered:{" "}
                  {format(feedingLastTriggered.toDate(), "PPpp")}
                </p>
              )}
            </div>

            {/* Vertical Separator */}
            <div className="hidden md:block w-px bg-border" />

            {/* pH Balancer Section */}
            <div className="flex-1">
              <h3 className="text-base md:text-lg font-semibold flex items-center gap-2 mb-2">
                <Droplets className="w-5 h-5 text-primary" /> pH Balancer
              </h3>

              {phError && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5" /> {phError}
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-md">
                <Label className="flex items-center gap-2 text-sm md:text-base font-medium">
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

              {!phLoading && (
                <p className="text-xs md:text-sm text-center text-muted-foreground pt-2">
                  {phEnabled
                    ? "System maintains optimal pH automatically."
                    : "Balancer is off. Manual monitoring is required."}
                </p>
              )}

              {phLastTriggered && (
                <p className="text-xs text-muted-foreground text-center mt-1">
                  Last triggered: {format(phLastTriggered.toDate(), "PPpp")}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={!!editingSchedule}
        onOpenChange={(o) => !o && setEditingSchedule(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Feeding Schedule</DialogTitle>
            <DialogDescription>
              Set the time and amount for this schedule.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(saveSchedule)}
              className="space-y-4 py-4"
            >
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
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
                    <FormControl>
                      <Input type="number" placeholder="e.g. 5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Cancel
                  </Button>
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
