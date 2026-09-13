import { useGetControlTower } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { AlertCircle, ArrowUpRight, BarChart3, CheckCircle2, FileWarning, TrendingDown, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function OverviewPage() {
  const { data: ct, isLoading } = useGetControlTower();

  if (isLoading || !ct) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const { metrics, projects } = ct;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Portfolio Overview</h2>
          <p className="text-muted-foreground">Period: {ct.meta.activePeriod}</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1 bg-background text-sm font-medium">
            {metrics.projectsInScope} Projects
          </Badge>
          <Badge variant="outline" className="px-3 py-1 bg-background text-sm font-medium">
            {metrics.wbsRecords} WBS Records
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proposed Forecast</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.proposedForecast)}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              {metrics.movement > 0 ? (
                <><TrendingUp className="h-3 w-3 text-destructive" /> {formatCurrency(Math.abs(metrics.movement))} up</>
              ) : metrics.movement < 0 ? (
                <><TrendingDown className="h-3 w-3 text-success" /> {formatCurrency(Math.abs(metrics.movement))} down</>
              ) : (
                "No movement"
              )}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actual Cost to Date</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.actualCost)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Incurred in {ct.meta.activePeriod}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready for SAC</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.readyForSac}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Out of {metrics.wbsRecords} records
            </p>
            <div className="w-full bg-secondary h-1.5 mt-2 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full" 
                style={{ width: `${(metrics.readyForSac / (metrics.wbsRecords || 1)) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Exceptions</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.openExceptions}</div>
            <p className="text-xs text-muted-foreground mt-1 text-destructive font-medium flex items-center gap-1">
              <FileWarning className="h-3 w-3" /> Requires attention
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Portfolio</CardTitle>
          <CardDescription>All projects in scope for {ct.meta.activePeriod} forecast cycle</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Code</TableHead>
                <TableHead>Project Name</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead className="text-right">Proposed Forecast</TableHead>
                <TableHead className="text-right">Movement</TableHead>
                <TableHead className="text-center">Exceptions</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-mono text-xs">{project.code}</TableCell>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-[10px]">{project.tier}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(project.proposedForecast)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span className={project.movement > 0 ? "text-destructive" : project.movement < 0 ? "text-primary" : ""}>
                      {project.movement > 0 ? "+" : ""}{formatCurrency(project.movement)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {project.exceptions > 0 ? (
                      <Badge variant="destructive" className="h-5 min-w-[20px] px-1 justify-center">{project.exceptions}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant={project.readiness === "Ready" ? "outline" : "secondary"} 
                      className={
                        project.readiness === "Ready" ? "border-primary text-primary" : 
                        project.readiness === "Blocked" ? "bg-destructive/10 text-destructive border-transparent" : 
                        ""
                      }
                    >
                      {project.readiness}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/wbs-forecast?project=${project.id}`} className="text-muted-foreground hover:text-primary transition-colors block p-2">
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {projects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                    No projects found for this period.
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
