import { useState } from "react";
import { useGetControlTower, usePerformControlTowerAction, useResetControlTower, getGetControlTowerQueryKey, ResetInputScope } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, SkipForward, RotateCcw, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

export default function ScenariosPage() {
  const { data: ct, isLoading } = useGetControlTower();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const performAction = usePerformControlTowerAction();
  const resetDemo = useResetControlTower();

  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

  if (isLoading || !ct) {
    return <div className="p-8 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-[400px] w-full" /></div>;
  }

  const { scenarios, meta } = ct;

  const handleStartScenario = (id: string) => {
    setActiveScenarioId(id);
    resetDemo.mutate({
      data: { scope: ResetInputScope.scenario, scenarioId: id }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetControlTowerQueryKey() });
        toast({ title: "Scenario Initialized", description: "Demo state reset for this scenario." });
      }
    });
  };

  const handleAdvanceStep = (id: string) => {
    performAction.mutate({
      data: { action: 'scenario:advance', scenarioId: id }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetControlTowerQueryKey() });
        toast({ title: "Step Advanced" });
      }
    });
  };

  const isDemoActive = meta.guidedDemo;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Guided Demo Scenarios</h2>
        <p className="text-muted-foreground">Pre-configured story paths for presenter playback.</p>
      </div>

      {isDemoActive && (
        <Card className="bg-primary/5 border-primary/20 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <PlayCircle className="h-5 w-5 text-primary" /> Active Playback Mode
                </CardTitle>
                <CardDescription className="mt-1">
                  Currently running: {meta.currentScenario}
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => resetDemo.mutate({ data: { scope: ResetInputScope.demo } }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetControlTowerQueryKey() }); setActiveScenarioId(null); }})}
              >
                <RotateCcw className="h-4 w-4 mr-2" /> Exit Demo
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scenarios.map((scenario) => {
          const isActive = activeScenarioId === scenario.id || meta.currentScenario === scenario.name;
          const progress = scenario.steps.length > 0 ? (scenario.currentStep / scenario.steps.length) * 100 : 0;
          
          return (
            <Card key={scenario.id} className={`flex flex-col ${isActive ? 'border-primary shadow-md ring-1 ring-primary/20' : ''}`}>
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="font-mono text-[10px]">{scenario.project}</Badge>
                  {scenario.status === 'Completed' && <Badge variant="outline" className="text-success border-success bg-success/5"><CheckCircle2 className="h-3 w-3 mr-1" /> Done</Badge>}
                </div>
                <CardTitle className="text-lg">{scenario.name}</CardTitle>
                <CardDescription className="line-clamp-2 min-h-[40px]">{scenario.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                {isActive ? (
                  <div className="space-y-3">
                    <div className="text-sm font-medium">Progress</div>
                    <Progress value={progress} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      Step {scenario.currentStep} of {scenario.steps.length}
                    </div>
                    <div className="bg-muted p-3 rounded-md text-sm mt-4 min-h-[80px]">
                      {scenario.currentStep < scenario.steps.length ? (
                        <>
                          <div className="font-medium mb-1">Next Step:</div>
                          <div className="text-muted-foreground">{scenario.steps[scenario.currentStep]}</div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-success">
                          <CheckCircle2 className="h-6 w-6 mb-1" />
                          <span>Scenario Complete</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 mt-4 opacity-70">
                    <div className="text-sm font-medium">Steps:</div>
                    <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                      {scenario.steps.slice(0, 3).map((step, i) => <li key={i}>{step}</li>)}
                      {scenario.steps.length > 3 && <li>...and {scenario.steps.length - 3} more</li>}
                    </ul>
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-4 border-t bg-muted/10 mt-auto">
                {isActive ? (
                  <Button 
                    className="w-full" 
                    onClick={() => handleAdvanceStep(scenario.id)}
                    disabled={scenario.currentStep >= scenario.steps.length}
                  >
                    <SkipForward className="mr-2 h-4 w-4" /> Advance Step
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" onClick={() => handleStartScenario(scenario.id)}>
                    <PlayCircle className="mr-2 h-4 w-4" /> Start Scenario
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}