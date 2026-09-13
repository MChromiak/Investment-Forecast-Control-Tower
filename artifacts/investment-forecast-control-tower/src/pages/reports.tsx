import { useGetControlTower } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, FileWarning } from "lucide-react";

export default function ReportsPage() {
  const { data: ct, isLoading } = useGetControlTower();

  if (isLoading || !ct) {
    return <div className="p-8 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-[400px] w-full" /></div>;
  }

  const { projects, exceptions } = ct;
  
  // Data for Forecast Bridge (Waterfall simplified to Bar)
  const bridgeData = [
    { name: "Prior FC", value: projects.reduce((acc, p) => acc + p.existingForecast, 0) },
    { name: "Movements", value: projects.reduce((acc, p) => acc + p.movement, 0) },
    { name: "Proposed FC", value: projects.reduce((acc, p) => acc + p.proposedForecast, 0) },
  ];

  // Data for exception types
  const exceptionTypes = exceptions.reduce((acc: Record<string, number>, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {});
  const exceptionData = Object.entries(exceptionTypes).map(([name, value]) => ({ name, value }));
  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reports & Insights</h2>
        <p className="text-muted-foreground">Reconciled charts, narrative insights, risks and opportunities.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Forecast Bridge Summary</CardTitle>
            <CardDescription>Movement from prior cycle to current proposal</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bridgeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(val) => `£${(val/1000).toFixed(0)}k`} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <RechartsTooltip formatter={(val: number) => formatCurrency(val)} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                  {bridgeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={
                      entry.name === 'Movements' ? (entry.value > 0 ? 'hsl(var(--destructive))' : 'hsl(var(--success))') : 'hsl(var(--primary))'
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exception Distribution</CardTitle>
            <CardDescription>Breakdown by variance trigger type</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {exceptionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={exceptionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {exceptionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted-foreground flex flex-col items-center">
                <FileWarning className="h-8 w-8 mb-2 opacity-20" />
                No exceptions to chart.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Narrative Insights</CardTitle>
            <CardDescription>AI-generated draft for submission commentary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/30 p-6 rounded-md border border-border/50 text-sm space-y-4">
              <p>
                <strong>Portfolio Summary:</strong> The {ct.meta.activePeriod} forecast cycle sees a total proposed forecast of {formatCurrency(ct.metrics.proposedForecast)}, representing a net movement of {formatCurrency(ct.metrics.movement)} compared to the prior period.
              </p>
              <p>
                <strong>Key Drivers:</strong> The primary driver of this movement is project 
                {projects.reduce((max, p) => Math.abs(p.movement) > Math.abs(max.movement) ? p : max, projects[0])?.name || 'various'} 
                which experienced a significant adjustment.
              </p>
              <div className="flex items-start gap-2 text-warning bg-warning/5 p-3 rounded border border-warning/10 mt-4">
                <TrendingUp className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <strong>Risk Opportunity:</strong> There are {ct.metrics.openExceptions} open exceptions requiring final triage. Delaying submission past period-close risks late-accrual penalties.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}