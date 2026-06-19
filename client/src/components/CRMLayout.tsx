import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  Bell,
  Building2,
  CalendarDays,
  ChevronRight,
  FileSignature,
  FileText,
  Gift,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  PanelLeft,
  Settings,
  Timer,
  Users,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Users, label: "Leads", path: "/leads" },
  { icon: CalendarDays, label: "Reuniões", path: "/meetings" },
  { icon: FileText, label: "Propostas", path: "/proposals" },
  { icon: FileSignature, label: "Contratos", path: "/contracts" },
  { icon: MessageSquare, label: "Follow-ups", path: "/follow-ups" },
  { icon: Timer, label: "Trial", path: "/trials" },
  { icon: Gift, label: "Indicações", path: "/referrals" },
  { icon: Settings, label: "Configurações", path: "/settings" },
];

const SIDEBAR_WIDTH_KEY = "crm-sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 360;

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-3 mb-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold gold-text">Morro Digital</span>
            </div>
            <span className="text-sm text-muted-foreground font-medium tracking-widest uppercase">CRM Comercial</span>
          </div>
          <div className="glass-card rounded-xl p-8 w-full flex flex-col gap-6">
            <div className="flex flex-col gap-2 text-center">
              <h1 className="text-xl font-semibold">Acesso Restrito</h1>
              <p className="text-sm text-muted-foreground">Faça login para acessar o painel de gestão comercial.</p>
            </div>
            <Button onClick={() => { window.location.href = getLoginUrl(); }} size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
              Entrar no Sistema
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <CRMLayoutContent setSidebarWidth={setSidebarWidth}>{children}</CRMLayoutContent>
    </SidebarProvider>
  );
}

function CRMLayoutContent({ children, setSidebarWidth }: { children: React.ReactNode; setSidebarWidth: (w: number) => void }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { data: metrics } = trpc.metrics.funnel.useQuery(undefined, { refetchInterval: 30000 });

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const left = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - left;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r border-border/50" disableTransition={isResizing}>
          <SidebarHeader className="h-16 justify-center border-b border-border/30">
            <div className="flex items-center gap-3 px-2 w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none shrink-0"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm gold-text tracking-tight">Morro Digital</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest">CRM Comercial</span>
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 py-2">
            <SidebarMenu className="px-2 gap-0.5">
              {menuItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={active}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-9 transition-all font-normal rounded-lg ${active ? "bg-primary/10 text-primary border-l-2 border-primary" : "hover:bg-accent/50"}`}
                    >
                      <item.icon className={`h-4 w-4 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={active ? "font-medium" : ""}>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>

            {!isCollapsed && metrics && (
              <div className="mx-3 mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Resumo</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center">
                    <p className="text-lg font-bold text-primary">{metrics.total}</p>
                    <p className="text-[10px] text-muted-foreground">Leads</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-emerald-400">{metrics.converted}</p>
                    <p className="text-[10px] text-muted-foreground">Clientes</p>
                  </div>
                </div>
              </div>
            )}
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-border/30">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent/50 transition-colors w-full text-left focus:outline-none">
                  <Avatar className="h-8 w-8 border border-border shrink-0">
                    <AvatarFallback className="text-xs font-semibold bg-primary/20 text-primary">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{user?.name || "Usuário"}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{user?.email || ""}</p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        <div className="flex border-b border-border/30 h-14 items-center justify-between bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="h-8 w-8 rounded-lg" />
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              {menuItems.find((m) => isActive(m.path)) && (
                <>
                  <span className="text-foreground font-medium">
                    {menuItems.find((m) => isActive(m.path))?.label}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {metrics && (
              <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/5">
                {metrics.conversionRate}% conversão
              </Badge>
            )}
          </div>
        </div>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
