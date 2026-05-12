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
} from "lucide-react";

type Module = "home" | "overview" | "motf" | "gbsc" | "bctn" | "cnis" | "msrs" | "trajectory" | "tti" | "chat" | "report" | "datasources" | "article";

interface SidebarProps {
  active: Module;
  onNavigate: (module: Module) => void;
}

type ModuleItem = { id: Module; label: string; desc?: string; icon: typeof Home; step?: number };
type Section = { section: string; items: ModuleItem[] };

const sections: Section[] = [
  {
    section: "1 · Getting Started",
    items: [
      { id: "home", label: "Home", icon: Home },
      { id: "datasources", label: "Data Sources", desc: "Upload & Public DB", icon: Database, step: 1 },
      { id: "overview", label: "Overview", desc: "Dashboard", icon: LayoutDashboard, step: 2 },
    ],
  },
  {
    section: "2 · Decomposition",
    items: [
      { id: "motf", label: "MOTF", desc: "Tucker Decomposition", icon: Dna, step: 3 },
    ],
  },
  {
    section: "3 · Survival & Clonal",
    items: [
      { id: "gbsc", label: "GBSC", desc: "Survival Analysis", icon: Activity, step: 4 },
      { id: "bctn", label: "BCTN", desc: "Clonal Dynamics", icon: FlaskConical, step: 5 },
    ],
  },
  {
    section: "4 · Immune & Risk",
    items: [
      { id: "cnis", label: "CNIS", desc: "Neoantigen Intel", icon: Shield, step: 6 },
      { id: "msrs", label: "MSRS", desc: "Risk Scoring", icon: BarChart3, step: 7 },
    ],
  },
  {
    section: "5 · Predictive Modeling",
    items: [
      { id: "trajectory", label: "Trajectory", desc: "Bifurcation Prediction", icon: GitBranch, step: 8 },
      { id: "tti", label: "TTI Platform", desc: "Topological Transition Index", icon: Hexagon, step: 9 },
    ],
  },
  {
    section: "6 · Intelligence & Output",
    items: [
      { id: "chat", label: "AI Agent", desc: "NL Search", icon: MessageSquare, step: 10 },
      { id: "report", label: "Analysis Report", desc: "Full Report", icon: FileText, step: 11 },
      { id: "article", label: "Article", desc: "Scientific Paper", icon: BookOpen, step: 12 },
    ],
  },
];

const Sidebar = ({ active, onNavigate }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);

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
              <span className="block text-[10px] text-muted-foreground font-mono">v2.1.0</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-hidden">
        {modules.map((mod) => {
          const isActive = active === mod.id;
          return (
            <button
              key={mod.id}
              onClick={() => onNavigate(mod.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-all duration-300 ease-in-out group relative ${
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
                <div className="overflow-hidden">
                  <span className="text-sm font-medium block">{mod.label}</span>
                  {mod.desc && <span className="text-[10px] text-muted-foreground block transition-colors duration-300 group-hover:text-primary/60">{mod.desc}</span>}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-sidebar-border">
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
