import { useState } from "react";
import { useGetControlTower, useGetAuditPackage, getGetAuditPackageQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, ShieldAlert, FileJson, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AuditPage() {
  const { data: ct, isLoading: isCtLoading } = useGetControlTower();
  const { data: auditPackage, isLoading: isAuditLoading, refetch: fetchAuditPackage } = useGetAuditPackage({
    query: { enabled: false, queryKey: getGetAuditPackageQueryKey() } // only fetch when explicitly requested
  });
  
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  if (isCtLoading || !ct) {
    return <div className="p-8 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-[400px] w-full" /></div>;
  }

  const { activity } = ct;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const { data } = await fetchAuditPackage();
      if (data) {
        // Create a blob and download it
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-package-${ct.meta.activePeriod}-${data.reference}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({ title: "Audit package downloaded successfully" });
      }
    } catch (e) {
      toast({ title: "Failed to generate audit package", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Audit & History</h2>
          <p className="text-muted-foreground">Immutable event history and compliance packaging.</p>
        </div>
        <Button onClick={handleDownload} disabled={isDownloading}>
          {isDownloading ? <Clock className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Download Audit Package
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="col-span-2 bg-muted/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" /> Chain of Custody
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              All decisions, recommendations accepted, and manual overrides are cryptographically sealed in the demo environment for SOC1 compliance simulation.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileJson className="h-4 w-4" /> Logged Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activity.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Log</CardTitle>
          <CardDescription>Chronological sequence of actions in {ct.meta.activePeriod}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Timestamp</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activity.slice().reverse().map((act) => (
                <TableRow key={act.id}>
                  <TableCell className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                    {new Date(act.time).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium text-sm">{act.actor}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal text-[10px]">{act.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-[10px]">{act.action}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {act.detail}
                    {act.project && <span className="ml-2 text-xs text-muted-foreground">[{act.project}]</span>}
                  </TableCell>
                </TableRow>
              ))}
              {activity.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    No activity recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}