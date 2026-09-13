import { useState } from "react";
import { useGetControlTower, usePerformControlTowerAction, getGetControlTowerQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, FileWarning, ArrowUpRight, Check, MessageSquare, ShieldAlert, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function ExceptionsPage() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const wbsFilter = searchParams.get("wbs");
  
  const { data: ct, isLoading } = useGetControlTower();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const performAction = usePerformControlTowerAction();
  
  const [actionDialog, setActionDialog] = useState<{ isOpen: boolean, type: string, exceptionId: string | null }>({ isOpen: false, type: "", exceptionId: null });
  const [actionReason, setActionReason] = useState("");

  if (isLoading || !ct) {
    return <div className="p-8 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-[400px] w-full" /></div>;
  }

  const { exceptions } = ct;
  
  const filteredExceptions = wbsFilter 
    ? exceptions.filter(e => e.wbs === wbsFilter)
    : exceptions;

  const handleActionSubmit = () => {
    if (!actionDialog.exceptionId) return;
    
    performAction.mutate({
      data: {
        action: actionDialog.type,
        exceptionId: actionDialog.exceptionId,
        reason: actionReason
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetControlTowerQueryKey() });
        toast({ title: "Action applied successfully" });
        setActionDialog({ isOpen: false, type: "", exceptionId: null });
        setActionReason("");
      }
    });
  };

  const clearFilter = () => {
    setLocation("/exceptions");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Exceptions Triage</h2>
          <p className="text-muted-foreground">Review auto-flagged variances, methodology changes, and VOWD risks.</p>
        </div>
        {wbsFilter && (
          <Button variant="outline" onClick={clearFilter} size="sm">
            Clear WBS Filter ({wbsFilter})
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-destructive/5 border-destructive/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-destructive" /> Critical Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {exceptions.filter(e => e.severity === 'Critical' && e.status === 'Open').length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-warning/5 border-warning/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" /> High Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {exceptions.filter(e => e.severity === 'High' && e.status === 'Open').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileWarning className="h-4 w-4 text-muted-foreground" /> Medium/Low Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {exceptions.filter(e => (e.severity === 'Medium' || e.severity === 'Low') && e.status === 'Open').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {filteredExceptions.map((exception) => (
          <Card key={exception.id} className={`overflow-hidden ${exception.status === 'Resolved' ? 'opacity-70' : ''}`}>
            <div className={`h-1 w-full ${
              exception.severity === 'Critical' ? 'bg-destructive' :
              exception.severity === 'High' ? 'bg-warning' :
              'bg-primary'
            }`} />
            <div className="flex flex-col md:flex-row">
              <div className="flex-1 p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="font-mono">{exception.projectCode}</Badge>
                      <Badge variant="outline" className="font-mono">{exception.wbs}</Badge>
                      <Badge variant="secondary" className="text-xs">{exception.type}</Badge>
                      {exception.status === 'Resolved' && <Badge variant="outline" className="text-success border-success bg-success/5">Resolved</Badge>}
                    </div>
                    <h3 className="text-xl font-semibold tracking-tight">{exception.title}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Financial Impact</div>
                    <div className="text-lg font-bold tabular-nums text-destructive">{formatCurrency(exception.impact)}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-md border border-border/50">
                  <div>
                    <h4 className="text-sm font-medium mb-1 text-muted-foreground">Observation</h4>
                    <p className="text-sm">{exception.observation}</p>
                  </div>
                  {exception.evidence && (
                    <div>
                      <h4 className="text-sm font-medium mb-1 text-muted-foreground">Evidence</h4>
                      <div className="flex items-center gap-1 text-sm text-primary cursor-pointer hover:underline">
                        <ArrowUpRight className="h-3 w-3" /> {exception.evidence}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-primary/5 p-4 rounded-md border border-primary/10">
                  <h4 className="text-sm font-medium mb-1 text-primary">System Recommendation</h4>
                  <p className="text-sm">{exception.recommendation}</p>
                </div>
              </div>
              
              <div className="w-full md:w-64 border-t md:border-t-0 md:border-l bg-muted/10 p-6 flex flex-col gap-3 justify-center">
                {exception.status === 'Open' ? (
                  <>
                    <Button 
                      className="w-full justify-start" 
                      onClick={() => setActionDialog({ isOpen: true, type: 'exception:recommend', exceptionId: exception.id })}
                    >
                      <Check className="h-4 w-4 mr-2" /> Accept Recommendation
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setActionDialog({ isOpen: true, type: 'exception:clarify', exceptionId: exception.id })}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" /> Request PM Clarification
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setActionDialog({ isOpen: true, type: 'exception:escalate', exceptionId: exception.id })}
                    >
                      <AlertCircle className="h-4 w-4 mr-2" /> Escalate to Controller
                    </Button>
                  </>
                ) : (
                  <div className="text-center space-y-2">
                    <Check className="h-8 w-8 text-success mx-auto" />
                    <div className="font-medium text-sm">Action Taken</div>
                    <div className="text-xs text-muted-foreground">{exception.decision}</div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
        {filteredExceptions.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No exceptions found matching the current criteria.
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={actionDialog.isOpen} onOpenChange={(open) => !open && setActionDialog({ isOpen: false, type: "", exceptionId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === 'exception:recommend' ? 'Accept System Recommendation' :
               actionDialog.type === 'exception:clarify' ? 'Request Clarification' :
               'Escalate Exception'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === 'exception:recommend' ? 'Provide any additional notes for accepting this recommendation.' :
               actionDialog.type === 'exception:clarify' ? 'Enter the question to be sent to the Project Manager.' :
               'Provide justification for escalating this item to the Financial Controller.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Details (Required)</Label>
              <Textarea 
                id="reason" 
                value={actionReason} 
                onChange={(e) => setActionReason(e.target.value)} 
                placeholder="Enter details here..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ isOpen: false, type: "", exceptionId: null })}>Cancel</Button>
            <Button onClick={handleActionSubmit} disabled={!actionReason} variant={
              actionDialog.type === 'exception:escalate' ? "destructive" : "default"
            }>
              Submit Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}