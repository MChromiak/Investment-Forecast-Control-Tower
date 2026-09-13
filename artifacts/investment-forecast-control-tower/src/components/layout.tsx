import { Link, useLocation } from "wouter";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarProvider,
  SidebarTrigger,
  SidebarInset
} from "@/components/ui/sidebar";
import { 
  BarChart3, 
  Settings, 
  FileText, 
  GitPullRequest, 
  AlertCircle, 
  PieChart, 
  CheckSquare, 
  BookOpen, 
  ShieldAlert, 
  LayoutDashboard,
  PlayCircle
} from "lucide-react";
import { useGetControlTower } from "@workspace/api-client-react";

const NAV_ITEMS = [
  { path: "/", label: "Portfolio Overview", icon: LayoutDashboard },
  { path: "/forecast-cycle", label: "Forecast Cycle", icon: GitPullRequest },
  { path: "/input-documents", label: "Input Documents", icon: FileText },
  { path: "/wbs-forecast", label: "WBS Forecast", icon: BarChart3 },
  { path: "/exceptions", label: "Exceptions", icon: AlertCircle },
  { path: "/vowd", label: "VOWD Analysis", icon: PieChart },
  { path: "/sac-submission", label: "SAC Submission", icon: CheckSquare },
  { path: "/reports", label: "Reports & Insights", icon: BookOpen },
  { path: "/audit", label: "Audit & History", icon: ShieldAlert },
  { path: "/scenarios", label: "Demo Scenarios", icon: PlayCircle },
  { path: "/settings", label: "Configuration", icon: Settings },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: ct } = useGetControlTower();
  
  const unreadExceptions = ct?.exceptions?.filter(e => e.status === "Open").length || 0;
  
  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="h-16 border-b border-sidebar-border px-4 flex items-center">
            <div className="flex items-center gap-3 font-semibold text-sidebar-foreground truncate">
              <div className="h-6 w-6 rounded bg-primary flex items-center justify-center shrink-0">
                <BarChart3 className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="truncate group-data-[collapsible=icon]:hidden">Control Tower</span>
            </div>
          </SidebarHeader>
          <SidebarContent className="py-4">
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link href={item.path} className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span>{item.label}</span>
                        </div>
                        {item.path === "/exceptions" && unreadExceptions > 0 && (
                          <div className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full group-data-[collapsible=icon]:hidden">
                            {unreadExceptions}
                          </div>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="border-t border-sidebar-border p-4">
            <div className="flex flex-col gap-1 text-xs text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
              <div className="font-medium text-sidebar-foreground truncate">
                {ct?.meta.persona || "Investment Accountant"}
              </div>
              <div className="truncate">Period: {ct?.meta.activePeriod || "2023-P10"}</div>
            </div>
          </SidebarFooter>
      </Sidebar>
      
      <SidebarInset>
        <header className="h-16 bg-card border-b flex items-center px-4 md:px-6 shrink-0 z-10 sticky top-0">
            <SidebarTrigger className="-ml-2 mr-4" />
            <div className="flex items-center gap-4 flex-1">
              <h1 className="text-lg font-semibold tracking-tight">
                {NAV_ITEMS.find(n => n.path === location)?.label || "Workspace"}
              </h1>
            </div>
            {ct?.meta.guidedDemo && (
              <div className="hidden md:flex items-center gap-2 bg-warning/20 text-warning-foreground px-3 py-1 rounded-full text-xs font-medium border border-warning/30">
                <PlayCircle className="h-3 w-3" />
                <span>Demo Mode Active</span>
              </div>
            )}
          </header>
          
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
