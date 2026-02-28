import { Activity, Clock, Database, Cpu } from "lucide-react";
import { useTempest } from "@/contexts/TempestContext";

const StatusBar = () => {
  const { pipelineRuns, cohorts } = useTempest();

  const isActive = pipelineRuns.some((r) => r.status === "running");
  const datasetCount = cohorts.length;
  const lastCompleted = pipelineRuns
    .filter((r) => r.completed_at)
    .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())[0];

  const completedCount = pipelineRuns.filter((r) => r.status === "complete").length;

  return (
    <header className="h-12 bg-card/50 border-b border-border flex items-center justify-between px-6 backdrop-blur-sm">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className={`status-indicator ${isActive ? "status-active" : "status-idle"}`} />
          <span className="text-xs font-mono text-muted-foreground">
            {isActive ? "PIPELINE ACTIVE" : "PIPELINE IDLE"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Database className="w-3.5 h-3.5" />
          <span className="text-xs font-mono">{datasetCount} dataset{datasetCount !== 1 ? "s" : ""} loaded</span>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Cpu className="w-3.5 h-3.5" />
          <span className="text-xs font-mono">{completedCount}/5 modules done</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Activity className="w-3.5 h-3.5" />
          <span className="text-xs font-mono">
            {lastCompleted ? `Last: ${new Date(lastCompleted.completed_at!).toLocaleTimeString()}` : "No runs yet"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-xs font-mono">{new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </header>
  );
};

export default StatusBar;
