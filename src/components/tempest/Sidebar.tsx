import { useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Dna,
  FlaskConical,
  BarChart3,
  Shield,
  MessageSquare,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Home,
  FileText,
  Database,
  GitBranch,
  Hexagon,
  BookOpen,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";

type Module = "home" | "overview" | "motf" | "gbsc" | "bctn" | "cnis" | "msrs" | "trajectory" | "tti" | "immune" | "predict" | "chat" | "report" | "datasources" | "article" | "claimaudit" | "wizard" | "asktempest" | "validation" | "sqlschema";

interface SidebarProps {
  active: Module;
  onNavigate: (module: Module) => void;
}

type ModuleItem = { id: Module; label: string; desc?: string; icon: typeof Home; step?: number };
type Section = { section: string; items: ModuleItem[] };

const sections: Section[] = [
  {
    section: "1 · Start",
    items: [
      { id: "home", label: "Home", icon: Home },
      { id: "wizard", label: "Analysis Wizard", desc: "Guided pipeline", icon: GitBranch, step: 1 },
      { id: "datasources", label: "Data Sources", desc: "Upload & Public DB", icon: Database, step: 2 },
    ],
  },
  {
    section: "2 · Decomposition & Staging",
    items: [
      { id: "motf", label: "MOTF", desc: "Tucker Decomposition", icon: Dna, step: 2 },
      { id: "gbsc", label: "GBSC", desc: "Survival Analysis", icon: Activity, step: 3 },
    ],
  },
  {
    section: "3 · Immune & Risk",
    items: [
      { id: "immune", label: "Immune & Risk", desc: "BCTN · CNIS · MSRS", icon: Shield, step: 4 },
    ],
  },
  {
    section: "4 · Predictive Modeling",
    items: [
      { id: "predict", label: "Predictive", desc: "Trajectory · TTI", icon: Hexagon, step: 5 },
      { id: "validation", label: "Validation Harness", desc: "Multi-cohort · LOOCV · Sealed", icon: FlaskConical, step: 6 },
    ],
  },
  {
    section: "5 · Synthesis & Output",
    items: [
      { id: "overview", label: "Results Dashboard", desc: "Integrated Findings", icon: LayoutDashboard, step: 6 },
      { id: "report", label: "Analysis Report", desc: "Full Report", icon: FileText, step: 7 },
      { id: "asktempest", label: "Ask TEMPEST", desc: "Grounded Q&A", icon: MessageSquare, step: 9 },
    ],
  },
  {
    section: "6 · Assistant",
    items: [
      { id: "chat", label: "AI Agent", desc: "NL Search & Q&A", icon: MessageSquare, step: 11 },
    ],
  },
];

const adminSection: Section = {
  section: "More · Admin",
  items: [
    { id: "article", label: "Article", desc: "Scientific Paper", icon: BookOpen },
    { id: "claimaudit", label: "Claim Audit", desc: "Phrase scan & gate", icon: Shield },
    { id: "sqlschema", label: "Project Schema", desc: "Backend tables & functions", icon: Database },
  ],
};

// Track grouped sub-modules so active highlighting works when nested
const groupedModules: Record<string, Module> = {
  bctn: "immune", cnis: "immune", msrs: "immune",
  trajectory: "predict", tti: "predict",
};

const Sidebar = ({ active, onNavigate }: SidebarProps) => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [collapsed, setCollapsed] = useState(false);
  const visibleSections = isAdmin ? [...sections, adminSection] : sections;

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.2 }}
      className="h-screen bg-sidebar border-r border-sidebar-border flex flex-col"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-md bg-sidebar-primary/20 flex items-center justify-center flex-shrink-0">
            <Dna className="w-5 h-5 text-sidebar-primary" />
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <span className="font-mono text-sm font-semibold text-sidebar-foreground tracking-wider">TEMPEST</span>
              <span className="block text-[10px] text-muted-foreground font-mono">v14 · research</span>
              <span className="block text-[9px] text-muted-foreground/80 leading-tight mt-0.5 max-w-[180px]">State-separation &amp; transition-dynamics</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-3 overflow-y-auto">
        {visibleSections.map((sec) => (
          <div key={sec.section} className="space-y-1">
            {!collapsed && (
              <div className="px-3 pt-1 pb-1 text-[9px] font-mono uppercase tracking-wider text-muted-foreground/70">
                {sec.section}
              </div>
            )}
            {sec.items.map((mod) => {
              const isActive = active === mod.id || groupedModules[active] === mod.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => onNavigate(mod.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-all duration-300 ease-in-out group relative ${
                    isActive
                      ? "bg-primary/15 text-primary shadow-sm"
                      : "text-sidebar-foreground hover:bg-primary/10 hover:text-primary hover:translate-x-1 hover:shadow-sm"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r"
                    />
                  )}
                  <mod.icon className={`w-4 h-4 flex-shrink-0 transition-all duration-300 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary group-hover:scale-110"}`} />
                  {!collapsed && (
                    <div className="overflow-hidden flex-1 flex items-center justify-between gap-2">
                      <div className="overflow-hidden">
                        <span className="text-sm font-medium block">{mod.label}</span>
                        {mod.desc && <span className="text-[10px] text-muted-foreground block transition-colors duration-300 group-hover:text-primary/60">{mod.desc}</span>}
                      </div>
                      {mod.step !== undefined && (
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${isActive ? "bg-primary/20 text-primary" : "bg-muted/40 text-muted-foreground"}`}>
                          {String(mod.step).padStart(2, "0")}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Account + collapse */}
      <div className="p-2 border-t border-sidebar-border space-y-1">
        <button
          onClick={() => signOut()}
          title={user?.email ? `Sign out (${user.email.split("@")[0]})` : "Sign out"}
          className={`w-full flex items-center ${collapsed ? "justify-center" : "justify-start gap-2 px-3"} py-2 text-muted-foreground hover:text-primary transition-all duration-300 rounded-md hover:bg-primary/10`}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && (
            <span className="text-xs font-mono truncate">
              Sign out{user?.email ? ` · ${user.email.split("@")[0]}` : ""}
            </span>
          )}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center py-2 text-muted-foreground hover:text-primary transition-all duration-300 rounded-md hover:bg-primary/10"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
export type { Module };
