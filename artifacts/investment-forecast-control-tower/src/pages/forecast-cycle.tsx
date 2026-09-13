import { useGetControlTower } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, GitCommit, Search, ListFilter, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function ForecastCyclePage() {
  const { data: ct, isLoading } = useGetControlTower();

  if (isLoading || !ct) {
    return <div className="p-8 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-[400px] w-full" /></div>;
  }

  const { meta, metrics } = ct;
  
  const steps = [
    {
      id: "intake",
      title: "1. Document Intake",
      description: "Ingest structured project packs, PM updates, and cost reports.",
      icon: FileText,
      status: "complete",
      count: ct.documents.length,
      link: "/input-documents"
    },
    {
      id: "derived",
      title: "2. Derived WBS Generation",
      description: "Translate PM-level updates into financial WBS line items.",
      icon: GitCommit,
      status: "complete",
      count: metrics.wbsRecords,
      link: "/wbs-forecast"
    },
    {
      id: "exceptions",
      title: "3. Exception Triage",
      description: "Review auto-flagged variances, methodology changes, and VOWD risks.",
      icon: AlertCircle,
      status: metrics.openExceptions > 0 ? "active" : "complete",
      count: metrics.openExceptions,
      link: "/exceptions"
    },
    {
      id: "review",
      title: "4. Accountant Review",
      description: "Line-by-line inspection, commentary, and adjustment.",
      icon: Search,
      status: "pending",
      count: metrics.wbsRecords - metrics.readyForSac - metrics.openExceptions,
      link: "/wbs-forecast"
    },
    {
      id: "submission",
      title: "5. SAC Submission",
      description: "Batch approval and API transmission to Corporate FP&A.",
      icon: ListFilter,
      status: "pending",
      count: metrics.readyForSac,
      link: "/sac-submission"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Forecast Cycle</h2>
        <p className="text-muted-foreground">Operational workflow for {meta.activePeriod}</p>
      </div>

      <div className="grid gap-6">
        {steps.map((step, index) => (
          <Card key={step.id} className={`border-l-4 ${
            step.status === 'active' ? 'border-l-primary shadow-sm' : 
            step.status === 'complete' ? 'border-l-success bg-muted/20' : 
            'border-l-muted'
          }`}>
            <CardContent className="p-6 flex flex-col md:flex-row gap-6 md:items-center">
              <div className={`p-4 rounded-full ${
                step.status === 'active' ? 'bg-primary/10 text-primary' : 
                step.status === 'complete' ? 'bg-success/10 text-success' : 
                'bg-muted text-muted-foreground'
              }`}>
                <step.icon className="h-6 w-6" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{step.title}</h3>
                  {step.status === 'active' && <Badge variant="default" className="text-[10px] h-5">Current Phase</Badge>}
                  {step.status === 'complete' && <Badge variant="outline" className="text-[10px] h-5 text-success border-success">Completed</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
              <div className="flex items-center gap-4 md:flex-col md:items-end">
                <div className="text-2xl font-bold font-mono">
                  {step.count} <span className="text-sm text-muted-foreground font-sans font-normal">items</span>
                </div>
                <Button asChild variant={step.status === 'active' ? "default" : "outline"} size="sm">
                  <Link href={step.link}>
                    View <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}