import { useGetControlTower } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ComposedChart, Line } from "recharts";
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

export default function VowdPage() {
  const { data: ct, isLoading } = useGetControlTower();

  if (isLoading || !ct) {
    return <div className="p-8 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-[400px] w-full" /></div>;
  }

  const { records } = ct;
  
  // Aggregate VOWD view by project (illustrative mapping based on actual vs proposed)
  const projectAgg = ct.projects.map(p => {
    // Illustrative VOWD math based on actuals + movement heuristics
    const actuals = p.actuals;
    const commitments = p.actuals * 1.4; // fake commitment
    const vowdCalculated = actuals + (commitments * 0.2); // fake calculation
    const currentForecast = p.proposedForecast;
    
    return {
      name: p.code,
      actuals,
      commitments,
      vowd: vowdCalculated,
      forecast: currentForecast,
      risk: vowdCalculated > currentForecast ? "Overrun Risk" : (currentForecast - vowdCalculated > p.actuals * 2) ? "Underspend Risk" : "On Track",
      variance: currentForecast - vowdCalculated
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Value of Work Done (VOWD)</h2>
        <p className="text-muted-foreground">Accrual-readiness supporting view.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>VOWD vs Forecast by Project</CardTitle>
            <CardDescription>Visualizing accrual coverage and forecast alignment</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={projectAgg} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(val) => `£${(val/1000).toFixed(0)}k`} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <RechartsTooltip formatter={(val: number) => formatCurrency(val)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="vowd" name="Calculated VOWD" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actuals" name="Actuals Paid" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="forecast" name="Proposed Forecast" stroke="hsl(var(--chart-5))" strokeWidth={2} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accrual Readiness Analysis</CardTitle>
            <CardDescription>Illustrative risk indicators based on VOWD gap</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead className="text-right">VOWD</TableHead>
                  <TableHead className="text-right">Forecast</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead className="text-center">Risk Indicator</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectAgg.map((p) => (
                  <TableRow key={p.name}>
                    <TableCell className="font-medium font-mono text-sm">{p.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(p.vowd)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(p.forecast)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{formatCurrency(p.variance)}</TableCell>
                    <TableCell className="text-center">
                      {p.risk === "Overrun Risk" ? (
                        <Badge variant="destructive" className="bg-destructive/10 text-destructive border-transparent">
                          <AlertTriangle className="mr-1 h-3 w-3" /> Overrun
                        </Badge>
                      ) : p.risk === "Underspend Risk" ? (
                        <Badge variant="outline" className="text-warning border-warning bg-warning/10">
                          <TrendingDown className="mr-1 h-3 w-3" /> Underspend
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-success border-success bg-success/5">On Track</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}