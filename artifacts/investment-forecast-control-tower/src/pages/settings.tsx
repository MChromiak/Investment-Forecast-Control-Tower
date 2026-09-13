import { useGetControlTower, useResetControlTower, getGetControlTowerQueryKey, ResetInputScope } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Settings, RotateCcw, AlertTriangle, Save, Globe, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { data: ct, isLoading } = useGetControlTower();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const resetDemo = useResetControlTower();

  if (isLoading || !ct) {
    return <div className="p-8 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-[400px] w-full" /></div>;
  }

  const { config, meta } = ct;

  const handleFullReset = () => {
    resetDemo.mutate({
      data: { scope: ResetInputScope.demo }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetControlTowerQueryKey() });
        toast({ title: "Demo Reset Complete", description: "All data has been restored to factory defaults." });
      }
    });
  };

  const handleSaveSettings = () => {
    // Simulated save
    toast({ title: "Settings Saved", description: "Configuration updated successfully." });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configuration</h2>
        <p className="text-muted-foreground">Illustrative thresholds, routing, and reset controls.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-4 w-4" /> Regional Settings
            </CardTitle>
            <CardDescription>Global parameters for this workspace</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Active Period</Label>
              <Input value={meta.activePeriod} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Allowed Currency</Label>
              <Input value={config.allowedCurrency} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Default Overhead Rate (%)</Label>
              <Input defaultValue={config.overheadRate.toString()} type="number" />
            </div>
            <div className="flex items-center justify-between mt-4 p-3 bg-muted/30 rounded-md border">
              <div>
                <Label className="text-sm font-medium">Strict SAC Validation</Label>
                <p className="text-xs text-muted-foreground">Require all fields before submission</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4">
            <Button onClick={handleSaveSettings} className="ml-auto">
              <Save className="h-4 w-4 mr-2" /> Save Changes
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" /> Exception Thresholds
            </CardTitle>
            <CardDescription>Rules that trigger automated exceptions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(config.thresholds).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                <div className="flex items-center gap-2">
                  <Input defaultValue={value as string} />
                  <Badge variant="outline" className="shrink-0 bg-background">{typeof value === 'number' && key.toLowerCase().includes('percent') ? '%' : 'GBP'}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter className="border-t pt-4">
            <Button onClick={handleSaveSettings} className="ml-auto">
              <Save className="h-4 w-4 mr-2" /> Update Thresholds
            </Button>
          </CardFooter>
        </Card>

        <Card className="md:col-span-2 border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" /> Danger Zone
            </CardTitle>
            <CardDescription>Actions that cannot be undone</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-background border rounded-md">
              <div>
                <div className="font-semibold text-sm">Factory Reset Demo Data</div>
                <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                  This will wipe all current modifications, approvals, exceptions, and audit logs. 
                  The environment will be restored to its initial un-actioned state for {meta.activePeriod}.
                </p>
              </div>
              <Button variant="destructive" onClick={handleFullReset} className="shrink-0">
                <RotateCcw className="h-4 w-4 mr-2" /> Full Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}