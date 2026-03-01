import { useState } from "react";
import Sidebar, { type Module } from "@/components/tempest/Sidebar";
import StatusBar from "@/components/tempest/StatusBar";
import OverviewPanel from "@/components/tempest/OverviewPanel";
import ModulePanel from "@/components/tempest/ModulePanel";
import ChatPanel, { type CohortPayload } from "@/components/tempest/ChatPanel";
import HomePanel from "@/components/tempest/HomePanel";
import ReportPanel from "@/components/tempest/ReportPanel";
import { TempestProvider } from "@/contexts/TempestContext";

const Index = () => {
  const [active, setActive] = useState<Module>("home");
  const [cohort, setCohort] = useState<CohortPayload | null>(null);

  const renderContent = () => {
    switch (active) {
      case "home":
        return <HomePanel onNavigate={(m) => setActive(m as Module)} />;
      case "overview":
        return <OverviewPanel />;
      case "chat":
        return <ChatPanel onNavigate={(m) => setActive(m as Module)} onCohortLoaded={setCohort} />;
      case "report":
        return <ReportPanel />;
      default:
        return <ModulePanel module={active} cohort={cohort} />;
    }
  };

  return (
    <TempestProvider>
      <div className="flex h-screen bg-background gradient-mesh">
        <Sidebar active={active} onNavigate={setActive} />
        <div className="flex-1 flex flex-col min-w-0">
          <StatusBar />
          <main className="flex-1 overflow-y-auto">{renderContent()}</main>
        </div>
      </div>
    </TempestProvider>
  );
};

export default Index;
