"use client";

import { useState, useEffect, type ComponentProps } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Power, X, AlertTriangle, Weight, Pencil, Droplets } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, deleteField, Timestamp } from "firebase/firestore";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

// -------------------- Schema --------------------
const scheduleFormSchema = z.object({
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Please enter a valid time." }),
  grams: z.coerce.number().min(1, "Grams must be at least 1.").max(500, "Grams cannot exceed 500."),
});
type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

// -------------------- Automated Feeding --------------------
export function AutomatedFeedingCard({ className, ...props }: ComponentProps<typeof Card>) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [schedules, setSchedules] = useState([
    { id: "feedingTime1", time: "", gramsId: "feedingGrams1", grams: 0 },
    { id: "feedingTime2", time: "", gramsId: "feedingGrams2", grams: 0 },
  ]);
  const [editingSchedule, setEditingSchedule] = useState<any | null>(null);

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: { time: "", grams: 0 },
  });

  useEffect(() => {
    const ref = doc(db, "settings", "status");
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setIsEnabled(d.feedingEnabled === true);
          setSchedules([
            { id: "feedingTime1", time: formatTime(d.feedingTime1), gramsId: "feedingGrams1", grams: d.feedingGrams1 ?? 0 },
            { id: "feedingTime2", time: formatTime(d.feedingTime2), gramsId: "feedingGrams2", grams: d.feedingGrams2 ?? 0 },
          ]);
          setError(null);
        } else setError("Settings not found.");
        setIsLoading(false);
      },
      (e) => {
        console.error(e);
        setError("Failed to fetch settings.");
        setIsLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const formatTime = (t: any) => (t instanceof Timestamp ? format(t.toDate(), "hh:mm a") : "");

  const toggleAutomation = async (val: boolean) => {
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
    toast({ title: "Success", description: val ? "Feeding enabled." : "Feeding disabled and schedules cleared." });
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
    toast({ title: "Updated", description: `Feeding at ${t12} for ${data.grams}g.` });
    setEditingSchedule(null);
  };

  const clearSchedule = async (s: any, e: any) => {
    e.stopPropagation();
    const ref = doc(db, "settings", "status");
    await updateDoc(ref, { [s.id]: deleteField(), [s.gramsId]: deleteField() });
    toast({ title: "Cleared", description: "Schedule removed." });
  };

  return (
    <>
      <Card className={cn("shadow-lg bg-card/40 backdrop-blur-md", className)} {...props}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Clock className="w-6 h-6 text-primary" /> Automated Feeding
          </CardTitle>
          <CardDescription>Manage feeding schedules and system status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> {error}
            </div>
          )}
          <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-md">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Power className="w-5 h-5 text-primary" /> System Status
            </Label>
            {isLoading ? <Skeleton className="h-6 w-11" /> : <Switch checked={isEnabled} onCheckedChange={toggleAutomation} />}
          </div>

          {isEnabled && !isLoading && (
            <div className="space-y-3 pt-2">
              {schedules.map((s, i) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-secondary/50 cursor-pointer transition-colors"
                  onClick={() => openEditDialog(s)}
                >
                  <div>
                    <p className="font-medium text-sm">Schedule {i + 1}</p>
                    {s.time ? (
                      <p className="text-xs text-muted-foreground">
                        <Clock className="inline w-3 h-3 mr-1" /> {s.time}{" "}
                        <Weight className="inline w-3 h-3 ml-3 mr-1" /> {s.grams > 0 ? `${s.grams}g` : "Not set"}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Not set</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-8 w-8 flex items-center justify-center">
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </div>
                    {s.time && (
                      <Button variant="ghost" size="icon" onClick={(e) => clearSchedule(s, e)} className="h-8 w-8 text-destructive/70 hover:text-destructive">
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingSchedule} onOpenChange={(o) => !o && setEditingSchedule(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Feeding Schedule</DialogTitle>
            <DialogDescription>Set the time and amount for this schedule.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(saveSchedule)} className="space-y-4 py-4">
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
    </>
  );
}

// -------------------- pH Balancer --------------------
export function PhBalancerCard({ className, ...props }: ComponentProps<typeof Card>) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const ref = doc(db, "settings", "status");
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setIsEnabled(d.phBalancerEnabled === true);
          setError(null);
        } else setError("Settings not found.");
        setIsLoading(false);
      },
      (e) => {
        console.error(e);
        setError("Failed to fetch settings.");
        setIsLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const toggleAutomation = async (val: boolean) => {
    const ref = doc(db, "settings", "status");
    await updateDoc(ref, { phBalancerEnabled: val });
    toast({ title: "Success", description: val ? "pH balancer enabled." : "pH balancer disabled." });
  };

  return (
    <Card className={cn("shadow-lg bg-card/40 backdrop-blur-md", className)} {...props}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Droplets className="w-6 h-6 text-primary" /> pH Balancer
        </CardTitle>
        <CardDescription>Manage automated pH balancing.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> {error}
          </div>
        )}
        <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-md">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Power className="w-5 h-5 text-primary" /> System Status
          </Label>
          {isLoading ? <Skeleton className="h-6 w-11" /> : <Switch checked={isEnabled} onCheckedChange={toggleAutomation} />}
        </div>
        {!isLoading && (
          <p className="text-xs text-center text-muted-foreground pt-1">
            {isEnabled ? "System maintains optimal pH automatically." : "Balancer is off. Manual monitoring is required."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
