
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
import { Clock, Power, X, AlertTriangle, Weight, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, deleteField, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

type AutomatedFeedingCardProps = ComponentProps<typeof Card>;

interface Schedule {
  id: 'feedingTime1' | 'feedingTime2';
  time: string;
  gramsId: 'feedingGrams1' | 'feedingGrams2';
  grams: number;
}

const formatTimeFromTimestamp = (timestampInput: unknown): string => {
  if (timestampInput instanceof Timestamp) {
    return format(timestampInput.toDate(), "hh:mm a");
  }
  return "";
};

const scheduleFormSchema = z.object({
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Please enter a valid time." }),
  grams: z.coerce.number().min(1, "Grams must be at least 1.").max(500, "Grams cannot exceed 500."),
});

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

export function AutomatedFeedingCard({ className, ...props }: AutomatedFeedingCardProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAutomatedFeedingEnabled, setIsAutomatedFeedingEnabled] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([
    { id: "feedingTime1", time: "", gramsId: "feedingGrams1", grams: 0 },
    { id: "feedingTime2", time: "", gramsId: "feedingGrams2", grams: 0 },
  ]);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: { time: "", grams: 0 },
  });

  useEffect(() => {
    if (!db) {
        setError("Firebase not configured.");
        setIsLoading(false);
        return;
    }
    const settingsDocRef = doc(db, "settings", "status");
    const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setIsAutomatedFeedingEnabled(data.feedingEnabled === true);
            setSchedules([
                { id: 'feedingTime1', time: formatTimeFromTimestamp(data.feedingTime1), gramsId: 'feedingGrams1', grams: data.feedingGrams1 ?? 0 },
                { id: 'feedingTime2', time: formatTimeFromTimestamp(data.feedingTime2), gramsId: 'feedingGrams2', grams: data.feedingGrams2 ?? 0 }
            ]);
            setError(null);
        } else {
            setError("Settings not found.");
        }
        setIsLoading(false);
    }, (e: any) => {
        console.error("Error fetching settings:", e);
        setError("Failed to fetch settings.");
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleToggleChange = async (value: boolean) => {
    if (!db || error) {
        toast({ variant: "destructive", title: "Error", description: "Cannot change setting due to an error." });
        return;
    }
    const settingsDocRef = doc(db, "settings", "status");
    const fieldToUpdate: { [key: string]: any } = { feedingEnabled: value };
    let successMessage = `Automated feeding has been ${value ? 'enabled' : 'disabled'}.`;
    
    if (!value) { // If disabling, also clear schedules
        fieldToUpdate.feedingTime1 = deleteField();
        fieldToUpdate.feedingGrams1 = deleteField();
        fieldToUpdate.feedingTime2 = deleteField();
        fieldToUpdate.feedingGrams2 = deleteField();
        successMessage = "Automated feeding disabled and schedules cleared.";
    }
    
    try {
        await updateDoc(settingsDocRef, fieldToUpdate);
        toast({ title: "Success", description: successMessage });
    } catch (err) {
        console.error(`Error updating feeding toggle:`, err);
        toast({ variant: "destructive", title: "Update Failed", description: "Could not update the setting." });
    }
  };

  const handleOpenEditDialog = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    let time24h = "";
    if (schedule.time) {
        const [time, modifier] = schedule.time.split(' ');
        let [hours, minutes] = time.split(':');
        if (hours === '12') hours = '00';
        if (modifier === 'PM') hours = (parseInt(hours, 10) + 12).toString();
        time24h = `${hours.padStart(2, '0')}:${minutes}`;
    }
    form.reset({ time: time24h, grams: schedule.grams || "" as any });
  };
  
  const handleScheduleUpdate: SubmitHandler<ScheduleFormValues> = async (data) => {
    if (!editingSchedule) return;

    const [hours, minutes] = data.time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    const newTime12h = format(date, "hh:mm a");

    if (schedules.some(s => s.id !== editingSchedule.id && s.time === newTime12h && s.time)) {
        form.setError("time", { type: "manual", message: "Schedules cannot have the same time." });
        return;
    }

    const settingsDocRef = doc(db, "settings", "status");
    const fieldToUpdate = {
        [editingSchedule.id]: Timestamp.fromDate(date),
        [editingSchedule.gramsId]: data.grams,
    };

    try {
        await updateDoc(settingsDocRef, fieldToUpdate);
        toast({ title: "Schedule Updated", description: `Feeding set to ${newTime12h} for ${data.grams}g.` });
        setEditingSchedule(null);
    } catch (err) {
        console.error("Error updating schedule:", err);
        toast({ variant: "destructive", title: "Update Failed", description: "Could not save the schedule." });
    }
  };

  const handleScheduleClear = async (schedule: Schedule, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!db || error) {
        toast({ variant: "destructive", title: "Error", description: "Cannot update schedule due to an error." });
        return;
    }
    const settingsDocRef = doc(db, "settings", "status");
    const fieldsToDelete = { [schedule.id]: deleteField(), [schedule.gramsId]: deleteField() };
     try {
        await updateDoc(settingsDocRef, fieldsToDelete);
        toast({ title: "Schedule Cleared", description: "The feeding schedule has been cleared." });
    } catch (err) {
        console.error("Error clearing schedule:", err);
        toast({ variant: "destructive", title: "Update Failed", description: "Could not clear schedule." });
    }
  };

  return (
    <>
    <Card className={cn("shadow-lg", className)} {...props}>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2"><Clock className="w-6 h-6 text-primary"/>Automated Feeding</CardTitle>
        <CardDescription>Manage feeding schedules and system status.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-center gap-2"><AlertTriangle className="w-5 h-5"/> {error}</div>}
        
        <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-md">
            <Label htmlFor="automated-feeding-toggle" className="flex items-center gap-2 text-sm font-medium"><Power className="w-5 h-5 text-primary" />System Status</Label>
            {isLoading ? <Skeleton className="h-6 w-11" /> : <Switch id="automated-feeding-toggle" checked={isAutomatedFeedingEnabled} onCheckedChange={handleToggleChange} aria-label="Toggle automated feeding" disabled={!!error}/>}
        </div>

        {isAutomatedFeedingEnabled && !isLoading && (
          <div className="space-y-3 pt-2">
            {schedules.map((schedule, index) => (
                <div key={schedule.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-secondary/50 cursor-pointer transition-colors" onClick={() => handleOpenEditDialog(schedule)}>
                   <div>
                     <p className="font-medium text-sm">Schedule {index + 1}</p>
                     {schedule.time ? (
                        <p className="text-xs text-muted-foreground"><Clock className="inline w-3 h-3 mr-1"/> {schedule.time}<Weight className="inline w-3 h-3 ml-3 mr-1"/> {schedule.grams > 0 ? `${schedule.grams}g` : 'Grams not set' }</p>
                     ) : <p className="text-sm text-muted-foreground italic">Not set</p>}
                   </div>
                   <div className="flex items-center gap-1">
                      <div className="h-8 w-8 flex items-center justify-center"><Pencil className="w-4 h-4 text-muted-foreground"/></div>
                      {schedule.time && <Button variant="ghost" size="icon" onClick={(e) => handleScheduleClear(schedule, e)} className="h-8 w-8 text-destructive/70 hover:text-destructive" aria-label="Clear schedule"><X className="w-4 h-4"/></Button>}
                   </div>
                </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>

    <Dialog open={!!editingSchedule} onOpenChange={(isOpen) => !isOpen && setEditingSchedule(null)}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Edit Feeding Schedule</DialogTitle>
                <DialogDescription>Set the time and amount for this feeding schedule.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleScheduleUpdate)} className="space-y-4 py-4">
                    <FormField control={form.control} name="time" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Time</FormLabel>
                            <FormControl><Input type="time" {...field} className="w-full" /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="grams" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Amount (grams)</FormLabel>
                            <FormControl><Input type="number" placeholder="e.g., 5" {...field} className="w-full"/></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                        <Button type="submit" disabled={form.formState.isSubmitting}>Save Schedule</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
    </>
  );
}
