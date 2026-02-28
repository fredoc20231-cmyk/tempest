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
} from "lucide-react";

type Module = "overview" | "motf" | "gbsc" | "bctn" | "cnis" | "msrs" | "chat";

interface SidebarProps {
  active: Module;
  onNavigate: (module: Module) => void;
}

const modules = [
  { id: "overview" as Module, label: "Overview", icon: LayoutDashboard },
  { id: "motf" as Module, label: "MOTF", desc: "Tucker Decomposition", icon: Dna },
  { id: "gbsc" as Module, label: "GBSC", desc: "Survival Analysis", icon: Activity },
  { id: "bctn" as Module, label: "BCTN", desc: "Clonal Dynamics", icon: FlaskConical },
  { id: "cnis" as Module, label: "CNIS", desc: "Neoantigen Intel", icon: Shield },
  { id: "msrs" as Module, label: "MSRS", desc: "Risk Scoring", icon: BarChart3 },
  { id: "chat" as Module, label: "AI Agent", desc: "NL Search", icon: MessageSquare },
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
          <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Dna className="w-5 h-5 text-primary" />
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-all duration-200 group relative ${
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-sidebar-foreground hover:bg-primary/10 hover:text-primary"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r"
                />
              )}
              <mod.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`} />
              {!collapsed && (
                <div className="overflow-hidden">
                  <span className="text-sm font-medium block">{mod.label}</span>
                  {mod.desc && <span className="text-[10px] text-muted-foreground block">{mod.desc}</span>}
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
          className="w-full flex items-center justify-center py-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
export type { Module };
