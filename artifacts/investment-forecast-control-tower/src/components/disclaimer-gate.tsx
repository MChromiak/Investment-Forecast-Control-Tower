import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function DisclaimerGate({ children }: { children: React.ReactNode }) {
  const [accepted, setAccepted] = useState(true); // default true to avoid flash, then check
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const hasAccepted = sessionStorage.getItem('control-tower-demo-accepted');
    if (!hasAccepted) {
      setAccepted(false);
    }
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (accepted) {
    return <>{children}</>;
  }

  const handleAccept = () => {
    sessionStorage.setItem('control-tower-demo-accepted', 'true');
    setAccepted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <Card className="max-w-lg w-full shadow-2xl border-primary/20">
        <CardHeader className="space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Investment Forecast Control Tower</CardTitle>
          <CardDescription className="text-base">
            Demonstration Environment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Simulated Systems</AlertTitle>
            <AlertDescription>
              All external systems, including SAP Analytics Cloud (SAC), project management tools, and AI services are simulated in this environment. 
              No real data is transmitted or received.
            </AlertDescription>
          </Alert>
          <div className="text-sm text-muted-foreground space-y-3">
            <p>
              This workspace is designed for investment accountants managing WBS (Work Breakdown Structure) forecasts from source evidence through controlled review and simulated submission.
            </p>
            <p>
              Values are represented in British Pounds (GBP).
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => window.alert('Assumptions: 1. All records are illustrative. 2. SAC is simulated. 3. VOWD thresholds are hardcoded for demo purposes.')}>
            View Assumptions
          </Button>
          <Button onClick={handleAccept}>
            Enter Demo
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
