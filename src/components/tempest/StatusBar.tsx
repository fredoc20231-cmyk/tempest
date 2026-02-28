import { Activity, Clock, Database, Cpu } from "lucide-react";

const StatusBar = () => (
  <header className="h-12 bg-card/50 border-b border-border flex items-center justify-between px-6 backdrop-blur-sm">
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2">
        <div className="status-indicator status-active" />
        <span className="text-xs font-mono text-muted-foreground">PIPELINE ACTIVE</span>
      </div>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Database className="w-3.5 h-3.5" />
        <span className="text-xs font-mono">3 datasets loaded</span>
      </div>
    </div>
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Cpu className="w-3.5 h-3.5" />
        <span className="text-xs font-mono">GPU: 42% util</span>
      </div>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Activity className="w-3.5 h-3.5" />
        <span className="text-xs font-mono">Latency: 24ms</span>
      </div>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Clock className="w-3.5 h-3.5" />
        <span className="text-xs font-mono">{new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  </header>
);

export default StatusBar;
