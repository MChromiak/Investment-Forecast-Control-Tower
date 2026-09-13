import { useState } from "react";
import { useGetControlTower, usePerformControlTowerAction, getGetControlTowerQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, FileWarning, History, Check, Ban, PauseCircle, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function WbsForecastPage() {
  const { data: ct, isLoading } = useGetControlTower();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const performAction = usePerformControlTowerAction();
  
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [actionDialog, setActionDialog] = useState<{ isOpen: boolean, type: string, recordId: string | null }>({ isOpen: false, type: "", recordId: null });
  const [actionReason, setActionReason] = useState("");
  const [actionValue, setActionValue] = useState("");

  if (isLoading || !ct) {
    return <div className="p-8 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-[400px] w-full" /></div>;
  }

  const { projects, records } = ct;
  
  const filteredRecords = selectedProjectId === "all" 
    ? records 
    : records.filter(r => r.projectId === selectedProjectId);

  const handleActionSubmit = () => {
    if (!actionDialog.recordId) return;
    
    performAction.mutate({
      data: {
        action: actionDialog.type,
        recordId: actionDialog.recordId,
        reason: actionReason,
        value: actionDialog.type === 'record:modify' ? Number(actionValue) : undefined
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetControlTowerQueryKey() });
        toast({ title: "Action applied successfully" });
        setActionDialog({ isOpen: false, type: "", recordId: null });
        setActionReason("");
        setActionValue("");
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "Ready": return <Badge variant="outline" className="border-success text-success bg-success/5"><Check className="h-3 w-3 mr-1" /> Ready</Badge>;
      case "Held": return <Badge variant="secondary"><PauseCircle className="h-3 w-3 mr-1" /> Held</Badge>;
      case "Blocked": return <Badge variant="destructive"><Ban className="h-3 w-3 mr-1" /> Blocked</Badge>;
      case "Excluded": return <Badge variant="outline" className="text-muted-foreground"><Ban className="h-3 w-3 mr-1" /> Excluded</Badge>;
      case "Exception": return <Badge variant="destructive" className="bg-destructive/10 text-destructive border-transparent"><FileWarning className="h-3 w-3 mr-1" /> Exception</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">WBS Forecast</h2>
          <p className="text-muted-foreground">Line-level forecast workspace and decision history.</p>
        </div>
        
        <div className="flex gap-2 items-center">
          <Label htmlFor="project-filter" className="sr-only">Filter by Project</Label>
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger id="project-filter" className="w-[280px]">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects ({projects.length})</SelectItem>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.code} - {p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="border-b bg-muted/20 p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search WBS, Description, or Component..." className="w-full bg-background pl-9 border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0" />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">WBS Element</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Component</TableHead>
                <TableHead className="text-right">Actual Cost</TableHead>
                <TableHead className="text-right">Existing FC</TableHead>
                <TableHead className="text-right">Proposed FC</TableHead>
                <TableHead className="text-right">Movement</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Exception</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow key={record.id} className="hover:bg-muted/50 transition-colors group">
                  <TableCell className="font-mono text-xs">{record.wbs}</TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{record.description}</div>
                    {selectedProjectId === "all" && <div className="text-[10px] text-muted-foreground">{record.projectCode}</div>}
                  </TableCell>
                  <TableCell><Badge variant="secondary" className="font-normal text-[10px]">{record.component}</Badge></TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(record.actual)}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{formatCurrency(record.existing)}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">{formatCurrency(record.proposed)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span className={record.movement > 0 ? "text-destructive" : record.movement < 0 ? "text-primary" : "text-muted-foreground"}>
                      {record.movement > 0 ? "+" : ""}{formatCurrency(record.movement)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(record.review)}
                  </TableCell>
                  <TableCell className="text-center">
                    {record.exception !== "None" ? (
                       <Link href={`/exceptions?wbs=${record.wbs}`}>
                         <Badge variant="destructive" className="cursor-pointer hover:bg-destructive/80">Yes</Badge>
                       </Link>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setActionDialog({ isOpen: true, type: 'record:approve', recordId: record.id })}>
                          <Check className="h-4 w-4 mr-2 text-success" /> Approve for SAC
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActionDialog({ isOpen: true, type: 'record:hold', recordId: record.id })}>
                          <PauseCircle className="h-4 w-4 mr-2" /> Hold for Review
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActionDialog({ isOpen: true, type: 'record:block', recordId: record.id })}>
                          <Ban className="h-4 w-4 mr-2 text-destructive" /> Block Submission
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActionDialog({ isOpen: true, type: 'record:modify', recordId: record.id })}>
                          <TrendingUp className="h-4 w-4 mr-2" /> Modify Value
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredRecords.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-6 text-muted-foreground">
                    No records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={actionDialog.isOpen} onOpenChange={(open) => !open && setActionDialog({ isOpen: false, type: "", recordId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === 'record:approve' ? 'Approve Record for SAC' :
               actionDialog.type === 'record:hold' ? 'Hold Record' :
               actionDialog.type === 'record:block' ? 'Block Record' :
               'Modify Forecast Value'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === 'record:modify' ? 
                "Enter the new proposed forecast value and a mandatory business reason." : 
                "Please provide a reason for this decision. This will be recorded in the audit log."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {actionDialog.type === 'record:modify' && (
              <div className="space-y-2">
                <Label htmlFor="value">New Proposed Value (GBP)</Label>
                <Input 
                  id="value" 
                  type="number" 
                  value={actionValue} 
                  onChange={(e) => setActionValue(e.target.value)} 
                  placeholder="e.g. 50000"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Required)</Label>
              <Input 
                id="reason" 
                value={actionReason} 
                onChange={(e) => setActionReason(e.target.value)} 
                placeholder="e.g. Reviewed with PM, pending formal PO..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ isOpen: false, type: "", recordId: null })}>Cancel</Button>
            <Button onClick={handleActionSubmit} disabled={!actionReason || (actionDialog.type === 'record:modify' && !actionValue)} variant={
              actionDialog.type === 'record:block' ? "destructive" : "default"
            }>
              Confirm Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}