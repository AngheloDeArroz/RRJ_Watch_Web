
"use client";

import { useState, useEffect, type ComponentProps } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Droplets, Power, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";

type PhBalancerCardProps = ComponentProps<typeof Card>;

export function PhBalancerCard({ className, ...props }: PhBalancerCardProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPhAutomationEnabled, setIsPhAutomationEnabled] = useState(false);

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
            setIsPhAutomationEnabled(data.phBalancerEnabled === true);
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
    const fieldToUpdate = { phBalancerEnabled: value };
    const successMessage = `Automated pH balancer has been ${value ? 'enabled' : 'disabled'}.`;
    
    try {
        await updateDoc(settingsDocRef, fieldToUpdate);
        toast({ title: "Success", description: successMessage });
    } catch (err) {
        console.error(`Error updating pH toggle:`, err);
        toast({ variant: "destructive", title: "Update Failed", description: "Could not update the setting." });
    }
  };

  return (
    <Card className={cn("shadow-lg", className)} {...props}>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2"><Droplets className="w-6 h-6 text-primary"/>pH Balancer</CardTitle>
        <CardDescription>Manage automated pH balancing.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                <AlertTriangle className="w-5 h-5"/> {error}
            </div>
        )}
        
        <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-md">
            <Label htmlFor="ph-automation-toggle" className="flex items-center gap-2 text-sm font-medium">
                <Power className="w-5 h-5 text-primary" />
                System Status
            </Label>
            {isLoading ? <Skeleton className="h-6 w-11" /> : (
                <Switch
                    id="ph-automation-toggle"
                    checked={isPhAutomationEnabled}
                    onCheckedChange={handleToggleChange}
                    aria-label="Toggle pH automation"
                    disabled={!!error}
                />
            )}
        </div>
        { !isLoading &&
            <p className="text-xs text-center text-muted-foreground pt-1">
                {isPhAutomationEnabled 
                    ? "System will dispense solution to maintain optimal pH."
                    : "Balancer is off. Manual monitoring is required."
                }
            </p>
        }
      </CardContent>
    </Card>
  );
}
