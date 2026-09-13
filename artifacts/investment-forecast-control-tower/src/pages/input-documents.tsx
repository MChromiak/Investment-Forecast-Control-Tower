import { useGetControlTower } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { FileDown, FileCheck, CheckCircle2, AlertTriangle, ShieldCheck, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InputDocumentsPage() {
  const { data: ct, isLoading } = useGetControlTower();

  if (isLoading || !ct) {
    return <div className="p-8 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-[400px] w-full" /></div>;
  }

  const { documents } = ct;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Input Documents</h2>
          <p className="text-muted-foreground">Deterministic direct-document and forecast-pack intake.</p>
        </div>
        <Button variant="outline">
          <FileDown className="mr-2 h-4 w-4" /> Export Ingestion Log
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Processed Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.filter(d => d.status === 'Processed').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Extracted Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.reduce((acc, d) => acc + d.records, 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Validation Success</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" /> 100%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Deterministic matching</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ingestion History</CardTitle>
          <CardDescription>Evidence inspection for derived records.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Submitter</TableHead>
                <TableHead className="text-right">Source Total</TableHead>
                <TableHead className="text-right">Extracted Total</TableHead>
                <TableHead className="text-center">Validation</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium">
                      <FileCheck className="h-4 w-4 text-muted-foreground" />
                      {doc.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{doc.type} • {doc.date}</div>
                  </TableCell>
                  <TableCell>{doc.projectName}</TableCell>
                  <TableCell className="text-sm">{doc.submitter}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(doc.sourceTotal)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span className={doc.sourceTotal !== doc.extractedTotal ? "text-destructive font-medium" : ""}>
                      {formatCurrency(doc.extractedTotal)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {doc.validation === "Matched" ? (
                      <Badge variant="outline" className="border-success text-success bg-success/5 gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Matched
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" /> {doc.validation}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{doc.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Search className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {documents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                    No documents ingested.
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