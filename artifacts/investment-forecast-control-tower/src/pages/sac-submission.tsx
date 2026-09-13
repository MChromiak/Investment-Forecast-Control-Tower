import { useState } from "react";
import { useGetControlTower, usePerformControlTowerAction, getGetControlTowerQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, ShieldCheck, UploadCloud, AlertCircle, Ban, PauseCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SacSubmissionPage() {
  const { data: ct, isLoading } = useGetControlTower();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const performAction = usePerformControlTowerAction();
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading || !ct) {
    return <div className="p-8 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-[400px] w-full" /></div>;
  }

  const { batch, metrics } = ct;
  const totalRecords = batch.ready + batch.held + batch.blocked + batch.excluded;
  const readyPercent = totalRecords > 0 ? (batch.ready / totalRecords) * 100 : 0;

  const handleApproveBatch = () => {
    performAction.mutate({
      data: { action: 'batch:approve' }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetControlTowerQueryKey() });
        toast({ title: "Batch approved for submission" });
      }
    });
  };

  const handleSubmitSac = () => {
    setIsSubmitting(true);
    performAction.mutate({
      data: { action: 'batch:submit' }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetControlTowerQueryKey() });
        toast({ title: "Submission successful", description: "Receipt received from SAC." });
        setIsSubmitting(false);
      },
      onError: () => {
        setIsSubmitting(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">SAC Submission</h2>
        <p className="text-muted-foreground">Reconciled batch checks, approvals, and API submission.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-primary/20 shadow-md">
          <CardHeader className="bg-primary/5 pb-4">
            <div className="flex justify-between items-center mb-2">
              <Badge variant="outline" className="bg-background">Batch ID: {batch.id}</Badge>
              {batch.submitted ? (
                <Badge variant="outline" className="border-success text-success bg-success/10"><CheckCircle2 className="h-3 w-3 mr-1" /> Submitted</Badge>
              ) : batch.approved ? (
                <Badge variant="outline" className="border-primary text-primary bg-primary/10"><ShieldCheck className="h-3 w-3 mr-1" /> Approved</Badge>
              ) : (
                <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> In Progress</Badge>
              )}
            </div>
            <CardTitle className="text-3xl font-bold tabular-nums">{formatCurrency(batch.value)}</CardTitle>
            <CardDescription>Total proposed forecast value to be submitted</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Readiness Score</span>
                <span className="font-bold">{readyPercent.toFixed(0)}%</span>
              </div>
              <Progress value={readyPercent} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-success" /> Ready</div>
                <div className="text-xl font-semibold tabular-nums">{batch.ready} records</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground flex items-center gap-1"><PauseCircle className="h-4 w-4" /> Held</div>
                <div className="text-xl font-semibold tabular-nums">{batch.held} records</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground flex items-center gap-1"><Ban className="h-4 w-4 text-destructive" /> Blocked</div>
                <div className="text-xl font-semibold tabular-nums">{batch.blocked} records</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground flex items-center gap-1"><AlertCircle className="h-4 w-4" /> Excluded</div>
                <div className="text-xl font-semibold tabular-nums">{batch.excluded} records</div>
              </div>
            </div>

            {batch.unresolvedBlockers > 0 && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold">Unresolved Blockers: {batch.unresolvedBlockers}</span>
                  <p className="opacity-90">Cannot approve batch until all blockers are resolved or items are formally excluded.</p>
                </div>
              </div>
            )}
            
            {batch.submittedAt && (
              <div className="p-3 bg-muted/30 border border-border rounded-md text-sm">
                <div className="font-medium mb-1">Submission Receipt</div>
                <div className="text-xs font-mono text-muted-foreground break-all">{batch.receipt}</div>
                <div className="text-xs text-muted-foreground mt-1">Submitted at {new Date(batch.submittedAt).toLocaleString()}</div>
              </div>
            )}
            
          </CardContent>
          <CardFooter className="bg-muted/10 border-t p-4 flex gap-3 justify-end">
            {!batch.approved && !batch.submitted && (
              <Button 
                onClick={handleApproveBatch} 
                disabled={batch.unresolvedBlockers > 0 || batch.ready === 0}
                className="w-full sm:w-auto"
              >
                <ShieldCheck className="mr-2 h-4 w-4" /> Approve Batch
              </Button>
            )}
            {batch.approved && !batch.submitted && (
              <Button 
                onClick={handleSubmitSac} 
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting ? <span className="animate-pulse">Submitting...</span> : <><UploadCloud className="mr-2 h-4 w-4" /> Submit to SAC</>}
              </Button>
            )}
            {batch.submitted && (
              <Button variant="outline" className="w-full sm:w-auto">
                <CheckCircle2 className="mr-2 h-4 w-4 text-success" /> Submission Complete
              </Button>
            )}
          </CardFooter>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Pre-Flight Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                {batch.unresolvedBlockers === 0 ? <CheckCircle2 className="h-5 w-5 text-success" /> : <AlertCircle className="h-5 w-5 text-destructive" />}
                <div>
                  <div className="text-sm font-medium">All Blockers Resolved</div>
                  <div className="text-xs text-muted-foreground">Exceptions reviewed and actioned.</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {metrics.wbsRecords > 0 && batch.ready > 0 ? <CheckCircle2 className="h-5 w-5 text-success" /> : <AlertCircle className="h-5 w-5 text-muted-foreground" />}
                <div>
                  <div className="text-sm font-medium">Valid Ready Population</div>
                  <div className="text-xs text-muted-foreground">At least one record is marked ready.</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {batch.approved ? <CheckCircle2 className="h-5 w-5 text-success" /> : <ShieldCheck className="h-5 w-5 text-muted-foreground" />}
                <div>
                  <div className="text-sm font-medium">Controller Approval</div>
                  <div className="text-xs text-muted-foreground">Batch lock and seal.</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-muted/20 border-dashed">
            <CardContent className="p-6">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2"><UploadCloud className="h-4 w-4 text-primary" /> Target System: SAP Analytics Cloud</h3>
              <p className="text-xs text-muted-foreground mb-4">
                The payload will be transmitted to the SAC Planning Model (Model ID: INV_FCST_v4). 
                Held and excluded records will be dropped from the payload.
              </p>
              <div className="bg-background rounded border p-3 font-mono text-[10px] text-muted-foreground overflow-x-auto">
                {"{"}
                <br/>&nbsp;&nbsp;"period": "{ct.meta.activePeriod}",
                <br/>&nbsp;&nbsp;"currency": "GBP",
                <br/>&nbsp;&nbsp;"recordCount": {batch.ready},
                <br/>&nbsp;&nbsp;"payloadTotal": {batch.value}
                <br/>{"}"}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}